import './FormField.css';

const FormField = ({ label, error, children }) => (
  <div className="form-field">
    <label className="form-field__label">{label}</label>
    {children}
    {error && <p className="form-field__error">{error}</p>}
  </div>
);

export default FormField;
