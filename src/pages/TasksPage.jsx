import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import BulkActionBar from '../components/BulkActionBar';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';
import Icon from '../components/Icon';
import InsightsPanel from '../components/InsightsPanel';
import StatTiles from '../components/StatTiles';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import TaskTable from '../components/TaskTable';
import { useBulkTaskAction, useDeleteTask, useTasks } from '../hooks/useTasks';
import useMediaQuery from '../hooks/useMediaQuery';
import { useActiveTimer } from '../hooks/useTimer';
import { PRIORITIES, PRIORITY_LABELS, SORT_OPTIONS, STATUSES, STATUS_LABELS } from '../utils/constants';
import { todayLocal } from '../utils/formatDate';
import { getTaskStats } from '../utils/taskStats';

const plural = (count) => `${count} task${count === 1 ? '' : 's'}`;

// Filters live in the URL (?status=&priority=&sort=), so they survive reloads and can be shared.
// Unknown values fall back to the default.
const FILTERS = {
  status: { fallback: 'all', allowed: STATUSES },
  priority: { fallback: 'all', allowed: PRIORITIES },
  sort: { fallback: 'newest', allowed: SORT_OPTIONS.map((option) => option.value) },
};
const readFilter = (params, key) => (FILTERS[key].allowed.includes(params.get(key)) ? params.get(key) : FILTERS[key].fallback);
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

// The API returns tasks newest first; Array.sort is stable, so ties keep that order
function visibleTasks(tasks, filters) {
  return tasks
    .filter((task) => (filters.status === 'all' || task.status === filters.status)
      && (filters.priority === 'all' || task.priority === filters.priority))
    .sort((a, b) => {
      if (filters.sort === 'priority') return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (filters.sort === 'dueDate') {
        if (a.dueDate === b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate < b.dueDate ? -1 : 1;
      }
      return 0;
    });
}

export default function TasksPage() {
  const [params, setParams] = useSearchParams();
  const filters = { status: readFilter(params, 'status'), priority: readFilter(params, 'priority'), sort: readFilter(params, 'sort') };
  const [selectedIds, setSelectedIds] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [insightsTaskId, setInsightsTaskId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [confirm, setConfirm] = useState(null); // null | { type: 'delete', id } | { type: 'bulkDelete', ids }
  const [displayCount, setDisplayCount] = useState(8);
  const listRef = useRef(null);

  const allTasks = useTasks();
  const { data: activeLog } = useActiveTimer();
  const deleteTask = useDeleteTask();
  const bulk = useBulkTaskAction();
  // Render one layout only: table ≥ 992px, cards below (mounting both would duplicate menus and timers)
  const isDesktop = useMediaQuery('(min-width: 992px)');

  useEffect(() => { document.title = 'Tasks · TaskTracker'; }, []);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(8);
  }, [filters.status, filters.priority, filters.sort]);

  const today = todayLocal();
  const stats = useMemo(() => getTaskStats(allTasks.data ?? [], today), [allTasks.data, today]);
  const tasks = visibleTasks(allTasks.data ?? [], filters);
  // Only act on selected rows that are still visible (a task may have been deleted elsewhere)
  const visibleIds = new Set(tasks.map((task) => task.id));
  const visibleSelectedIds = selectedIds.filter((id) => visibleIds.has(id));
  const selected = new Set(visibleSelectedIds);
  const hasFilters = filters.status !== 'all' || filters.priority !== 'all';

  // Changing what's visible clears the selection, so bulk actions never touch hidden rows
  const setFilters = (changes) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(changes).forEach(([key, value]) => (value === FILTERS[key].fallback ? next.delete(key) : next.set(key, value)));
      return next;
    }, { replace: true });
    setSelectedIds([]);
    setOpenMenuId(null);
  };
  const clearFilters = () => setFilters({ status: 'all', priority: 'all', sort: 'newest' });
  const toggleSelect = (id) => setSelectedIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  const toggleSelectAll = (ids) => setSelectedIds((current) => (ids.length > 0 && ids.every((id) => current.includes(id)) ? [] : [...ids]));
  const openInsights = (id) => {
    setInsightsTaskId(id);
    setOpenMenuId(null);
  };
  const askDelete = (id) => {
    setConfirm({ type: 'delete', id });
    setOpenMenuId(null);
  };

  const pickTile = (key) => {
    if (PRIORITIES.includes(key)) setFilters({ priority: key });
    else if (key === 'done') setFilters({ status: 'completed' });
    else if (key === 'total') clearFilters();
    // Overdue has no filter: just bring the list into view
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const runBulk = (changes, ids) => {
    // Skip no-op requests (tasks that already have the value)
    const targets = changes ? ids.filter((id) => tasks.find((task) => task.id === id)?.[Object.keys(changes)[0]] !== Object.values(changes)[0]) : ids;
    if (targets.length === 0) {
      setSelectedIds([]);
      return toast.success('Nothing to change: the selected tasks already have that value.');
    }
    return bulk.mutate({ ids: targets, changes }, {
      onSuccess: ({ ok, failed }) => {
        const verb = changes ? 'updated' : 'deleted';
        setSelectedIds(failed.map((item) => item.id));
        // Completing a task doesn't stop its timer on the server, so say so
        if (changes?.status === 'completed' && activeLog && ok.includes(String(activeLog.taskId))) {
          toast.warning(`${plural(ok.length)} completed. The timer is still running on "${activeLog.task?.title}".`);
        } else if (failed.length === 0) {
          toast.success(`${plural(ok.length)} ${verb}.`);
        } else {
          toast.warning(`${ok.length} ${verb}, ${failed.length} failed: ${failed[0].message}`);
        }
      },
      onSettled: () => setConfirm(null),
    });
  };

  const confirmDelete = () => {
    if (confirm.type === 'bulkDelete') return runBulk(null, confirm.ids);
    return deleteTask.mutate(confirm.id, {
      onSuccess: () => {
        setConfirm(null);
        setSelectedIds((ids) => ids.filter((id) => id !== confirm.id));
        setInsightsTaskId((current) => (current === confirm.id ? null : current));
        toast.success('Task deleted.');
      },
      onError: (error) => {
        setConfirm(null);
        toast.error(error.message);
      },
    });
  };

  const rowProps = {
    today, activeLog, notifyError: toast.error, onToggleSelect: toggleSelect, onOpenMenu: setOpenMenuId, onCloseMenu: () => setOpenMenuId(null), onInsights: openInsights, onDelete: askDelete,
  };

  const displayed = tasks.slice(0, displayCount);
  const hasMore = tasks.length > displayCount;
  const remaining = tasks.length - displayCount;

  let list;
  if (allTasks.isPending) {
    list = <div className="skeleton-list" aria-busy="true">{[0, 1, 2, 3, 4].map((index) => <span key={index} className="skeleton skeleton-row" />)}</div>;
  } else if (allTasks.error) {
    list = <ErrorAlert error={allTasks.error} onRetry={allTasks.refetch} />;
  } else if (tasks.length === 0 && !hasFilters) {
    list = <EmptyState title="No tasks yet." text="Describe what you need to do, and AI can help you write it up."
      action={<button type="button" className="btn btn-primary" onClick={() => setShowCreateForm(true)}><Icon name="plus" size={16} /> New task</button>} />;
  } else if (tasks.length === 0) {
    list = <EmptyState title="No tasks match these filters."
      action={<button type="button" className="btn btn-light" onClick={clearFilters}>Clear filters</button>} />;
  } else {
    list = isDesktop
      ? <TaskTable tasks={displayed} selected={selected} sort={filters.sort} openMenuId={openMenuId} onToggleSelectAll={toggleSelectAll} onSort={(sort) => setFilters({ sort })} {...rowProps} />
      : <div className="task-cards">
        {displayed.map((task) => <TaskCard key={task.id} task={task} selected={selected.has(task.id)} menuOpen={openMenuId === task.id} {...rowProps} />)}
      </div>;
  }

  return <div className="page">
    <div className="page-header">
      <h1 className="page-title">Tasks</h1>
      <button type="button" className="btn btn-primary new-task-button" onClick={() => setShowCreateForm(true)}>
        <Icon name="plus" size={18} /> New task
      </button>
    </div>

    {/* On error the list below shows the alert (tiles and list share one query) */}
    {!allTasks.error && <StatTiles stats={stats} loading={allTasks.isPending} onPick={pickTile} />}

    <section ref={listRef} className="task-list-section" aria-label="Task list">
      {visibleSelectedIds.length > 0
        ? <BulkActionBar count={visibleSelectedIds.length} pending={bulk.isPending}
          onUpdate={(changes) => runBulk(changes, visibleSelectedIds)}
          onDelete={() => setConfirm({ type: 'bulkDelete', ids: visibleSelectedIds })}
          onClear={() => setSelectedIds([])} />
        : <div className="filter-row">
          <nav className="status-tabs" aria-label="Filter by status">
            {['all', ...STATUSES].map((status) => <button type="button" key={status} className={`status-tab ${filters.status === status ? 'active' : ''}`}
              aria-pressed={filters.status === status} onClick={() => setFilters({ status })}>
              {status === 'all' ? 'All' : STATUS_LABELS[status]}
            </button>)}
          </nav>
          <div className="filter-selects">
            <label className="visually-hidden" htmlFor="priority-filter">Priority</label>
            <select id="priority-filter" className="form-select form-select-sm" value={filters.priority} onChange={(event) => setFilters({ priority: event.target.value })}>
              <option value="all">All priorities</option>
              {PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>)}
            </select>
            {/* On desktop the table headers sort; this select is for small screens */}
            <label className="visually-hidden" htmlFor="sort-select">Sort</label>
            <select id="sort-select" className="form-select form-select-sm sort-select" value={filters.sort} onChange={(event) => setFilters({ sort: event.target.value })}>
              {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>Sort: {option.label}</option>)}
            </select>
          </div>
        </div>}
      {list}
      {hasMore && tasks.length > 0 && (
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
    </section>

    {showCreateForm && <TaskForm onClose={() => setShowCreateForm(false)}
      onCreated={() => {
        setShowCreateForm(false);
        toast.success('Task created.');
      }} />}

    {insightsTaskId && <InsightsPanel taskId={insightsTaskId} notifyError={toast.error}
      onClose={() => setInsightsTaskId(null)}
      onMissing={() => {
        setInsightsTaskId(null);
        toast.warning('That task no longer exists.');
      }} />}

    {confirm && <ConfirmModal
      title={confirm.type === 'bulkDelete' ? `Delete ${plural(confirm.ids.length)}?` : 'Delete task?'}
      body={confirm.type === 'bulkDelete' ? `Delete ${plural(confirm.ids.length)} and all their time logs? This can't be undone.` : "Delete this task and all its time logs? This can't be undone."}
      pending={deleteTask.isPending || bulk.isPending}
      onConfirm={confirmDelete}
      onCancel={() => setConfirm(null)} />}
  </div>;
}
