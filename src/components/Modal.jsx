import React, { useId } from 'react';
import useOverlay from '../hooks/useOverlay';

// Bootstrap modal markup, shown and hidden by React (no bootstrap.Modal JS)
export default function Modal({ title, onClose, footer, fullscreenMobile = false, children }) {
  const titleId = useId();
  const dialogRef = useOverlay(onClose);

  return <>
    <div className="modal fade show d-block" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={dialogRef}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal-dialog modal-dialog-centered ${fullscreenMobile ? 'modal-fullscreen-sm-down' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title h5" id={titleId}>{title}</h2>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
    <div className="modal-backdrop fade show" />
  </>;
}
