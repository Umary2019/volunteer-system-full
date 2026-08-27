import { useRef } from 'react';
import './OtpInput.css';

const LENGTH = 6;

const OtpInput = ({ value, onChange }) => {
  const inputsRef = useRef([]);
  const digits = value.split('').concat(Array(LENGTH).fill('')).slice(0, LENGTH);

  const setDigit = (index, char) => {
    const next = [...digits];
    next[index] = char;
    onChange(next.join('').slice(0, LENGTH));
  };

  const handleChange = (index, e) => {
    const char = e.target.value.replace(/[^0-9]/g, '').slice(-1);
    setDigit(index, char);
    if (char && index < LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, LENGTH);
    if (pasted) {
      e.preventDefault();
      onChange(pasted);
    }
  };

  return (
    <div className="otp-ledger" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          className="otp-cell"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          aria-label={`Digit ${index + 1} of verification code`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
