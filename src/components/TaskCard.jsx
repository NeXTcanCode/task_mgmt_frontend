import React from 'react';
import { Link } from 'react-router-dom';
import DueDate from './DueDate';
import OverdueBadge from './OverdueBadge';
import PriorityBadge from './PriorityBadge';
import SelectCheckbox from './SelectCheckbox';
import StatusSelect from './StatusSelect';
import TaskRowMenu from './TaskRowMenu';
import TimerButton from './TimerButton';
import TrackedTime from './TrackedTime';
import { isOverdue } from '../utils/taskStats';

// Small-screen version of a table row (< 992px)
export default function TaskCard({ task, today, activeLog, selected, menuOpen, onToggleSelect, onOpenMenu, onCloseMenu, onInsights, onDelete, notifyError }) {
  const overdue = isOverdue(task, today);
  return <article className={`task-card ${selected ? 'is-selected' : ''}`}>
    <SelectCheckbox checked={selected} onChange={() => onToggleSelect(task.id)} label={`Select ${task.title}`} />
    <div className="task-card-body">
      <Link to={`/tasks/${task.id}`} className={`task-title text-break ${task.status === 'completed' ? 'is-done' : ''}`}>{task.title}</Link>
      <div className="task-card-meta">
        <PriorityBadge priority={task.priority} />
        <StatusSelect task={task} onError={notifyError} />
        {overdue && <OverdueBadge />}
      </div>
      {task.dueDate && <DueDate dueDate={task.dueDate} withIcon overdue={overdue} />}
      <div className="task-card-timer">
        <TrackedTime task={task} activeLog={activeLog} />
        <TimerButton task={task} activeLog={activeLog} onError={notifyError} withLabel />
      </div>
    </div>
    <TaskRowMenu task={task} open={menuOpen} onOpen={() => onOpenMenu(task.id)}
      onClose={onCloseMenu} onInsights={() => onInsights(task.id)}
      onDelete={() => onDelete(task.id)} />
  </article>;
}
