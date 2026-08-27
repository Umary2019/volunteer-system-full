import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import api, { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './ProfileForm.css';

const EMPTY_FORM = {
  name: '',
  department: '',
  faculty: '',
  organization: '',
  position: '',
  phoneNumber: '',
  reasonForRequest: '',
  otherInfo: '',
};

const OrganizerProfileForm = () => {
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
      await api.post('/profiles/organizer', form);
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
        <span className="profile-page__eyebrow">Organizer Profile</span>
        <h1 className="page-title" style={{ marginTop: '0.5rem' }}>Request organizer access</h1>
        <p className="page-sub">
          Your request goes to the administrator for approval. Your Volunteer Profile, if you have one, is
          not affected while this is pending.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <FormField label="Name">
              <input className="text-input" value={form.name} onChange={update('name')} required />
            </FormField>
            <FormField label="Department">
              <input className="text-input" value={form.department} onChange={update('department')} required />
            </FormField>
            <FormField label="Faculty">
              <input className="text-input" value={form.faculty} onChange={update('faculty')} required />
            </FormField>
            <FormField label="Organization / Association">
              <input className="text-input" value={form.organization} onChange={update('organization')} required placeholder="e.g. NACOS" />
            </FormField>
            <FormField label="Position">
              <input className="text-input" value={form.position} onChange={update('position')} required placeholder="e.g. President" />
            </FormField>
            <FormField label="Phone number">
              <input className="text-input" value={form.phoneNumber} onChange={update('phoneNumber')} required />
            </FormField>
          </div>

          <FormField label="Reason for requesting organizer access">
            <textarea className="text-input" value={form.reasonForRequest} onChange={update('reasonForRequest')} required />
          </FormField>

          <FormField label="Other relevant information (optional)">
            <textarea className="text-input" value={form.otherInfo} onChange={update('otherInfo')} />
          </FormField>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrganizerProfileForm;
