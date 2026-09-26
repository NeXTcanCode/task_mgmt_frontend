import React, { useMemo, useState } from 'react';
import AiSummaryCard from './AiSummaryCard';
import ErrorAlert from './ErrorAlert';
import { TaskReminderList } from './ReminderList';
import Spinner from './Spinner';
import BarChart from '../charts/BarChart';
import ChartFigure from '../charts/ChartFigure';
import DoughnutChart from '../charts/DoughnutChart';
import { chartColors, formatMinutes, minutesTick, minutesTooltip } from '../charts/chartTheme';
import useElapsed from '../hooks/useElapsed';
import { useTaskInsights } from '../hooks/useInsights';
import useNow from '../hooks/useNow';
import { isRunningTask, useActiveTimer } from '../hooks/useTimer';
import { useTimeLogs } from '../hooks/useTimeLogs';
import { RANGES } from '../utils/constants';
import { formatDayLabel, formatDateTime, formatShortDay } from '../utils/formatDate';
import { formatDuration } from '../utils/formatDuration';
import { buildTaskReminders, recentSessions, secondsByWeekday, secondsPerDay, sessionStats } from '../utils/insightsData';

// Stable empty list while a query loads, so useMemo deps don't change every render
const NO_ITEMS = [];

const toMinutes = (seconds) => Math.round(seconds / 6) / 10;

const busiest = (rows) => rows.reduce((best, row) => (row.seconds > best.seconds ? row : best), rows[0]);

function useTaskCharts(task, logs, now, days) {
  return useMemo(() => {
    const colors = chartColors();
    const color = colors.priority[task.priority];
    const perDay = secondsPerDay(logs, days, now);
    const weekdays = secondsByWeekday(perDay);
    const sessions = recentSessions(logs, now);
    const dayLabel = days > 7 ? formatShortDay : formatDayLabel;
    return {
      perDay: {
        labels: perDay.map((day) => dayLabel(day.key)),
        datasets: [{ label: 'Time', data: perDay.map((day) => toMinutes(day.seconds)), backgroundColor: color }],
        total: perDay.reduce((sum, day) => sum + day.seconds, 0),
        busiestDay: busiest(perDay),
      },
      weekdays: {
        labels: weekdays.map((day) => day.label),
        data: weekdays.map((day) => toMinutes(day.seconds)),
        colors: colors.weekdays,
        busiestDay: busiest(weekdays),
      },
      sessions: {
        labels: sessions.map((session) => formatDateTime(session.startTime)),
        datasets: [{
          label: 'Session',
          data: sessions.map((session) => toMinutes(session.seconds)),
          backgroundColor: sessions.map((session) => (session.running ? `${color}66` : color)),
        }],
      },
    };
  }, [task.priority, logs, now, days]);
}

// Stats, reminders, AI summary and charts for one task (used in the panel and on Task Detail)
export default function TaskInsights({ task }) {
  const [rangeKey, setRangeKey] = useState('week'); // 'week' (7 days) | 'month' (30 days)
  const range = RANGES[rangeKey];
  const logsQuery = useTimeLogs({ taskId: task.id });
  const aiQuery = useTaskInsights(task.id);
  const { data: activeLog } = useActiveTimer();
  const running = isRunningTask(activeLog, task.id);
  const elapsed = useElapsed(running ? activeLog.startTime : null);
  // Charts refresh every 30s while this task's timer runs (not every second)
  const now = useNow(running ? 30_000 : null);
  const logs = logsQuery.data ?? NO_ITEMS;
  const charts = useTaskCharts(task, logs, now, range.days);
  const stats = useMemo(() => sessionStats(logs), [logs]);
  const reminders = useMemo(() => buildTaskReminders(task, logs, now), [task, logs, now]);

  if (logsQuery.isPending) return <Spinner />;
  if (logsQuery.error) return <ErrorAlert error={logsQuery.error} onRetry={logsQuery.refetch} />;

  const noTime = logs.length === 0;
  const noTimeInRange = charts.perDay.total === 0;
  return <div className="task-insights">
    <dl className="insight-stats">
      <div><dt>Total</dt><dd>{formatDuration(task.totalTime + elapsed)}</dd></div>
      <div><dt>Sessions</dt><dd>{stats.count}</dd></div>
      <div><dt>Average</dt><dd>{stats.average ? formatDuration(stats.average) : '–'}</dd></div>
      <div><dt>Longest</dt><dd>{stats.longest ? formatDuration(stats.longest) : '–'}</dd></div>
    </dl>

    <TaskReminderList reminders={reminders} />
    <AiSummaryCard query={aiQuery} />

    {noTime
      ? <p className="chart-empty">No time tracked yet. Press Start to begin.</p>
      : <>
        <div className="range-switch" role="group" aria-label="Time range">
          {Object.entries(RANGES).map(([key, option]) => <button type="button" key={key} className={`status-tab ${rangeKey === key ? 'active' : ''}`}
            aria-pressed={rangeKey === key} onClick={() => setRangeKey(key)}>{option.label}</button>)}
        </div>
        <ChartFigure title="Tracked time per day" empty={noTimeInRange} emptyText={`No time tracked in the last ${range.label}.`}
          caption={`${formatDuration(charts.perDay.total)} in the last ${range.label}, most on ${formatDayLabel(charts.perDay.busiestDay.key)}.`}>
          <BarChart labels={charts.perDay.labels} datasets={charts.perDay.datasets} valueTick={minutesTick} tooltipLabel={minutesTooltip}
            ariaLabel={`Bar chart of time tracked per day over the last ${range.label}, ${formatDuration(charts.perDay.total)} in total`} />
        </ChartFigure>
        <ChartFigure title="Time by weekday" empty={noTimeInRange} emptyText={`No time tracked in the last ${range.label}.`}
          caption={`Most time on ${charts.weekdays.busiestDay.label} in the last ${range.label}.`}>
          <DoughnutChart labels={charts.weekdays.labels} data={charts.weekdays.data} colors={charts.weekdays.colors} formatValue={formatMinutes}
            ariaLabel={`Doughnut chart of time by weekday, most on ${charts.weekdays.busiestDay.label}`} />
        </ChartFigure>
        <ChartFigure title={`Sessions (last ${charts.sessions.labels.length})`} caption={`Average session ${formatDuration(stats.average)}, longest ${formatDuration(stats.longest)}.`}>
          <BarChart labels={charts.sessions.labels} datasets={charts.sessions.datasets} valueTick={minutesTick} tooltipLabel={minutesTooltip}
            ariaLabel="Bar chart of the length of each recent session" />
        </ChartFigure>
      </>}
  </div>;
}
