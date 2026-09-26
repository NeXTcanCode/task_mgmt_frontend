import React from 'react';
import Icon from './Icon';
import { formatDueDate } from '../utils/formatDate';

// No due date → nothing (not "No due date")
export default function DueDate({ dueDate, withIcon = false, overdue = false }) {
  if (!dueDate) return null;
  return <span className={`due-date ${overdue ? 'is-overdue' : ''}`}>
    {withIcon && <Icon name="calendar" size={14} />}{formatDueDate(dueDate)}
  </span>;
}
