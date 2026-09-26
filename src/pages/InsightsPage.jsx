import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import AiSummaryCard from '../components/AiSummaryCard';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';
import InsightsPanel from '../components/InsightsPanel';
import { OverviewReminderList } from '../components/ReminderList';
import BarChart from '../charts/BarChart';
import ChartFigure from '../charts/ChartFigure';
import DoughnutChart from '../charts/DoughnutChart';
import LineChart from '../charts/LineChart';
import { chartColors, formatMinutes, minutesTick, minutesTooltip } from '../charts/chartTheme';
import { useInsights } from '../hooks/useInsights';
import useNow from '../hooks/useNow';
import { useTasks } from '../hooks/useTasks';
import { useActiveTimer } from '../hooks/useTimer';
import { useTimeLogs } from '../hooks/useTimeLogs';
import { PRIORITIES, PRIORITY_LABELS, RANGES, STATUSES, STATUS_LABELS } from '../utils/constants';
import { addDays, formatDayLabel, formatShortDay, parseDateKey, todayLocal } from '../utils/formatDate';
import { formatDuration } from '../utils/formatDuration';
import {
  buildOverviewReminders, completedPerDay, priorityOpenDone, secondsByTask, secondsPerDay, statusCounts, totalSeconds,
} from '../utils/insightsData';
import { getTaskStats } from '../utils/taskStats';

// Stable empty list while a query loads, so useMemo deps don't change every render
const NO_ITEMS = [];

const toMinutes = (seconds) => Math.round(seconds / 6) / 10;

function useOverview(tasks, logs, days, now) {
  return useMemo(() => {
    const colors = chartColors();
    const perDay = secondsPerDay(logs, days, now);
    const byTask = secondsByTask(logs, now);
    const completed = completedPerDay(tasks, days, now);
    const statuses = statusCounts(tasks);
    const priorities = priorityOpenDone(tasks);
    const tracked = totalSeconds(logs, now);
    const completedCount = completed.reduce((sum, day) => sum + day.count, 0);
    const dayLabel = days > 7 ? formatShortDay : formatDayLabel;
    const busiestDay = perDay.reduce((best, day) => (day.seconds > best.seconds ? day : best), perDay[0]);

    return {
      kpis: {
        tracked,
        dailyAverage: tracked / days,
        completedCount,
        doneRate: tasks.length ? Math.round((statuses.completed / tasks.length) * 100) : null,
      },
      perDay: {
        labels: perDay.map((day) => dayLabel(day.key)),
        datasets: [{ label: 'Tracked', data: perDay.map((day) => toMinutes(day.seconds)), backgroundColor: colors.accent }],
        busiestDay,
      },
      byTask: {
        rows: byTask,
        labels: byTask.map((row) => row.title),
        data: byTask.map((row) => toMinutes(row.seconds)),
        colors: byTask.map((row, index) => (row.id ? colors.palette[index] : colors.palette[5])),
      },
      completed: { labels: completed.map((day) => dayLabel(day.key)), data: completed.map((day) => day.count) },
      status: {
        labels: STATUSES.map((status) => STATUS_LABELS[status]),
        data: STATUSES.map((status) => statuses[status]),
        colors: STATUSES.map((status) => colors.status[status]),
      },
      priority: {
        labels: PRIORITIES.map((priority) => PRIORITY_LABELS[priority]),
        datasets: [
          { label: 'Open', data: PRIORITIES.map((priority) => priorities[priority].open), backgroundColor: PRIORITIES.map((priority) => colors.priority[priority]) },
          { label: 'Done', data: PRIORITIES.map((priority) => priorities[priority].done), backgroundColor: colors.grid },
        ],
      },
      reminders: buildOverviewReminders(tasks, logs, now),
    };
  }, [tasks, logs, days, now]);
}

export default function InsightsPage() {
  const [rangeKey, setRangeKey] = useState('week'); // 'week' (7 days) | 'month' (30 days)
  const [insightsTaskId, setInsightsTaskId] = useState(null);
  const range = RANGES[rangeKey];
  const today = todayLocal();
  // Built from today's date (not Date.now()) so the query key stays the same all day
  const from = parseDateKey(addDays(today, -(range.days - 1))).toISOString();

  const tasksQuery = useTasks();
  const logsQuery = useTimeLogs({ from });
  const aiQuery = useInsights(rangeKey);
  const { data: activeLog } = useActiveTimer();
  const now = useNow(activeLog ? 30_000 : null);
  const tasks = tasksQuery.data ?? NO_ITEMS;
  const logs = logsQuery.data ?? NO_ITEMS;
  const overview = useOverview(tasks, logs, range.days, now);
  const overdue = getTaskStats(tasks, today).overdue;

  // Memoized: DoughnutChart rebuilds its options (and redraws) when this function changes
  const onTaskSlice = useCallback((index) => {
    const row = overview.byTask.rows[index];
    if (row?.id) setInsightsTaskId(row.id);
  }, [overview.byTask.rows]);

  useEffect(() => { document.title = 'Insights · TaskTracker'; }, []);

  const loading = tasksQuery.isPending || logsQuery.isPending;
  const error = tasksQuery.error || logsQuery.error;
  const noTime = overview.kpis.tracked === 0;
  const topTask = overview.byTask.rows[0];

  const kpis = [
    { label: 'tracked', value: formatDuration(overview.kpis.tracked) },
    { label: 'daily avg', value: formatDuration(overview.kpis.dailyAverage) },
    { label: 'completed', value: overview.kpis.completedCount },
    { label: 'done rate', value: overview.kpis.doneRate === null ? '–' : `${overview.kpis.doneRate}%` },
    { label: 'overdue', value: overdue, tone: overdue ? 'tone-red' : '' },
  ];

  let body;
  if (loading) {
    body = <div className="row g-3" aria-busy="true">{[0, 1, 2, 3].map((index) => <div className="col-12 col-lg-6" key={index}><span className="skeleton skeleton-chart" /></div>)}</div>;
  } else if (error) {
    body = <ErrorAlert error={error} onRetry={() => { tasksQuery.refetch(); logsQuery.refetch(); }} />;
  } else if (tasks.length === 0) {
    body = <EmptyState title="Nothing to analyse yet." text="Create a few tasks and track time to see insights." action={<Link to="/" className="btn btn-primary">Go to Tasks</Link>} />;
  } else {
    body = <div className="row g-3">
      <div className="col-12"><OverviewReminderList groups={overview.reminders} onOpenTask={setInsightsTaskId} /></div>
      <div className="col-12"><AiSummaryCard title={range.title} query={aiQuery} /></div>

      <div className="col-12 col-lg-6">
        <ChartFigure title="Tracked time per day" empty={noTime} emptyText={`No time tracked in the last ${range.label}.`}
          caption={`${formatDuration(overview.kpis.tracked)} in total, most on ${formatDayLabel(overview.perDay.busiestDay.key)}.`}>
          <BarChart labels={overview.perDay.labels} datasets={overview.perDay.datasets} valueTick={minutesTick} tooltipLabel={minutesTooltip}
            ariaLabel={`Bar chart of time tracked per day, ${formatDuration(overview.kpis.tracked)} in total`} />
        </ChartFigure>
      </div>
      <div className="col-12 col-lg-6">
        <ChartFigure title="Time by task" empty={noTime} emptyText={`No time tracked in the last ${range.label}.`}
          caption={topTask && `Most time went to "${topTask.title}": ${formatDuration(topTask.seconds)}. Click a slice for details.`}>
          <DoughnutChart labels={overview.byTask.labels} data={overview.byTask.data} colors={overview.byTask.colors} formatValue={formatMinutes}
            onSliceClick={onTaskSlice} ariaLabel={topTask ? `Doughnut chart of time by task; most time went to ${topTask.title}` : 'Doughnut chart of time by task'} />
        </ChartFigure>
      </div>
      <div className="col-12 col-lg-6">
        <ChartFigure title="Completed per day" caption={`${overview.kpis.completedCount} task${overview.kpis.completedCount === 1 ? '' : 's'} completed in the last ${range.label}.`}>
          <LineChart labels={overview.completed.labels} data={overview.completed.data} label="Completed"
            ariaLabel={`Line chart of tasks completed per day, ${overview.kpis.completedCount} in total`} />
        </ChartFigure>
      </div>
      <div className="col-12 col-lg-6">
        <ChartFigure title="Status" caption={`${overview.status.data[2]} of ${tasks.length} done${overdue ? `, ${overdue} overdue` : ''}.`}>
          <DoughnutChart labels={overview.status.labels} data={overview.status.data} colors={overview.status.colors} centerLabel="Tasks"
            ariaLabel={`Doughnut chart of task status: ${overview.status.labels.map((label, index) => `${overview.status.data[index]} ${label}`).join(', ')}`} />
        </ChartFigure>
      </div>
      <div className="col-12">
        <ChartFigure title="Priority: open vs done" caption={`${overview.priority.datasets[0].data[0]} high priority task${overview.priority.datasets[0].data[0] === 1 ? '' : 's'} still open.`}>
          <BarChart labels={overview.priority.labels} datasets={overview.priority.datasets} stacked horizontal
            ariaLabel="Stacked bar chart of open and done tasks per priority" />
        </ChartFigure>
      </div>
    </div>;
  }

  return <div className="page">
    <div className="page-header">
      <h1 className="page-title">Insights</h1>
      <div className="range-switch" role="group" aria-label="Time range">
        {Object.entries(RANGES).map(([key, option]) => <button type="button" key={key} className={`status-tab ${rangeKey === key ? 'active' : ''}`}
          aria-pressed={rangeKey === key} onClick={() => setRangeKey(key)}>{option.label}</button>)}
      </div>
    </div>

    <dl className="kpi-row">
      {kpis.map((kpi) => <div className="kpi" key={kpi.label}>
        <dt>{kpi.label}</dt>
        <dd className={kpi.tone}>{loading ? <span className="skeleton skeleton-number" /> : kpi.value}</dd>
      </div>)}
    </dl>

    {body}

    {insightsTaskId && <InsightsPanel taskId={insightsTaskId} notifyError={toast.error}
      onClose={() => setInsightsTaskId(null)}
      onMissing={() => {
        setInsightsTaskId(null);
        toast.warning('That task no longer exists.');
      }} />}
  </div>;
}
