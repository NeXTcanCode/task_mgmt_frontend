import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';
import Icon from '../components/Icon';
import { useDeleteTimeLog, useTimeLogs } from '../hooks/useTimeLogs';
import { useTasks } from '../hooks/useTasks';
import { formatDuration } from '../utils/formatDuration';
import { formatDateTime, formatTime } from '../utils/formatDate';

export default function TimeLogsPage() {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'task' | 'duration'
  const [filterTaskId, setFilterTaskId] = useState('');
  const [displayCount, setDisplayCount] = useState(8);

  const { data: timeLogs, isLoading, error, refetch } = useTimeLogs();
  const { data: tasks } = useTasks();
  const deleteLog = useDeleteTimeLog();

  useEffect(() => { document.title = 'Time Logs · TaskTracker'; }, []);

  const taskMap = useMemo(() => {
    const map = {};
    tasks?.forEach((task) => { map[task.id] = task; });
    return map;
  }, [tasks]);

  const filtered = useMemo(() => {
    let result = timeLogs || [];
    if (filterTaskId) result = result.filter((log) => log.taskId === filterTaskId);

    if (sortBy === 'recent') {
      result = [...result].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    } else if (sortBy === 'task') {
      result = [...result].sort((a, b) => {
        const taskA = taskMap[a.taskId]?.title || '';
        const taskB = taskMap[b.taskId]?.title || '';
        return taskA.localeCompare(taskB);
      });
    } else if (sortBy === 'duration') {
      result = [...result].sort((a, b) => (b.duration || 0) - (a.duration || 0));
    }

    return result;
  }, [timeLogs, filterTaskId, sortBy, taskMap]);

  const displayed = filtered.slice(0, displayCount);
  const hasMore = filtered.length > displayCount;
  const remaining = filtered.length - displayCount;

  const handleDelete = async () => {
    if (!confirm) return;
    try {
      await deleteLog.mutateAsync(confirm.id);
      toast.success('Time log deleted');
      setConfirm(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete time log');
    }
  };

  const askDelete = (id) => setConfirm({ id });

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(8);
  }, [filterTaskId, sortBy]);

  if (error) return <ErrorAlert error={error} onRetry={refetch} />;

  const isEmpty = !isLoading && (!timeLogs || timeLogs.length === 0);
  const totalTime = filtered.reduce((sum, log) => sum + (log.duration || 0), 0);

  return <div className="page">
    <div className="page-header">
      <h1 className="page-title">Time Logs</h1>
    </div>

    {isEmpty ? (
      <EmptyState
        icon="clock"
        title="No time logs yet"
        message="Start tracking time on a task to see logs here."
      />
    ) : (
      <div className="time-logs-container">
        {/* Stats */}
        {!isLoading && (
          <div className="row mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="card text-center">
                <div className="card-body">
                  <div className="text-muted small">Total Sessions</div>
                  <div className="fs-4 fw-bold text-primary">{filtered.length}</div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="card text-center">
                <div className="card-body">
                  <div className="text-muted small">Total Time</div>
                  <div className="fs-4 fw-bold text-info">{formatDuration(totalTime)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="row mb-4 gap-3">
          <div className="col-auto">
            <label htmlFor="sort-select" className="form-label small mb-2">Sort by</label>
            <select
              id="sort-select"
              className="form-select form-select-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="task">Task Name</option>
              <option value="duration">Duration</option>
            </select>
          </div>
          <div className="col-auto">
            <label htmlFor="task-filter" className="form-label small mb-2">Filter by task</label>
            <select
              id="task-filter"
              className="form-select form-select-sm"
              value={filterTaskId}
              onChange={(e) => setFilterTaskId(e.target.value)}
            >
              <option value="">All tasks</option>
              {tasks?.map((task) => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Logs Table */}
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Task</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th className="text-end">Duration</th>
                <th className="text-center" style={{ width: '50px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-4"><span className="spinner-border spinner-border-sm" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-muted py-3">No time logs found</td></tr>
              ) : (
                displayed.map((log) => {
                  const task = taskMap[log.taskId];
                  return (
                    <tr key={log.id}>
                      <td>
                        <button
                          className="btn btn-link btn-sm p-0 text-decoration-none text-start"
                          onClick={() => navigate(`/tasks/${log.taskId}`)}
                        >
                          {task?.title || 'Unknown Task'}
                        </button>
                      </td>
                      <td>{formatDateTime(log.startTime)}</td>
                      <td>{log.endTime ? formatDateTime(log.endTime) : <span className="badge bg-warning">Running</span>}</td>
                      <td className="text-end fw-medium">{formatDuration(log.duration || 0)}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-link p-0 text-danger"
                          onClick={() => askDelete(log.id)}
                          title="Delete time log"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* View More Button */}
        {hasMore && (
          <div className="text-center my-4">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => setDisplayCount((prev) => prev + 8)}
            >
              View More +{Math.min(8, remaining)}
            </button>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="d-lg-none">
          {displayed.map((log) => {
            const task = taskMap[log.taskId];
            return (
              <div key={log.id} className="card mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <button
                      className="btn btn-link btn-sm p-0 text-decoration-none text-start"
                      onClick={() => navigate(`/tasks/${log.taskId}`)}
                    >
                      <div className="fw-bold">{task?.title || 'Unknown Task'}</div>
                    </button>
                    <button
                      className="btn btn-sm btn-link p-0 text-danger"
                      onClick={() => askDelete(log.id)}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                  <small className="text-muted d-block">{formatDateTime(log.startTime)}</small>
                  {log.endTime && <small className="text-muted d-block">to {formatTime(log.endTime)}</small>}
                  {log.endTime === null && <small className="badge bg-warning">Running</small>}
                  <div className="mt-2 fw-bold text-primary">{formatDuration(log.duration || 0)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {confirm && (
      <ConfirmModal
        title="Delete Time Log?"
        body="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
        pending={deleteLog.isPending}
      />
    )}
  </div>;
}
