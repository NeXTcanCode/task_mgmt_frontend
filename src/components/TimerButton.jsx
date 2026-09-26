import React from 'react';
import { isRunningTask, useStartTimer, useStopTimer } from '../hooks/useTimer';
import Icon from './Icon';

export default function TimerButton({ task, activeLog, onError, withLabel = false }) {
  const start = useStartTimer();
  const stop = useStopTimer();
  const running = isRunningTask(activeLog, task.id);
  const blocked = Boolean(activeLog) && !running;
  const pending = start.isPending || stop.isPending;

  const handleError = (error) => onError?.(error.status === 409 ? 'A timer is already running. Stop it first.' : error.message);
  const toggle = () => (running
    ? stop.mutate(task.id, { onError: handleError })
    : start.mutate(task.id, { onError: handleError }));

  const label = running ? 'Stop timer' : blocked ? 'Stop the running timer first' : 'Start timer';
  return <button type="button" className={`timer-button ${running ? 'is-running' : ''} ${withLabel ? 'with-label' : ''}`}
    onClick={toggle} disabled={pending || blocked} aria-label={`${label}: ${task.title}`} title={label}>
    {pending ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <Icon name={running ? 'stop' : 'play'} size={16} filled />}
    {withLabel && <span>{running ? 'Stop' : 'Start'}</span>}
  </button>;
}
