import React from 'react';

// A canvas is invisible to screen readers, so every chart states its key fact in the caption
export default function ChartFigure({ title, caption, empty, emptyText, className = '', children }) {
  return <figure className={`chart-card ${className}`}>
    <figcaption>
      <h3 className="chart-title">{title}</h3>
      {caption && !empty && <p className="chart-caption">{caption}</p>}
    </figcaption>
    {empty ? <p className="chart-empty">{emptyText}</p> : <div className="chart-box">{children}</div>}
  </figure>;
}
