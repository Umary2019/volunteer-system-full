import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import OtpInput from '../components/OtpInput';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STEPS = [{ label: 'Register' }, { label: 'Verify email' }, { label: 'Log in' }];

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email] = useState(location.state?.email || sessionStorage.getItem('pendingVerificationEmail') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Enter the full 6-digit code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, code });
      sessionStorage.removeItem('pendingVerificationEmail');
      login(data.token, data.user);
      navigate('/create-profile');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      setInfo('A new code has been sent to your email.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <AuthLayout steps={STEPS} activeStep={1}>
        <h2 className="page-title">No email on file</h2>
        <p className="page-sub">Please register again to receive a verification code.</p>
        <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
          Back to register
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout steps={STEPS} activeStep={1}>
      <h2 className="page-title">Check your email</h2>
      <p className="page-sub">
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your account.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <OtpInput value={code} onChange={setCode} />

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying…' : 'Verify email'}
        </button>
      </form>

      <p className="form-footer-link">
        Didn't get a code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'var(--ink-navy)', fontWeight: 600, textDecoration: 'underline' }}
        >
          {isResending ? 'Sending…' : 'Resend code'}
        </button>
      </p>
    </AuthLayout>
  );
};

export default VerifyOtp;
