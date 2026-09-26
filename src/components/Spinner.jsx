import React from 'react';

export default function Spinner({ full = false, label = 'Loading…' }) {
  return <div className={full ? 'spinner-full' : 'spinner-inline'} role="status">
    <span className="spinner-border text-primary" aria-hidden="true" />
    <span className="visually-hidden">{label}</span>
  </div>;
}
