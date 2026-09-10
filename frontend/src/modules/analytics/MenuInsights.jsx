import React from "react";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import { formatMoney } from "../../lib/currency";
import { optimizedImageUrl } from "../../lib/media";

const rankTone = (rank) => {
  if (rank === 1) return "completed";
  if (rank === 2) return "accepted";
  if (rank === 3) return "pending";
  return "neutral";
};

const ItemThumb = ({ item }) => (
  <img
    src={optimizedImageUrl(item.image, 96) || "/default-food.png"}
    alt=""
    loading="lazy"
    className="h-12 w-12 rounded-lg object-cover"
  />
);

const MenuInsights = ({ payload }) => {
  const hotSellers = payload?.hotSellers || [];
  const quietItems = payload?.quietItems || [];
  const forecast = payload?.demandForecast;
  const forecastItems = forecast?.items || [];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-white">Hot sellers</h2>
        <p className="mt-1 text-sm text-gray">
          Top dishes by units sold in the last {payload?.windowDays ?? 30} days.
        </p>
        {hotSellers.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-white/8 bg-surface">
            <EmptyState
              title="No hot sellers yet"
              description="Accepted and completed orders will rank here."
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {hotSellers.map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-white/8 bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <ItemThumb item={item} />
                  <Badge tone={rankTone(item.rank)}>#{item.rank} this month</Badge>
                </div>
                <h3 className="mt-3 text-base font-semibold text-white">{item.name}</h3>
                <p className="mt-1 text-sm text-gray">
                  {item.units} sold · {formatMoney(Number(item.revenue).toFixed(2))}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {forecastItems.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-white/8 bg-surface">
          <div className="border-b border-white/8 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">
              Expected demand, next {forecast?.horizonDays ?? 7} days
            </h3>
            <p className="mt-1 text-xs text-gray">
              Forecast units per dish, with the range the model considers likely.
              Use it to plan prep and ordering.
            </p>
          </div>
          <div className="divide-y divide-white/8">
            {forecastItems.map((item) => (
              <div key={item.name} className="flex items-center gap-3 px-4 py-3">
                <ItemThumb item={item} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{item.name}</p>
                  <p className="text-xs text-gray">
                    {item.low}–{item.high} units likely
                  </p>
                </div>
                <p className="text-sm font-semibold text-white">{item.next7Days} units</p>
              </div>
            ))}
          </div>
          {forecast?.accuracy != null && (
            <p className="border-t border-white/8 px-4 py-3 text-xs text-gray">
              Off by about {forecast.accuracy} units per dish per day on held-out data.
            </p>
          )}
        </section>
      )}

      {quietItems.length > 0 && (
        <section className="rounded-2xl border border-white/8 bg-surface p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-white">Quiet items</h2>
          <p className="mt-1 text-sm text-gray">Lowest sellers that still appeared in recent orders.</p>
          <div className="mt-4 flex flex-col gap-3">
            {quietItems.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <ItemThumb item={item} />
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-gray">
                    {item.units} sold · {formatMoney(Number(item.revenue).toFixed(2))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MenuInsights;
