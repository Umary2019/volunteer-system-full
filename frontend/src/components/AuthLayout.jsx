import './AuthLayout.css';

/**
 * steps: array of { label } for the register ledger on the left panel
 * activeStep: 0-based index of which step is current
 */
const AuthLayout = ({ steps, activeStep, children }) => {
  return (
    <div className="auth-shell">
      <aside className="auth-register" aria-hidden="true">
        <div className="auth-register__mark">SVP</div>
        <h1 className="auth-register__title">Student Volunteer Program</h1>
        <p className="auth-register__sub">Matriculation &amp; Program Registry</p>

        <ol className="auth-register__ledger">
          {steps.map((step, index) => (
            <li
              key={step.label}
              className={
                'ledger-row' +
                (index === activeStep ? ' ledger-row--active' : '') +
                (index < activeStep ? ' ledger-row--done' : '')
              }
            >
              <span className="ledger-row__num">{String(index + 1).padStart(2, '0')}</span>
              <span className="ledger-row__label">{step.label}</span>
            </li>
          ))}
        </ol>
      </aside>

      <main className="auth-form-panel">
        <div className="auth-form-panel__inner">{children}</div>
      </main>
    </div>
  );
};

export default AuthLayout;
