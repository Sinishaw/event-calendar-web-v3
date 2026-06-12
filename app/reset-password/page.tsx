import '../login/login.css';
import ResetPasswordForm from './ResetPasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
};

export default function ResetPasswordPage() {
  return (
    <main className="login-root">
      {/* Ambient background glow */}
      <div className="login-glow" aria-hidden />

      <div className="login-panel fade-up">
        {/* Logo / Brand */}
        <div className="login-brand">
          <div className="login-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
              <rect width="28" height="28" rx="8" fill="var(--accent)" />
              <path d="M7 10h14M7 14h10M7 18h6" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="login-title">Calendar Platform</h1>
            <p className="login-subtitle">Content Management System</p>
          </div>
        </div>

        <hr className="divider" style={{ margin: '1.5rem 0' }} />

        <h2 className="login-heading">Reset password</h2>
        <p className="login-desc">Enter your email and we'll send you a password reset link</p>

        <ResetPasswordForm />

        <p className="login-footer">
          Remember your password?{' '}
          <a href="/login">Sign in here</a>
        </p>
      </div>

      {/* Decorative grid */}
      <div className="login-grid" aria-hidden />
    </main>
  );
}
