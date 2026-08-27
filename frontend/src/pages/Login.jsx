import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STEPS = [{ label: 'Register' }, { label: 'Verify email' }, { label: 'Log in' }];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);

      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (!data.user.hasVolunteerProfile && !data.user.hasOrganizerProfile) {
        navigate('/create-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout steps={STEPS} activeStep={2}>
      <h2 className="page-title">Welcome back</h2>
      <p className="page-sub">Log in to browse programs, volunteer, or manage events.</p>

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
            autoComplete="current-password"
          />
        </FormField>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="form-footer-link">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
