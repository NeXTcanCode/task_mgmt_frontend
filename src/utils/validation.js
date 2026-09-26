import { isValidDateKey } from './formatDate';

// react-hook-form `register` rules, shared by the forms that use them
export const authRules = {
  name: { validate: (value) => (value.trim().length >= 2 && value.trim().length <= 50) || 'Name must be 2–50 characters' },
  email: { required: 'Enter a valid email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } },
  password: {
    required: 'Password must be 8–72 characters',
    minLength: { value: 8, message: 'Password must be 8–72 characters' },
    maxLength: { value: 72, message: 'Password must be 8–72 characters' },
  },
  confirmPassword: { validate: (value, values) => value === values.password || "Passwords don't match" },
};

export const taskRules = {
  title: {
    validate: (value) => {
      const title = value.trim();
      if (!title) return 'Title is required';
      return title.length <= 200 || 'Title must be 200 characters or less';
    },
  },
  description: { maxLength: { value: 2000, message: 'Description must be 2000 characters or less' } },
  dueDate: { validate: (value) => !value || isValidDateKey(value) || 'Enter a valid calendar date' },
};

// API validation details ([{ field, message }]) → { field: message }
export const fieldErrorsFrom = (error) => Object.fromEntries((Array.isArray(error.details) ? error.details : []).map((item) => [item.field, item.message]));

// Show API errors in a react-hook-form form: per field, plus a form-level message in errors.root
export function setServerErrors(setError, fieldErrors, formError) {
  Object.entries(fieldErrors).forEach(([name, message]) => setError(name, { type: 'server', message }));
  if (formError) setError('root', { type: 'server', message: formError });
}

export function getAuthError(error) {
  const fieldErrors = fieldErrorsFrom(error);
  if (error.status === 409) fieldErrors.email = 'This email is already registered';
  return {
    fieldErrors,
    formError: error.status === 429 ? 'Too many attempts. Please wait a few minutes.'
      : error.status === 401 ? 'Invalid email or password'
        : fieldErrors.email ? '' : error.message,
  };
}
