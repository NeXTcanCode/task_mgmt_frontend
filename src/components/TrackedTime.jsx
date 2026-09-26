import React from 'react';
import useElapsed from '../hooks/useElapsed';
import { isRunningTask } from '../hooks/useTimer';
import { formatClock, formatDuration } from '../utils/formatDuration';

// totalTime counts finished sessions only; the running one is added live
export default function TrackedTime({ task, activeLog }) {
  const running = isRunningTask(activeLog, task.id);
  const elapsed = useElapsed(running ? activeLog.startTime : null);
  return <span className="tracked-time">
    <span className="tracked-total">{formatDuration(task.totalTime + elapsed)}</span>
    {running && <span className="live-clock"><span className="live-dot" aria-hidden="true" />{formatClock(elapsed)}</span>}
  </span>;
}
