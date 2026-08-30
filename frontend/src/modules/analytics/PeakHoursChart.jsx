import React, { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { BarChart3 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import apiClient from "../../lib/apiClient";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const apiUrl = import.meta.env.VITE_SERVER_URL;

const PeakHoursChart = () => {
  const [payload, setPayload] = useState(null);
  const [weekday, setWeekday] = useState("Friday");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await apiClient.get(`${apiUrl}/api/v1/analytics/peak-hours`);
        const data = response.data.data;
        setPayload(data);
        if (data?.weekdays?.length) {
          setWeekday(data.weekdays[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Could not load peak hours. Is the Flask ML service running?");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartData = useMemo(() => {
    if (!payload) return null;
    const actuals = payload.actuals?.[weekday] || [];
    const predicted = payload.predictions?.[weekday] || [];
    return {
      labels: (payload.hours || []).map((hour) => `${hour}:00`),
      datasets: [
        {
          label: `${weekday} actual orders`,
          data: actuals,
          backgroundColor: "rgba(225, 29, 72, 0.85)",
          borderRadius: 8,
        },
        {
          label: `${weekday} model expected`,
          data: predicted,
          backgroundColor: "rgba(196, 196, 200, 0.45)",
          borderRadius: 8,
        },
      ],
    };
  }, [payload, weekday]);

  const busiestHour = useMemo(() => {
    if (!chartData) return "—";
    const values = chartData.datasets[0].data;
    if (!values.length) return "—";
    const max = Math.max(...values);
    if (max <= 0) return "—";
    const maxIndex = values.indexOf(max);
    return chartData.labels[maxIndex];
  }, [chartData]);

  return (
    <div>
      <PageHeader
        title="Peak Hours Analytics"
      />

      <div className="px-4 py-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Busiest hour" value={busiestHour} icon={BarChart3} />
          <StatCard label="Live orders" value={payload?.realOrderCount ?? payload?.sampleSize ?? "—"} icon={BarChart3} />
          <StatCard
            label="Data source"
            value={payload?.usedSynthetic ? "Synthetic" : payload ? "Live database" : "—"}
            icon={BarChart3}
          />
        </div>

        {payload?.weekdays && (
          <div className="mb-6 flex flex-wrap gap-2">
            {payload.weekdays.map((day) => (
              <button
                key={day}
                onClick={() => setWeekday(day)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  weekday === day ? "bg-red text-white" : "bg-elevated text-gray hover:text-white"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        )}

        {loading && <p className="text-gray">Loading predictions…</p>}
        {error && <p className="text-red">{error}</p>}
        {chartData && !loading && (
          <div className="rounded-2xl border border-white/8 bg-surface p-4">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: "#c4c4c8" } },
                },
                scales: {
                  x: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(255,255,255,0.06)" } },
                  y: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(255,255,255,0.06)" }, beginAtZero: true },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PeakHoursChart;
