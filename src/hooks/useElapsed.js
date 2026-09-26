import useNow from './useNow';

// Seconds since the server's startTime, ticking every second; survives refreshes
export default function useElapsed(startTime) {
  const now = useNow(startTime ? 1000 : null);
  return startTime ? Math.max(0, Math.floor((now - new Date(startTime)) / 1000)) : 0;
}
