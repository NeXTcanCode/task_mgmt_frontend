import React, { forwardRef } from 'react';

// forwardRef so react-hook-form's register() can reach the <input>
const AuthInput = forwardRef(function AuthInput({ label, name, error, action, ...props }, ref) {
  return <div className="field">
    <label htmlFor={name}>{label}</label>
    <div className={`input-wrap ${error ? 'has-error' : ''}`}>
      <input ref={ref} id={name} name={name} {...props} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} />
      {action}
    </div>
    {error && <small id={`${name}-error`} className="field-error">{error}</small>}
  </div>;
});

export default AuthInput;
