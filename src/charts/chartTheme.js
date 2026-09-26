import { formatDuration } from '../utils/formatDuration';

// Colors come from the same CSS variables as the badges, read once
let cached;
export function chartColors() {
  if (cached) return cached;
  const styles = getComputedStyle(document.documentElement);
  const css = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  cached = {
    accent: css('--accent', '#6d3df2'),
    accentSoft: css('--accent-soft', '#efe9ff'),
    surface: css('--surface', '#ffffff'),
    grid: css('--border', '#ebe9f1'),
    text: css('--text-muted', '#6b6880'),
    priority: { high: css('--priority-high', '#e03131'), medium: css('--priority-medium', '#f08c00'), low: css('--priority-low', '#2f9e44') },
    status: { pending: css('--status-pending', '#868e96'), in_progress: css('--status-doing', '#1c6ef2'), completed: css('--status-done', '#2f9e44') },
    // Categorical order checked for colour-blind separation; slot 6 is the grey "Other"
    palette: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#adb5bd'],
    weekdays: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7'],
  };
  return cached;
}

// Axis ticks for values in minutes: "45m", then "2h"
export const minutesTick = (value) => (value >= 120 ? `${Math.round(value / 6) / 10}h` : `${value}m`);
// Doughnut values in minutes → "1h 05m"
export const formatMinutes = (minutes) => formatDuration(minutes * 60);
export const minutesTooltip = (context) => ` ${formatDuration(context.raw * 60)}`;

export function baseOptions({ horizontal = false, stacked = false, valueTick, tooltipLabel } = {}) {
  const colors = chartColors();
  const valueAxis = { beginAtZero: true, stacked, grid: { color: colors.grid }, border: { display: false }, ticks: { color: colors.text, precision: 0, callback: valueTick } };
  const categoryAxis = { stacked, grid: { display: false }, border: { display: false }, ticks: { color: colors.text, autoSkip: true, maxRotation: 0 } };
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: { display: stacked, position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, color: colors.text } },
      tooltip: { callbacks: tooltipLabel ? { label: tooltipLabel } : {} },
    },
    scales: horizontal ? { x: valueAxis, y: categoryAxis } : { x: categoryAxis, y: valueAxis },
  };
}
