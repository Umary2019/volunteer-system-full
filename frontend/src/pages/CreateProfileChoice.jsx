import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import './CreateProfileChoice.css';

const CreateProfileChoice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organizerStatus, setOrganizerStatus] = useState(null); // null = no request yet

  useEffect(() => {
    // If an organizer request already exists, show its status instead of the create card
    const fetchOrganizerStatus = async () => {
      try {
        const { data } = await api.get('/profiles/organizer');
        setOrganizerStatus(data.profile.status);
      } catch {
        setOrganizerStatus(null);
      }
    };
    if (user?.hasOrganizerProfile) fetchOrganizerStatus();
  }, [user]);

  return (
    <div className="profile-page">
      <div className="profile-page__inner">
        <span className="profile-page__eyebrow">Step 2 of 2</span>
        <h1 className="profile-page__title">Set up your profile</h1>
        <p className="profile-page__sub">
          Create a Volunteer Profile, an Organizer Profile, or both. You can always add the other one later —
          this doesn't create a second account.
        </p>

        <div className="profile-choice-grid">
          <div
            className={`profile-card ${user?.hasVolunteerProfile ? 'profile-card--done' : 'profile-card--available'}`}
            role={user?.hasVolunteerProfile ? undefined : 'button'}
            tabIndex={user?.hasVolunteerProfile ? undefined : 0}
            onClick={() => !user?.hasVolunteerProfile && navigate('/create-profile/volunteer')}
            onKeyDown={(e) => {
              if (!user?.hasVolunteerProfile && (e.key === 'Enter' || e.key === ' ')) {
                navigate('/create-profile/volunteer');
              }
            }}
          >
            {user?.hasVolunteerProfile && <span className="profile-card__seal">✓</span>}
            <h2 className="profile-card__title">Volunteer Profile</h2>
            <p className="profile-card__desc">
              Apply to programs, get matched by department and interest, track attendance and ratings.
            </p>
            {!user?.hasVolunteerProfile && <button className="btn btn-ghost" type="button">Create profile</button>}
          </div>

          <div
            className={`profile-card ${user?.hasOrganizerProfile && organizerStatus !== 'rejected' ? 'profile-card--done' : 'profile-card--available'}`}
            role={user?.hasOrganizerProfile && organizerStatus !== 'rejected' ? undefined : 'button'}
            tabIndex={user?.hasOrganizerProfile && organizerStatus !== 'rejected' ? undefined : 0}
            onClick={() => (!user?.hasOrganizerProfile || organizerStatus === 'rejected') && navigate('/create-profile/organizer')}
            onKeyDown={(e) => {
              if ((!user?.hasOrganizerProfile || organizerStatus === 'rejected') && (e.key === 'Enter' || e.key === ' ')) {
                navigate('/create-profile/organizer');
              }
            }}
          >
            {organizerStatus === 'approved' && <span className="profile-card__seal">✓</span>}
            <h2 className="profile-card__title">Organizer Profile</h2>
            <p className="profile-card__desc">
              Request access to create and manage programs. Subject to administrator approval.
            </p>
            {(!user?.hasOrganizerProfile || organizerStatus === 'rejected') && <button className="btn btn-ghost" type="button">{organizerStatus === 'rejected' ? 'Resubmit request' : 'Request access'}</button>}
            {organizerStatus === 'pending' && <span className="profile-card__pending">Pending approval</span>}
            {organizerStatus === 'rejected' && <span className="profile-card__pending">Request rejected</span>}
          </div>
        </div>

        <div className="profile-page__continue">
          <button className="btn btn-primary" style={{ width: 'auto', padding: '0.8rem 2rem' }} onClick={() => navigate('/dashboard')}>
            Continue to dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProfileChoice;
