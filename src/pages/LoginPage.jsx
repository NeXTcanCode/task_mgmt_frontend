import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AuthInput from '../components/AuthInput';
import PasswordInput from '../components/PasswordInput';
import { useAuthSubmit } from '../hooks/useAuth';
import { authRules, getAuthError, setServerErrors } from '../utils/validation';

export default function LoginPage() {
  const { register, handleSubmit, setError, resetField, formState: { errors } } = useForm({ defaultValues: { email: '', password: '' } });
  const navigate = useNavigate();
  const auth = useAuthSubmit('login');

  const submit = (values) => auth.mutate(values, {
    onError: (error) => {
      const { fieldErrors, formError } = getAuthError(error);
      resetField('password');
      setServerErrors(setError, fieldErrors, formError);
    },
  });

  return <AuthCard type="login" title="Welcome back" subtitle="Pick up where you left off.">
    {errors.root && <div className="form-alert" role="alert">{errors.root.message}</div>}
    <form onSubmit={handleSubmit(submit)} noValidate>
      <AuthInput label="Email" type="email" {...register('email', authRules.email)} error={errors.email?.message} placeholder="you@example.com" autoComplete="email" />
      <PasswordInput label="Password" {...register('password', authRules.password)} error={errors.password?.message} placeholder="Your password" autoComplete="current-password" />
      <button className="primary-button" disabled={auth.isPending}>{auth.isPending ? 'Please wait…' : 'Sign in'}</button>
    </form>
    <p className="mode-link">Don&apos;t have an account? <button onClick={() => navigate('/signup')}>Sign up</button></p>
  </AuthCard>;
}
