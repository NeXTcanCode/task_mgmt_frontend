import {
  ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, Filler,
  Legend, LinearScale, LineController, LineElement, PointElement, Tooltip,
} from 'chart.js';

// Register only what we use (chart.js/auto would pull in everything)
Chart.register(
  ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Filler,
  Legend, LinearScale, LineController, LineElement, PointElement, Tooltip,
);

Chart.defaults.font.family = "'DM Sans', Inter, system-ui, sans-serif";
Chart.defaults.font.size = 12;
