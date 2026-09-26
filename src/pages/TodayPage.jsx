import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';
import Icon from '../components/Icon';
import { useSummary } from '../hooks/useSummary';
import { formatDuration } from '../utils/formatDuration';
import { formatDueDate, todayLocal } from '../utils/formatDate';
import { STATUS_LABELS } from '../utils/constants';

export default function TodayPage() {
  const navigate = useNavigate();
  const { data: summary, isLoading, error, refetch } = useSummary();

  useEffect(() => { document.title = 'Today · TaskTracker'; }, []);

  if (error) return <ErrorAlert error={error} onRetry={refetch} />;

  const isEmpty = !isLoading && (!summary || (
    summary.tasksWorkedOn?.length === 0 &&
    summary.completedToday?.length === 0 &&
    summary.inProgress?.length === 0 &&
    summary.pending?.length === 0 &&
    summary.dueToday?.length === 0 &&
    summary.overdue?.length === 0
  ));

  return <div className="page">
    <div className="page-header">
      <h1 className="page-title">Today's Summary</h1>
    </div>

    {isEmpty ? (
      <EmptyState
        icon="inbox"
        title="No activity yet"
        message="Start tracking time on a task to see it here."
      />
    ) : (
      <div className="summary-sections">
        {/* Stats */}
        {isLoading ? (
          <div className="skeleton skeleton-lines" style={{ height: '100px' }} />
        ) : (
          <div className="row mb-4">
            <div className="col-md-6 col-lg-3 mb-3">
              <div className="card text-center">
                <div className="card-body">
                  <div className="text-muted small">Total Time Tracked</div>
                  <div className="fs-4 fw-bold text-primary">{formatDuration(summary?.totalTrackedSeconds || 0)}</div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3 mb-3">
              <div className="card text-center">
                <div className="card-body">
                  <div className="text-muted small">Tasks Worked On</div>
                  <div className="fs-4 fw-bold text-info">{summary?.tasksWorkedOn?.length || 0}</div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3 mb-3">
              <div className="card text-center">
                <div className="card-body">
                  <div className="text-muted small">Completed Today</div>
                  <div className="fs-4 fw-bold text-success">{summary?.completedToday?.length || 0}</div>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3 mb-3">
              <div className="card text-center">
                <div className="card-body">
                  <div className="text-muted small">In Progress</div>
                  <div className="fs-4 fw-bold text-warning">{summary?.inProgress?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Worked On */}
        {summary?.tasksWorkedOn?.length > 0 && (
          <section className="mb-5">
            <h2 className="section-title">Tasks Worked On</h2>
            <div className="list-group">
              {summary.tasksWorkedOn.map((task) => (
                <button
                  key={task.id}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <div className="text-start">
                    <div className="fw-medium">{task.title}</div>
                    <small className="text-muted">
                      <span className={`badge bg-${task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'secondary'}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </small>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold text-primary">{formatDuration(task.trackedSeconds)}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Completed Today */}
        {summary?.completedToday?.length > 0 && (
          <section className="mb-5">
            <h2 className="section-title">
              <Icon name="check-circle" size={20} filled className="text-success me-2" />
              Completed Today
            </h2>
            <div className="list-group">
              {summary.completedToday.map((task) => (
                <button
                  key={task.id}
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <div className="d-flex gap-2 align-items-start">
                    <Icon name="check-circle" size={18} filled className="text-success flex-shrink-0 mt-1" />
                    <span className="flex-grow-1">{task.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* In Progress */}
        {summary?.inProgress?.length > 0 && (
          <section className="mb-5">
            <h2 className="section-title">
              <Icon name="play" size={20} className="text-warning me-2" />
              In Progress
            </h2>
            <div className="list-group">
              {summary.inProgress.map((task) => (
                <button
                  key={task.id}
                  className="list-group-item list-group-item-action d-flex justify-content-between"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <span>{task.title}</span>
                  {task.dueDate && <small className="text-muted">Due: {formatDueDate(task.dueDate)}</small>}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Pending */}
        {summary?.pending?.length > 0 && (
          <section className="mb-5">
            <h2 className="section-title">
              <Icon name="circle" size={20} className="text-secondary me-2" />
              Pending
            </h2>
            <div className="list-group">
              {summary.pending.map((task) => (
                <button
                  key={task.id}
                  className="list-group-item list-group-item-action d-flex justify-content-between"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <span>{task.title}</span>
                  {task.dueDate && <small className="text-muted">Due: {formatDueDate(task.dueDate)}</small>}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Overdue */}
        {summary?.overdue?.length > 0 && (
          <section className="mb-5">
            <h2 className="section-title">
              <Icon name="alert" size={20} className="text-danger me-2" />
              Overdue
            </h2>
            <div className="list-group">
              {summary.overdue.map((task) => (
                <button
                  key={task.id}
                  className="list-group-item list-group-item-action d-flex justify-content-between"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <span>{task.title}</span>
                  <small className="text-danger fw-bold">Due: {formatDueDate(task.dueDate)}</small>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Due Today */}
        {summary?.dueToday?.length > 0 && (
          <section className="mb-5">
            <h2 className="section-title">
              <Icon name="calendar" size={20} className="text-info me-2" />
              Due Today
            </h2>
            <div className="list-group">
              {summary.dueToday.map((task) => (
                <button
                  key={task.id}
                  className="list-group-item list-group-item-action"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <span>{task.title}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    )}
  </div>;
}
