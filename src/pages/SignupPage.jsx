import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AuthInput from '../components/AuthInput';
import PasswordInput from '../components/PasswordInput';
import { useAuthSubmit } from '../hooks/useAuth';
import { authRules, getAuthError, setServerErrors } from '../utils/validation';

export default function SignupPage() {
  const { register, handleSubmit, setError, resetField, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });
  const navigate = useNavigate();
  const auth = useAuthSubmit('signup');

  const submit = (values) => auth.mutate(values, {
    onError: (error) => {
      const { fieldErrors, formError } = getAuthError(error);
      resetField('password');
      resetField('confirmPassword');
      setServerErrors(setError, fieldErrors, formError);
    },
  });

  return <AuthCard type="signup" title="Create an account" subtitle="Turn your work into momentum.">
    {errors.root && <div className="form-alert" role="alert">{errors.root.message}</div>}
    <form onSubmit={handleSubmit(submit)} noValidate>
      <AuthInput label="Full name" {...register('name', authRules.name)} error={errors.name?.message} placeholder="Your name" autoComplete="name" />
      <AuthInput label="Email" type="email" {...register('email', authRules.email)} error={errors.email?.message} placeholder="you@example.com" autoComplete="email" />
      <PasswordInput label="Password" {...register('password', authRules.password)} error={errors.password?.message} placeholder="At least 8 characters" autoComplete="new-password" />
      <PasswordInput label="Confirm password" {...register('confirmPassword', authRules.confirmPassword)} error={errors.confirmPassword?.message} placeholder="Repeat your password" autoComplete="new-password" />
      <button className="primary-button" disabled={auth.isPending}>{auth.isPending ? 'Please wait…' : 'Create an account'}</button>
    </form>
    <p className="mode-link">Already have an account? <button onClick={() => navigate('/login')}>Sign in</button></p>
  </AuthCard>;
}
