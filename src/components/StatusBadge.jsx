import React from 'react';
import { STATUS_LABELS } from '../utils/constants';

export default function StatusBadge({ status }) {
  return <span className={`status-pill status-${status}`}>{STATUS_LABELS[status]}</span>;
}
