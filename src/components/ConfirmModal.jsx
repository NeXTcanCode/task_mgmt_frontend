import React from 'react';
import Modal from './Modal';

export default function ConfirmModal({ title, body, confirmLabel = 'Delete', pending, onConfirm, onCancel }) {
  return <Modal title={title} onClose={onCancel} footer={<>
    <button type="button" className="btn btn-light" onClick={onCancel} disabled={pending}>Cancel</button>
    <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={pending}>
      {pending && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}{confirmLabel}
    </button>
  </>}>
    <p className="mb-0">{body}</p>
  </Modal>;
}
