import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import DueDate from './DueDate';
import ErrorAlert from './ErrorAlert';
import Icon from './Icon';
import OverdueBadge from './OverdueBadge';
import PriorityBadge from './PriorityBadge';
import Spinner from './Spinner';
import StatusBadge from './StatusBadge';
import TaskInsights from './TaskInsights';
import TimerButton from './TimerButton';
import useOverlay from '../hooks/useOverlay';
import { useTask } from '../hooks/useTasks';
import { useActiveTimer } from '../hooks/useTimer';
import { todayLocal } from '../utils/formatDate';
import { isOverdue } from '../utils/taskStats';

// Offcanvas (Bootstrap markup, React-controlled) with one task's insights
export default function InsightsPanel({ taskId, onClose, onMissing, notifyError }) {
  const taskQuery = useTask(taskId);
  const { data: activeLog } = useActiveTimer();
  const panelRef = useOverlay(onClose);
  const onMissingRef = useRef(onMissing);
  onMissingRef.current = onMissing;
  const task = taskQuery.data;

  // The task was deleted (here or in another tab)
  useEffect(() => {
    if (taskQuery.error?.status === 404) onMissingRef.current();
  }, [taskQuery.error]);

  return <>
    <div className="offcanvas offcanvas-end show insights-panel" role="dialog" aria-modal="true" aria-labelledby="insights-title" tabIndex={-1} ref={panelRef}>
      <div className="offcanvas-header align-items-start">
        <div className="min-w-0">
          <p className="eyebrow-label">Task insights</p>
          <h2 className="offcanvas-title h5 text-break" id="insights-title">{task?.title || 'Loading…'}</h2>
        </div>
        <button type="button" className="btn-close" aria-label="Close insights" onClick={onClose} />
      </div>
      <div className="offcanvas-body">
        {taskQuery.isPending && <Spinner />}
        {taskQuery.error && taskQuery.error.status !== 404 && <ErrorAlert error={taskQuery.error} onRetry={taskQuery.refetch} />}
        {task && <>
          <div className="panel-meta">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            {isOverdue(task, todayLocal()) && <OverdueBadge />}
            <DueDate dueDate={task.dueDate} withIcon />
          </div>
          {task.description && <p className="panel-description text-break">{task.description}</p>}
          <div className="panel-actions">
            <TimerButton task={task} activeLog={activeLog} onError={notifyError} withLabel />
            <Link to={`/tasks/${task.id}`} className="btn btn-sm btn-light">Details &amp; edit <Icon name="arrow-right" size={14} /></Link>
          </div>
          <TaskInsights task={task} />
        </>}
      </div>
    </div>
    <div className="offcanvas-backdrop fade show" onClick={onClose} />
  </>;
}
