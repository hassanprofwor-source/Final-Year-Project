import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Tooltip,
  Legend,
} from "chart.js";
import { Clock3, Database, Flame, Sparkles } from "lucide-react";
import Badge from "../../components/ui/Badge";
import StatCard from "../../components/ui/StatCard";
import {
  currentWeekday,
  driftLabel,
  driftTone,
  formatDate,
  sourceLabel,
} from "./sourceLabel";

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Tooltip, Legend);

const PeakHoursChart = ({ payload }) => {
  const [weekday, setWeekday] = useState(currentWeekday(payload?.weekdays));

  const selectedDay = payload?.weekdays?.includes(weekday)
    ? weekday
    : currentWeekday(payload?.weekdays);

  const chartData = useMemo(() => {
    if (!payload) return null;
    return {
      labels: (payload.hours || []).map((hour) => `${hour}:00`),
      datasets: [
        {
          label: "Orders placed",
          data: payload.actuals?.[selectedDay] || [],
          backgroundColor: "#b91c1c",
        },
        {
          label: "Forecast",
          data: payload.predictions?.[selectedDay] || [],
          backgroundColor: "#9ca3af",
        },
      ],
    };
  }, [payload, selectedDay]);

  const busiestHour = useMemo(() => {
    if (!payload) return "—";
    const todayName = payload.insights?.todayPeak?.weekday || currentWeekday(payload.weekdays);
    const values = payload.actuals?.[todayName] || [];
    const hours = payload.hours || [];
    if (!values.length) return "—";
    const max = Math.max(...values);
    if (max <= 0) return "—";
    const hour = hours[values.indexOf(max)];
    return hour == null ? "—" : `${hour}:00`;
  }, [payload]);

  const todayPeak = payload?.insights?.todayPeak;
  const typicalPeak = todayPeak?.label || "—";
  const drift = payload?.drift;
  const selectedDate = formatDate(payload?.predictionDates?.[selectedDay]);
  const drivers = payload?.predictionDrivers?.[selectedDay] || [];

  const peakHint = () => {
    if (todayPeak?.expectedOrders == null) return undefined;
    if (todayPeak.range) {
      return `About ${todayPeak.expectedOrders} orders (${todayPeak.range.low}–${todayPeak.range.high} likely)`;
    }
    return `About ${todayPeak.expectedOrders} orders`;
  };

  return (
    <section className="rounded-2xl border border-white/8 bg-surface p-4 lg:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Peak hours</h2>
          <p className="mt-1 text-sm text-gray">
            Average orders per hour over the last {payload?.actualsWindowDays ?? 28} days,
            next to the model's forecast for the coming week.
          </p>
        </div>
        {drift?.status && (
          <Badge tone={driftTone(drift.status)}>{driftLabel(drift.status)}</Badge>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Busiest hour" value={busiestHour} icon={Flame} hint="From orders placed" />
        <StatCard label="Forecast peak" value={typicalPeak} icon={Clock3} hint={peakHint()} />
        <StatCard
          label="Live orders"
          value={payload?.realOrderCount ?? payload?.sampleSize ?? "—"}
          icon={Database}
        />
        <StatCard label="Data source" value={sourceLabel(payload)} icon={Sparkles} />
      </div>

      {payload?.weekdays && (
        <div className="mb-6 flex flex-wrap gap-2">
          {payload.weekdays.map((day) => (
            <button
              key={day}
              onClick={() => setWeekday(day)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                selectedDay === day ? "bg-red text-white" : "bg-elevated text-gray hover:text-white"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      )}

      {selectedDate && (
        <p className="mb-3 text-xs text-gray">
          Forecast shown for {selectedDay} {selectedDate}.
        </p>
      )}

      {chartData && (
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: { position: "top", labels: { color: "#c4c4c8" } },
            },
            scales: {
              x: {
                title: { display: true, text: "Hour of day", color: "#9ca3af" },
                ticks: { color: "#9ca3af" },
                grid: { display: false },
              },
              y: {
                title: { display: true, text: "Number of orders", color: "#9ca3af" },
                ticks: { color: "#9ca3af" },
                grid: { color: "rgba(255,255,255,0.06)" },
                beginAtZero: true,
              },
            },
          }}
        />
      )}

      {drivers.length > 0 && (
        <p className="mt-4 text-sm text-gray">
          Driving the {selectedDay} forecast: {drivers.join(" and ")}.
        </p>
      )}
    </section>
  );
};

export default PeakHoursChart;
