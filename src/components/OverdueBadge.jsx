import React from 'react';
import Icon from './Icon';

export default function OverdueBadge() {
  return <span className="overdue-badge"><Icon name="alert" size={13} />Overdue</span>;
}
