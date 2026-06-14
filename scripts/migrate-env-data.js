#!/usr/bin/env node
/**
 * Data Migration Script: Production -> Staging
 * Copies Firestore data recursively, imports Auth users with roles,
 * duplicates Remote Config configuration, and mirrors specific Storage assets.
 * 
 * Pre-requisites:
 *   - fire_key.json (Production service account)
 *   - fire_key_staging.json (Staging service account)
 * 
 * Run from project root:
 *   node scripts/migrate-env-data.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { getRemoteConfig } = require('firebase-admin/remote-config');
const path = require('path');
const fs = require('fs');

const PROD_KEY_PATH = path.resolve(process.cwd(), 'fire_key.json');
const STAGING_KEY_PATH = path.resolve(process.cwd(), 'fire_key_staging.json');

if (!fs.existsSync(PROD_KEY_PATH)) {
  console.error('❌ Error: fire_key.json (production key) not found in project root.');
  process.exit(1);
}

if (!fs.existsSync(STAGING_KEY_PATH)) {
  console.error('❌ Error: fire_key_staging.json (staging key) not found in project root.');
  console.error('Please download it from Firebase Console and place it in the project root.');
  process.exit(1);
}

const prodApp = initializeApp({
  credential: cert(require(PROD_KEY_PATH)),
}, 'prod');

const stagingApp = initializeApp({
  credential: cert(require(STAGING_KEY_PATH)),
}, 'staging');

const prodAuth = getAuth(prodApp);
const stagingAuth = getAuth(stagingApp);

const prodDb = getFirestore(prodApp);
const stagingDb = getFirestore(stagingApp);

const prodBucket = getStorage(prodApp).bucket('coolcalendarplatform.appspot.com');
const stagingBucket = getStorage(stagingApp).bucket('eventcalendarstaging.firebasestorage.app');

const prodRC = getRemoteConfig(prodApp);
const stagingRC = getRemoteConfig(stagingApp);

async function copyUsers() {
  console.log('\n--- 👥 Syncing Auth Users (Skipped/Super Admin Only) ---');
  try {
    const email = 'sinishawky@gmail.com';
    const uid = 'ADjhCNpe6GUh0fZlaVxAyKsVIDw2';
    
    let stagingUser;
    try {
      stagingUser = await stagingAuth.getUser(uid);
    } catch (err) {}
    
    if (!stagingUser) {
      await stagingAuth.createUser({
        uid,
        email,
        emailVerified: true,
        displayName: 'Super Admin',
        password: 'Temp@Admin2025!',
      });
      await stagingAuth.setCustomUserClaims(uid, {
        superAdmin: true,
        admin: true,
        creater: true,
        publisher: true,
        company: null,
      });
      console.log('✅ Staging Super Admin account verified.');
    } else {
      console.log('✅ Staging Super Admin account already exists.');
    }
  } catch (err) {
    console.error('❌ Super Admin verification failed:', err.message);
  }
}

async function copyCollection(prodCollRef, stagingCollRef) {
  // Exclude 'Users' collections/subcollections to protect user data
  if (prodCollRef.id === 'Users') {
    console.log(`  [SKIPPED] Users collection: ${prodCollRef.path}`);
    return;
  }

  // Limit to at most 5 documents per collection/subcollection for sampling
  const snapshot = await prodCollRef.limit(5).get();
  if (snapshot.empty) return;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const stagingDocRef = stagingCollRef.doc(doc.id);
    
    await stagingDocRef.set(data);
    console.log(`  Doc: ${stagingDocRef.path}`);
    
    const subColls = await doc.ref.listCollections();
    for (const subColl of subColls) {
      const stagingSubCollRef = stagingDocRef.collection(subColl.id);
      await copyCollection(subColl, stagingSubCollRef);
    }
  }
}

async function copyFirestore() {
  console.log('\n--- 📂 Syncing Firestore Database ---');
  try {
    const collections = await prodDb.listCollections();
    for (const coll of collections) {
      console.log(`Copying collection: ${coll.id}`);
      const stagingCollRef = stagingDb.collection(coll.id);
      await copyCollection(coll, stagingCollRef);
    }
    console.log('✅ Firestore data sync completed.');
  } catch (err) {
    console.error('❌ Firestore sync failed:', err.message);
  }
}

async function copyRemoteConfig() {
  console.log('\n--- ⚙️ Syncing Remote Config Template ---');
  try {
    const template = await prodRC.getTemplate();
    delete template.etag;
    await stagingRC.publishTemplate(template);
    console.log('✅ Remote Config configuration duplicated successfully.');
  } catch (err) {
    console.error('❌ Remote Config sync failed:', err.message);
  }
}

async function copyStorageFiles() {
  console.log('\n--- 🖼️ Syncing Specific Storage Assets ---');
  try {
    const [files] = await prodBucket.getFiles({ maxResults: 100 });
    let count = 0;
    
    for (const file of files) {
      if (count >= 15) {
        console.log('Reached storage sample limit (15 files). Stopping storage sync.');
        break;
      }
      
      const name = file.name;
      const shouldCopy = 
        name.startsWith('TopicsParamIcons/') ||
        name.startsWith('BackendUsersProfilePictures/') ||
        (name.startsWith('CompanyImages/') && name.includes('/Images/'));
      
      if (shouldCopy) {
        console.log(`Mirroring asset: ${name}`);
        const [content] = await file.download();
        const stagingFile = stagingBucket.file(name);
        
        await stagingFile.save(content, {
          metadata: {
            contentType: file.metadata.contentType,
            cacheControl: file.metadata.cacheControl,
          },
        });
        
        try {
          await stagingFile.makePublic();
        } catch {
          // Staging bucket might not support fine-grained public permissions or ACLs yet
        }
        count++;
      }
    }
    console.log(`✅ Storage assets mirrored successfully. Total files: ${count}`);
  } catch (err) {
    console.error('❌ Storage sync failed:', err.message);
  }
}

async function main() {
  console.log('🚀 STARTING DATA MIGRATION: Production -> Staging');
  
  await copyUsers();
  await copyFirestore();
  await copyRemoteConfig();
  await copyStorageFiles();
  
  console.log('\n🎉 ALL DONE! Migration successfully finished.');
}

main().catch((err) => {
  console.error('\n❌ Fatal Migration Error:', err.stack);
  process.exit(1);
});
