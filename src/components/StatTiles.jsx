import React from 'react';
import Icon from './Icon';

const GROUPS = [
  [
    { key: 'low', label: 'Low Priority', icon: 'flag', tone: 'priority-low', filled: true, hint: 'Show low priority tasks' },
    { key: 'medium', label: 'Medium Priority', icon: 'flag', tone: 'priority-medium', filled: true, hint: 'Show medium priority tasks' },
    { key: 'high', label: 'High Priority', icon: 'flag', tone: 'priority-high', filled: true, hint: 'Show high priority tasks' },
  ],
  [
    { key: 'total', label: 'Total Task', icon: 'file', tone: 'tone-blue', hint: 'Show all tasks' },
    { key: 'done', label: 'Total Task Done', icon: 'check-circle', tone: 'tone-green', hint: 'Show completed tasks' },
    { key: 'overdue', label: 'Overdue', icon: 'alert', tone: 'tone-red', hint: 'Jump to the task list' },
  ],
];

// Always describes ALL tasks; clicking a tile applies the matching filter
export default function StatTiles({ stats, loading, onPick }) {
  return <section className="stat-groups" aria-label="Task statistics">
    {GROUPS.map((group, index) => <div className="stat-group" key={index}>
      {group.map((tile) => <button type="button" key={tile.key} className="stat-tile" onClick={() => onPick(tile.key)} title={tile.hint}>
        <span className="stat-label"><span className={tile.tone}><Icon name={tile.icon} size={16} filled={tile.filled} /></span>{tile.label}</span>
        <span className="stat-value">{loading ? <span className="skeleton skeleton-number" /> : stats[tile.key]}</span>
      </button>)}
    </div>)}
  </section>;
}
