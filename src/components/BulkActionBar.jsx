import React from 'react';
import Icon from './Icon';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../utils/constants';

// Shown while rows are selected; the selects act immediately and reset to their placeholder
export default function BulkActionBar({ count, pending, onUpdate, onDelete, onClear }) {
  const pick = (field) => (event) => {
    if (event.target.value) onUpdate({ [field]: event.target.value });
  };
  return <div className="bulk-bar" role="toolbar" aria-label="Bulk actions">
    <strong className="bulk-count">{count} selected</strong>
    <button type="button" className="btn btn-sm btn-success" onClick={() => onUpdate({ status: 'completed' })} disabled={pending}>
      <Icon name="check" size={14} /> Mark complete
    </button>
    <select className="form-select form-select-sm bulk-select" value="" onChange={pick('status')} disabled={pending} aria-label="Change status of selected tasks">
      <option value="">Status…</option>
      {STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
    </select>
    <select className="form-select form-select-sm bulk-select" value="" onChange={pick('priority')} disabled={pending} aria-label="Change priority of selected tasks">
      <option value="">Priority…</option>
      {PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>)}
    </select>
    <button type="button" className="btn btn-sm btn-outline-danger" onClick={onDelete} disabled={pending}>
      <Icon name="trash" size={14} /> Delete
    </button>
    {pending && <span className="spinner-border spinner-border-sm text-primary" role="status"><span className="visually-hidden">Working…</span></span>}
    <button type="button" className="btn btn-sm btn-link ms-auto" onClick={onClear} disabled={pending}><Icon name="x" size={14} /> Clear</button>
  </div>;
}
