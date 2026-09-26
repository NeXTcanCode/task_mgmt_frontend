import React, { useEffect, useRef } from 'react';

// Checkbox with a 44px tap area; supports the "some selected" (indeterminate) state
export default function SelectCheckbox({ checked, indeterminate = false, onChange, label }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return <label className="select-box">
    <input ref={ref} type="checkbox" className="form-check-input" checked={checked} onChange={onChange} aria-label={label} />
  </label>;
}
