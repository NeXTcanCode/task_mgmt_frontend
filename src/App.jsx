import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import SignupPage from './pages/SignupPage';
import TaskDetailPage from './pages/TaskDetailPage';
import InsightsPage from './pages/InsightsPage';
import TasksPage from './pages/TasksPage';
import TodayPage from './pages/TodayPage';
import TimeLogsPage from './pages/TimeLogsPage';

export default function App() {
  return <Routes>
    <Route element={<PublicOnlyRoute />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route index element={<TasksPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/timelogs" element={<TimeLogsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}
