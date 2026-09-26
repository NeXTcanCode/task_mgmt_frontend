import React from 'react';
import Icon from './Icon';
import { PRIORITY_LABELS } from '../utils/constants';

export default function PriorityBadge({ priority }) {
  return <span className={`priority-badge priority-${priority}`}>
    <Icon name="flag" size={14} filled />{PRIORITY_LABELS[priority]}
  </span>;
}
