import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import apiClient from "../lib/apiClient";
import PeakHoursChart from "../modules/analytics/PeakHoursChart";
import MenuInsights from "../modules/analytics/MenuInsights";
import { sourceLabel } from "../modules/analytics/sourceLabel";

const apiUrl = import.meta.env.VITE_SERVER_URL;

function Analytics() {
  const [peakPayload, setPeakPayload] = useState(null);
  const [menuPayload, setMenuPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState("");
  const [retrainError, setRetrainError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [peakResult, menuResult] = await Promise.allSettled([
        apiClient.get(`${apiUrl}/api/v1/analytics/peak-hours`),
        apiClient.get(`${apiUrl}/api/v1/analytics/menu-insights`),
      ]);

      if (peakResult.status === "fulfilled") {
        setPeakPayload(peakResult.value.data.data);
      }
      if (menuResult.status === "fulfilled") {
        setMenuPayload(menuResult.value.data.data);
      }
      if (peakResult.status === "rejected" && menuResult.status === "rejected") {
        const err = peakResult.reason;
        setError(err.response?.data?.message || "Could not load analytics.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainError("");
    try {
      const response = await apiClient.post(`${apiUrl}/api/v1/analytics/retrain`);
      setPeakPayload(response.data.data);
    } catch (err) {
      setRetrainError(err.response?.data?.message || "Could not retrain the peak-hours model.");
    } finally {
      setRetraining(false);
    }
  };

  const insights = peakPayload?.insights;
  const drift = peakPayload?.drift;
  const coverage = peakPayload?.coverage;
  const pairing = menuPayload?.peakPairing;
  const windowDays = menuPayload?.windowDays ?? 30;
  const orderCount = menuPayload?.orderCount ?? 0;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Busy hours and best-selling dishes from live orders and the peak-hours model."
        actions={
          <Button onClick={handleRetrain} disabled={retraining || loading} variant="secondary">
            <RefreshCw className={`h-4 w-4 ${retraining ? "animate-spin" : ""}`} />
            {retraining ? "Retraining…" : "Retrain model"}
          </Button>
        }
      />

      <div className="space-y-6 px-4 py-6 lg:px-8">
        {loading && <p className="text-gray">Loading analytics…</p>}
        {error && <p className="text-red">{error}</p>}
        {retrainError && <p className="text-red">{retrainError}</p>}

        {!loading && !error && (
          <>
            <section className="rounded-2xl border border-white/8 bg-surface p-4 lg:p-6">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-red">What to do today</p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                {insights?.headline || "Peak-hour insights will appear here."}
              </h2>
              <div className="mt-3 space-y-2 text-sm text-gray">
                {insights?.why && <p>{insights.why}</p>}
                {insights?.vsExpected && <p>{insights.vsExpected}</p>}
                {insights?.nextBusyWindow && (
                  <p>Busiest window today: {insights.nextBusyWindow}.</p>
                )}
                {pairing?.prepLine && <p>{pairing.prepLine}</p>}
              </div>
            </section>

            {coverage?.stalled && (
              <p className="rounded-2xl border border-yellow/30 bg-yellow/10 p-4 text-sm text-yellow">
                {coverage.message}
              </p>
            )}

            {!coverage?.stalled && drift?.status === "degraded" && (
              <p className="rounded-2xl border border-red/30 bg-red/10 p-4 text-sm text-red">
                {drift.message}
              </p>
            )}

            {menuPayload && <MenuInsights payload={menuPayload} />}
            {peakPayload && <PeakHoursChart payload={peakPayload} />}

            <p className="text-xs text-gray">
              Last {windowDays} days · {orderCount} counted orders · {sourceLabel(peakPayload)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Analytics;
