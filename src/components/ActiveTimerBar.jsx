import React from 'react';
import { Link } from 'react-router-dom';
import useElapsed from '../hooks/useElapsed';
import { useActiveTimer, useStopTimer } from '../hooks/useTimer';
import { formatClock } from '../utils/formatDuration';
import Icon from './Icon';

export default function ActiveTimerBar() {
  const { data: activeLog } = useActiveTimer();
  const stop = useStopTimer();
  const elapsed = useElapsed(activeLog?.startTime);
  if (!activeLog) return null;

  return <div className="active-timer-bar" role="region" aria-label="Running timer">
    <div className="active-timer-inner">
      <span className="live-dot" aria-hidden="true" />
      <Link to={`/tasks/${activeLog.taskId}`} className="active-timer-title text-truncate">{activeLog.task?.title || 'Running task'}</Link>
      <span className="active-timer-clock" aria-live="off">{formatClock(elapsed)}</span>
      <button type="button" className="btn btn-sm btn-light" onClick={() => stop.mutate(activeLog.taskId)} disabled={stop.isPending}>
        <Icon name="stop" size={14} filled /> Stop
      </button>
    </div>
  </div>;
}
