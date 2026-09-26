import { useEffect, useRef } from 'react';

// Shared behaviour for dialogs (Modal, InsightsPanel): Esc closes, page scroll is locked,
// focus moves into the dialog on open and back to the trigger on close.
// Returns a ref to put on the dialog element.
export default function useOverlay(onClose) {
  const dialogRef = useRef(null);
  // Parents often pass an inline onClose; a ref keeps the effect from re-running every render
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const onKey = (event) => event.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previousFocus?.focus?.();
    };
  }, []);

  return dialogRef;
}
