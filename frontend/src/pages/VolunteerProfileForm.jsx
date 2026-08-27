import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './ProfileForm.css';

const EMPTY_FORM = {
  fullName: '',
  matricNumber: '',
  department: '',
  faculty: '',
  level: '',
  phoneNumber: '',
  areasOfInterest: '',
  previousVolunteerParticipation: '',
};

const VolunteerProfileForm = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/profiles/volunteer', {
        ...form,
        areasOfInterest: form.areasOfInterest
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });
      await refreshUser();
      navigate('/create-profile');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-form-page">
      <div className="profile-form-card">
        <span className="profile-page__eyebrow">Volunteer Profile</span>
        <h1 className="page-title" style={{ marginTop: '0.5rem' }}>Tell us about you</h1>
        <p className="page-sub">This helps organizers and the recommendation system match you to relevant programs.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <FormField label="Full name">
              <input className="text-input" value={form.fullName} onChange={update('fullName')} required />
            </FormField>
            <FormField label="Matric number">
              <input className="text-input" value={form.matricNumber} onChange={update('matricNumber')} required />
            </FormField>
            <FormField label="Department">
              <input className="text-input" value={form.department} onChange={update('department')} required />
            </FormField>
            <FormField label="Faculty">
              <input className="text-input" value={form.faculty} onChange={update('faculty')} required />
            </FormField>
            <FormField label="Level">
              <input className="text-input" value={form.level} onChange={update('level')} required placeholder="e.g. 300" />
            </FormField>
            <FormField label="Phone number">
              <input className="text-input" value={form.phoneNumber} onChange={update('phoneNumber')} required />
            </FormField>
          </div>

          <FormField label="Areas of interest (comma-separated)">
            <input
              className="text-input"
              value={form.areasOfInterest}
              onChange={update('areasOfInterest')}
              placeholder="e.g. Technology, Media, Logistics"
            />
          </FormField>

          <FormField label="Previous volunteer participation (optional)">
            <textarea
              className="text-input"
              value={form.previousVolunteerParticipation}
              onChange={update('previousVolunteerParticipation')}
              placeholder="Programs or events you've volunteered for before"
            />
          </FormField>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Create Volunteer Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VolunteerProfileForm;
