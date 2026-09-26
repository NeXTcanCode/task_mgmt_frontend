import React, { useState } from 'react';
import Icon from './Icon';

// Flat reminders for one task: [{ key, tone, icon, text }]
export function TaskReminderList({ reminders }) {
  return <section className="insight-card" aria-labelledby="task-reminders-title">
    <h3 className="insight-card-title" id="task-reminders-title"><Icon name="bell" size={16} /> Reminders</h3>
    {reminders.length === 0
      ? <p className="text-muted mb-0">Nothing needs attention 🎉</p>
      : <ul className="reminder-list">
        {reminders.map((reminder) => <li key={reminder.key} className={`reminder tone-${reminder.tone}`}><Icon name={reminder.icon} size={16} />{reminder.text}</li>)}
      </ul>}
  </section>;
}

// Grouped reminders for all tasks: each group expands to its tasks
export function OverviewReminderList({ groups, onOpenTask }) {
  // One isolated value (which group is expanded), so useState is enough
  const [openKey, setOpenKey] = useState(null);
  return <section className="insight-card h-100" aria-labelledby="overview-reminders-title">
    <h3 className="insight-card-title" id="overview-reminders-title"><Icon name="bell" size={16} /> Reminders</h3>
    {groups.length === 0
      ? <p className="text-muted mb-0">Nothing needs attention 🎉</p>
      : <ul className="reminder-list">
        {groups.map((group) => <li key={group.key}>
          <button type="button" className={`reminder reminder-toggle tone-${group.tone}`} onClick={() => setOpenKey(openKey === group.key ? null : group.key)} aria-expanded={openKey === group.key}>
            <Icon name={group.icon} size={16} /><span>{group.tasks.length} · {group.label}</span><span className="ms-auto small">{openKey === group.key ? 'Hide' : 'Show'}</span>
          </button>
          {openKey === group.key && <ul className="reminder-tasks">
            {group.tasks.map((task) => <li key={task.id}>
              <button type="button" className="link-button text-break" onClick={() => onOpenTask(task.id)}>{task.title}</button>
              {task.note && <span className="text-muted small">{task.note}</span>}
            </li>)}
          </ul>}
        </li>)}
      </ul>}
  </section>;
}
