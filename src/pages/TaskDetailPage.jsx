import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';
import DueDate from '../components/DueDate';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';
import Icon from '../components/Icon';
import OverdueBadge from '../components/OverdueBadge';
import PriorityBadge from '../components/PriorityBadge';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import TaskInsights from '../components/TaskInsights';
import TimerButton from '../components/TimerButton';
import TrackedTime from '../components/TrackedTime';
import useElapsed from '../hooks/useElapsed';
import { useDeleteTask, useTask, useUpdateTask } from '../hooks/useTasks';
import { useActiveTimer } from '../hooks/useTimer';
import { useDeleteTimeLog, useTimeLogs } from '../hooks/useTimeLogs';
import { PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from '../utils/constants';
import { formatDateTime, formatTime, todayLocal } from '../utils/formatDate';
import { formatClock, formatDuration } from '../utils/formatDuration';
import { isOverdue } from '../utils/taskStats';
import { fieldErrorsFrom, setServerErrors, taskRules } from '../utils/validation';

function RunningDuration({ startTime }) {
  return <span className="live-clock"><span className="live-dot" aria-hidden="true" />{formatClock(useElapsed(startTime))}</span>;
}

// The form's starting values, copied from the task when editing starts
const formValuesFrom = (task) => ({
  title: task.title, description: task.description || '', status: task.status, priority: task.priority, dueDate: task.dueDate || '',
});

// Only the fields that changed go in the PATCH
function changedFields(values, task) {
  const next = { ...values, title: values.title.trim(), description: values.description.trim(), dueDate: values.dueDate || null };
  return Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== (task[key] ?? (key === 'dueDate' ? null : ''))));
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, setValue, setError, watch, formState: { errors } } = useForm({
    defaultValues: { title: '', description: '', status: 'pending', priority: 'medium', dueDate: '' },
  });
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(null); // null | { type: 'task' } | { type: 'log', id }
  const taskQuery = useTask(id);
  const logsQuery = useTimeLogs({ taskId: id });
  const { data: activeLog } = useActiveTimer();
  const update = useUpdateTask();
  const deleteTask = useDeleteTask();
  const deleteLog = useDeleteTimeLog();
  const task = taskQuery.data;

  useEffect(() => { document.title = `${task?.title || 'Task'} · TaskTracker`; }, [task?.title]);
  const dueDate = watch('dueDate');

  if (taskQuery.isPending) return <Spinner />;
  if (taskQuery.error?.status === 404) {
    return <EmptyState title="Task not found" text="It may have been deleted." action={<Link to="/" className="btn btn-primary">Back to tasks</Link>} />;
  }
  if (taskQuery.error) return <ErrorAlert error={taskQuery.error} onRetry={taskQuery.refetch} />;

  const startEdit = () => {
    reset(formValuesFrom(task));
    setEditing(true);
  };

  const save = (values) => {
    const changes = changedFields(values, task);
    if (Object.keys(changes).length === 0) return setEditing(false);
    return update.mutate({ id: task.id, changes }, {
      onSuccess: () => {
        setEditing(false);
        toast.success('Task saved.');
      },
      onError: (error) => setServerErrors(setError, fieldErrorsFrom(error), error.message),
    });
  };

  const confirmDelete = () => {
    if (confirm.type === 'task') {
      return deleteTask.mutate(task.id, {
        onSuccess: () => {
          toast.success('Task deleted.');
          navigate('/', { replace: true });
        },
        onError: (error) => {
          setConfirm(null);
          toast.error(error.message);
        },
      });
    }
    return deleteLog.mutate(confirm.id, {
      onSuccess: () => toast.success('Session deleted.'),
      onError: (error) => toast.error(error.message),
      onSettled: () => setConfirm(null),
    });
  };

  const logs = logsQuery.data || [];

  return <div className="page">
    <Link to="/" className="back-link"><Icon name="arrow-left" size={16} /> Back to tasks</Link>

    <div className="row g-3 mt-1">
      <div className="col-12 col-lg-5">
        <section className="insight-card">
          {!editing && <>
            <h1 className={`page-title text-break ${task.status === 'completed' ? 'is-done' : ''}`}>{task.title}</h1>
            <div className="panel-meta">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {isOverdue(task, todayLocal()) && <OverdueBadge />}
              <DueDate dueDate={task.dueDate} withIcon />
            </div>
            {task.description && <p className="panel-description text-break">{task.description}</p>}
            {task.rawInput && <p className="small text-muted text-break">Original input: “{task.rawInput}”</p>}
            <p className="small text-muted mb-1">Created {formatDateTime(task.createdAt)}</p>
            {task.completedAt && <p className="small text-muted mb-1">Completed {formatDateTime(task.completedAt)}</p>}
            <div className="d-flex gap-2 mt-3">
              <button type="button" className="btn btn-light" onClick={startEdit}><Icon name="edit" size={16} /> Edit</button>
              <button type="button" className="btn btn-outline-danger ms-auto" onClick={() => setConfirm({ type: 'task' })}><Icon name="trash" size={16} /> Delete</button>
            </div>
          </>}

          {editing && <form onSubmit={handleSubmit(save)} noValidate>
            {errors.root && <div className="alert alert-danger py-2" role="alert">{errors.root.message}</div>}
            <div className="mb-3">
              <label htmlFor="edit-title" className="form-label">Title</label>
              <input id="edit-title" className={`form-control ${errors.title ? 'is-invalid' : ''}`} {...register('title', taskRules.title)} maxLength={200} autoFocus />
              {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
            </div>
            <div className="mb-3">
              <label htmlFor="edit-description" className="form-label">Description</label>
              <textarea id="edit-description" rows={4} className={`form-control ${errors.description ? 'is-invalid' : ''}`} {...register('description', taskRules.description)} maxLength={2000} />
              {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
            </div>
            <div className="row g-3 mb-3">
              <div className="col-6">
                <label htmlFor="edit-status" className="form-label">Status</label>
                <select id="edit-status" className="form-select" {...register('status')}>
                  {STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                </select>
              </div>
              <div className="col-6">
                <label htmlFor="edit-priority" className="form-label">Priority</label>
                <select id="edit-priority" className="form-select" {...register('priority')}>
                  {PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label htmlFor="edit-dueDate" className="form-label">Due date</label>
                <div className="d-flex gap-2 align-items-center">
                  <input id="edit-dueDate" type="date" className={`form-control ${errors.dueDate ? 'is-invalid' : ''}`} {...register('dueDate', taskRules.dueDate)} />
                  {dueDate && <button type="button" className="btn btn-link" onClick={() => setValue('dueDate', '', { shouldValidate: true })}>Clear</button>}
                </div>
                {errors.dueDate && <div className="invalid-feedback d-block">{errors.dueDate.message}</div>}
              </div>
            </div>
            <div className="d-flex gap-2 justify-content-end">
              <button type="button" className="btn btn-light" onClick={() => setEditing(false)} disabled={update.isPending}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={update.isPending}>
                {update.isPending && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}Save
              </button>
            </div>
          </form>}
        </section>

        <section className="insight-card mt-3 d-flex align-items-center justify-content-between gap-3">
          <div>
            <p className="small text-muted mb-1">Total time</p>
            <TrackedTime task={task} activeLog={activeLog} />
          </div>
          <TimerButton task={task} activeLog={activeLog} onError={toast.error} withLabel />
        </section>
      </div>

      <div className="col-12 col-lg-7 sessions-col">
        <section className="insight-card sessions-card">
          <h2 className="insight-card-title">Sessions ({logs.length})</h2>
          {logsQuery.isPending && <Spinner />}
          {logsQuery.error && <ErrorAlert error={logsQuery.error} onRetry={logsQuery.refetch} />}
          {logsQuery.data && logs.length === 0 && <p className="text-muted mb-0">No sessions yet. Press Start to track time.</p>}
          {logs.length > 0 && <ul className="session-list session-scroll" tabIndex={0} aria-label={`Sessions, ${logs.length}`}>
            {logs.map((log) => <li key={log.id}>
              <span className="session-when">{formatDateTime(log.startTime)} → {log.endTime ? formatTime(log.endTime) : 'running'}</span>
              {log.endTime ? <span className="session-duration">{formatDuration(log.duration)}</span> : <RunningDuration startTime={log.startTime} />}
              {log.endTime
                ? <button type="button" className="icon-button" onClick={() => setConfirm({ type: 'log', id: log.id })} aria-label={`Delete session from ${formatDateTime(log.startTime)}`} title="Delete session">
                  <Icon name="trash" size={16} />
                </button>
                : <span className="icon-button-placeholder" />}
            </li>)}
          </ul>}
        </section>
      </div>
    </div>

    <h2 className="section-title">Insights</h2>
    <TaskInsights task={task} />

    {confirm && <ConfirmModal
      title={confirm.type === 'task' ? 'Delete task?' : 'Delete session?'}
      body={confirm.type === 'task' ? "Delete this task and all its time logs? This can't be undone." : 'Delete this session? Its time is removed from the total.'}
      pending={deleteTask.isPending || deleteLog.isPending}
      onConfirm={confirmDelete}
      onCancel={() => setConfirm(null)} />}
  </div>;
}
