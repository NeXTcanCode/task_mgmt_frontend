import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';

// React-controlled dropdown (no Bootstrap dropdown JS / Popper)
export default function TaskRowMenu({ task, open, onOpen, onClose, onInsights, onDelete }) {
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const [openUp, setOpenUp] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => !wrapRef.current?.contains(event.target) && closeRef.current();
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      closeRef.current();
      buttonRef.current?.focus();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    wrapRef.current?.querySelector('.dropdown-item')?.focus();
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (open) return onClose();
    // Near the bottom of the viewport the menu opens upward
    setOpenUp(buttonRef.current.getBoundingClientRect().bottom > window.innerHeight - 180);
    return onOpen();
  };

  return <div className="row-menu-wrap" ref={wrapRef}>
    <button type="button" ref={buttonRef} className="icon-button" onClick={toggle} aria-haspopup="menu" aria-expanded={open}
      aria-label={`Actions for ${task.title}`} title="Actions">
      <Icon name="more" size={20} />
    </button>
    {open && <div className={`dropdown-menu show row-menu ${openUp ? 'open-up' : ''}`} role="menu">
      <button type="button" className="dropdown-item" role="menuitem" onClick={onInsights}><Icon name="chart" size={16} /> Insights</button>
      <Link className="dropdown-item" role="menuitem" to={`/tasks/${task.id}`}><Icon name="edit" size={16} /> Details &amp; edit</Link>
      <div className="dropdown-divider" />
      <button type="button" className="dropdown-item text-danger" role="menuitem" onClick={onDelete}><Icon name="trash" size={16} /> Delete</button>
    </div>}
  </div>;
}
