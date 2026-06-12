import 'server-only';
import { adminBucket } from './firebase-admin';

/**
 * Uploads a file buffer to Google Cloud Storage (Firebase Storage)
 * and returns the public URL.
 */
export async function uploadToGCS(
  buffer: Buffer,
  destinationPath: string,
  contentType: string
): Promise<string> {
  try {
    const file = adminBucket.file(destinationPath);
    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Construct the public storage URL
    return `https://storage.googleapis.com/${adminBucket.name}/${destinationPath}`;
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw new Error('Failed to upload file to storage');
  }
}
