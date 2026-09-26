import React from 'react';
import { useUpdateTask } from '../hooks/useTasks';
import { STATUSES, STATUS_LABELS } from '../utils/constants';

// Native select styled as a status pill: accessible and keyboard friendly
export default function StatusSelect({ task, onError }) {
  const update = useUpdateTask();
  const change = (event) => update.mutate({ id: task.id, changes: { status: event.target.value } }, { onError: (error) => onError?.(error.message) });

  return <select className={`status-select status-${task.status}`} value={task.status} onChange={change} disabled={update.isPending} aria-label={`Status of ${task.title}`}>
    {STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
  </select>;
}
