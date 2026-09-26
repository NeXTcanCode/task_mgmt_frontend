import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import DueDate from './DueDate';
import OverdueBadge from './OverdueBadge';
import PriorityBadge from './PriorityBadge';
import SelectCheckbox from './SelectCheckbox';
import StatusSelect from './StatusSelect';
import TaskRowMenu from './TaskRowMenu';
import TimerButton from './TimerButton';
import TrackedTime from './TrackedTime';
import { isOverdue } from '../utils/taskStats';

// Only the columns the server can sort are clickable
function SortHeader({ label, value, sort, onSort }) {
  const active = sort === value;
  return <th scope="col" aria-sort={active ? 'ascending' : 'none'}>
    <button type="button" className={`sort-button ${active ? 'active' : ''}`} onClick={() => onSort(active ? 'newest' : value)}
      title={active ? 'Back to newest first' : `Sort by ${label.toLowerCase()}`}>
      {label}<Icon name="sort" size={14} />
    </button>
  </th>;
}

export default function TaskTable({ tasks, today, activeLog, selected, sort, openMenuId, onToggleSelect, onToggleSelectAll, onSort, onOpenMenu, onCloseMenu, onInsights, onDelete, notifyError }) {
  const ids = tasks.map((task) => task.id);
  const selectedCount = ids.filter((id) => selected.has(id)).length;

  return <div className="task-table-wrap">
    <table className="task-table">
      <colgroup>
        <col className="col-check" /><col /><col className="col-time" /><col className="col-priority" />
        <col className="col-status" /><col className="col-due" /><col className="col-menu" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">
            <SelectCheckbox checked={selectedCount > 0 && selectedCount === ids.length} indeterminate={selectedCount > 0 && selectedCount < ids.length}
              onChange={() => onToggleSelectAll(ids)} label="Select all visible tasks" />
          </th>
          <th scope="col">Task</th>
          <th scope="col">Time tracked</th>
          <SortHeader label="Priority" value="priority" sort={sort} onSort={onSort} />
          <th scope="col">Status</th>
          <SortHeader label="Due Date" value="dueDate" sort={sort} onSort={onSort} />
          <th scope="col"><span className="visually-hidden">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => {
          const overdue = isOverdue(task, today);
          return <tr key={task.id} className={selected.has(task.id) ? 'is-selected' : ''}>
            <td><SelectCheckbox checked={selected.has(task.id)} onChange={() => onToggleSelect(task.id)} label={`Select ${task.title}`} /></td>
            <td><Link to={`/tasks/${task.id}`} className={`task-title text-break ${task.status === 'completed' ? 'is-done' : ''}`}>{task.title}</Link></td>
            <td><div className="time-cell"><TrackedTime task={task} activeLog={activeLog} /><TimerButton task={task} activeLog={activeLog} onError={notifyError} /></div></td>
            <td><PriorityBadge priority={task.priority} /></td>
            <td><div className="status-cell"><StatusSelect task={task} onError={notifyError} />{overdue && <OverdueBadge />}</div></td>
            <td><DueDate dueDate={task.dueDate} overdue={overdue} /></td>
            <td className="text-end">
              <TaskRowMenu task={task} open={openMenuId === task.id} onOpen={() => onOpenMenu(task.id)}
                onClose={onCloseMenu} onInsights={() => onInsights(task.id)}
                onDelete={() => onDelete(task.id)} />
            </td>
          </tr>;
        })}
      </tbody>
    </table>
  </div>;
}
