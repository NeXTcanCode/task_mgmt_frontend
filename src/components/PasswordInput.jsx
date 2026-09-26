import React, { forwardRef, useState } from 'react';
import AuthInput from './AuthInput';

const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return <AuthInput ref={ref} {...props} type={visible ? 'text' : 'password'} action={<button type="button" className="field-action" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? '◌' : '◉'}</button>} />;
});

export default PasswordInput;
