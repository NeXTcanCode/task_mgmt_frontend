import React from 'react';

export default function ErrorAlert({ error, onRetry }) {
  return <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3 flex-wrap" role="alert">
    <span>{error?.message || 'Something went wrong'}</span>
    {onRetry && <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onRetry()}>Retry</button>}
  </div>;
}
