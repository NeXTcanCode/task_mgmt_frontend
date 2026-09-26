import React from 'react';
import { Outlet } from 'react-router-dom';
import { useActiveTimer } from '../hooks/useTimer';
import ActiveTimerBar from './ActiveTimerBar';
import Sidebar from './Sidebar';

export default function Layout() {
  const { data: activeLog } = useActiveTimer();
  return <div className="app-shell">
    <Sidebar />
    <main className={`app-main ${activeLog ? 'has-timer' : ''}`}><Outlet /></main>
    <ActiveTimerBar />
  </div>;
}
