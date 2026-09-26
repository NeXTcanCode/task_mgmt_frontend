import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { baseOptions, chartColors } from './chartTheme';

export default function LineChart({ labels, data: values, label, ariaLabel }) {
  const options = useMemo(() => baseOptions(), []);
  const data = useMemo(() => {
    const colors = chartColors();
    return {
      labels,
      datasets: [{ label, data: values, borderColor: colors.accent, backgroundColor: colors.accentSoft, fill: true, tension: 0.3, pointRadius: 3 }],
    };
  }, [labels, values, label]);
  return <Line data={data} options={options} role="img" aria-label={ariaLabel} />;
}
