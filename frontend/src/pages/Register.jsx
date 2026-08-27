import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import api, { getErrorMessage } from '../api/client';

const STEPS = [{ label: 'Register' }, { label: 'Verify email' }, { label: 'Log in' }];

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/register', { email, password });
      sessionStorage.setItem('pendingVerificationEmail', email);
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout steps={STEPS} activeStep={0}>
      <h2 className="page-title">Create your account</h2>
      <p className="page-sub">
        One account covers volunteering and organizing — you'll choose what to set up next.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Email">
          <input
            type="email"
            className="text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </FormField>

        <FormField label="Password">
          <input
            type="password"
            className="text-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </FormField>

        <FormField label="Confirm password">
          <input
            type="password"
            className="text-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </FormField>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Continue'}
        </button>
      </form>

      <p className="form-footer-link">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
