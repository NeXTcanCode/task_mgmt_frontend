import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { baseOptions } from './chartTheme';

export default function BarChart({ labels, datasets, horizontal, stacked, valueTick, tooltipLabel, ariaLabel }) {
  const options = useMemo(() => baseOptions({ horizontal, stacked, valueTick, tooltipLabel }), [horizontal, stacked, valueTick, tooltipLabel]);
  const data = useMemo(() => ({
    labels,
    datasets: datasets.map((dataset) => ({ borderRadius: 6, maxBarThickness: 36, ...dataset })),
  }), [labels, datasets]);
  return <Bar data={data} options={options} role="img" aria-label={ariaLabel} />;
}
