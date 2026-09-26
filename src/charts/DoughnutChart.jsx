import React, { useMemo, useRef, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { chartColors } from './chartTheme';
import useInView from '../hooks/useInView';

const percentOf = (value, total) => (total ? Math.round((value / total) * 100) : 0);

// Ring + centre readout + legend list. The legend doubles as the table view:
// every slice's label, value and share are readable without the colours.
export default function DoughnutChart({ labels, data: values, colors, formatValue = String, centerLabel = 'Total', onSliceClick, ariaLabel }) {
  const chartRef = useRef(null);
  const [active, setActive] = useState(null); // hovered slice index
  const total = values.reduce((sum, value) => sum + value, 0);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    layout: { padding: 8 },
    // Slices sweep around and grow out from the centre
    animation: { animateRotate: true, animateScale: true, duration: 1000, easing: 'easeOutQuart' },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    onClick: onSliceClick ? (event, elements) => elements[0] && onSliceClick(elements[0].index) : undefined,
    onHover: (event, elements) => {
      setActive(elements.length ? elements[0].index : null);
      if (onSliceClick) event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
    },
  }), [onSliceClick]);

  const data = useMemo(() => ({
    labels,
    datasets: [{
      data: values, backgroundColor: colors, hoverBackgroundColor: colors,
      borderWidth: 2, borderColor: chartColors().surface, hoverBorderColor: chartColors().surface, borderRadius: 4, hoverOffset: 8,
    }],
  }), [labels, values, colors]);

  // Legend hover lights up the matching slice
  const highlight = (index) => {
    setActive(index);
    const chart = chartRef.current;
    if (!chart) return;
    chart.setActiveElements(index === null ? [] : [{ datasetIndex: 0, index }]);
    chart.update();
  };

  // Create the chart only once it's on screen, so its entry animation isn't missed further down the page
  const [ref, inView] = useInView();
  const shown = active !== null && values[active] !== undefined;
  const Row = onSliceClick ? 'button' : 'div';

  return <div className="donut">
    <div ref={ref} className="donut-ring">
      {inView && <Doughnut ref={chartRef} data={data} options={options} role="img" aria-label={ariaLabel} />}
      <div className="donut-center" aria-hidden="true">
        <span className="donut-center-value">{formatValue(shown ? values[active] : total)}</span>
        <span className="donut-center-label">{shown ? `${labels[active]} · ${percentOf(values[active], total)}%` : centerLabel}</span>
      </div>
    </div>

    <ul className="donut-legend" onMouseLeave={() => highlight(null)}>
      {labels.map((label, index) => <li key={`${label}-${index}`}>
        <Row {...(onSliceClick ? { type: 'button', onClick: () => onSliceClick(index) } : {})}
          className={`donut-legend-row ${active === index ? 'is-active' : ''} ${values[index] ? '' : 'is-empty'}`}
          onMouseEnter={() => highlight(index)} onFocus={() => highlight(index)} onBlur={() => highlight(null)}>
          <span className="donut-swatch" style={{ background: colors[index] }} aria-hidden="true" />
          <span className="donut-legend-label">{label}</span>
          <span className="donut-legend-value">{values[index] ? formatValue(values[index]) : '–'}</span>
          <span className="donut-legend-pct">{percentOf(values[index], total)}%</span>
        </Row>
      </li>)}
    </ul>
  </div>;
}
