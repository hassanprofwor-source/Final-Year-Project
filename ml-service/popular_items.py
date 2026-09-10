from collections import defaultdict
from datetime import timedelta

from config import format_hour_label, now_local
from item_demand import demand_payload
from peak_hours import (
    WEEKDAYS,
    active_hours,
    get_collection,
    load_live_orders,
    load_saved_model,
    parse_order_datetime,
    predict_week,
)

COUNTED_STATUSES = {"Accepted", "Completed"}
WINDOW_DAYS = 30

PLACEHOLDER_IMAGE = "/default-food.png"


def load_order_item_rows():
    collection = get_collection()
    rows = []
    projection = {"createdAt": 1, "date": 1, "time": 1, "status": 1, "cartItems": 1}
    for doc in collection.find({}, projection):
        if doc.get("status") not in COUNTED_STATUSES:
            continue
        timestamp = parse_order_datetime(doc)
        if timestamp is None:
            continue
        items = doc.get("cartItems") or []
        if not items:
            continue
        for item in items:
            name = str(item.get("name") or "").strip()
            quantity = int(item.get("quantity") or 0)
            if not name or quantity <= 0:
                continue
            price = float(item.get("price") or 0)
            rows.append(
                {
                    "name": name,
                    "image": item.get("image") or "",
                    "quantity": quantity,
                    "revenue": price * quantity,
                    "timestamp": timestamp,
                    "order_id": str(doc.get("_id")),
                }
            )
    return rows


def catalog_image_url(value):
    """Menu images are stored as a Cloudinary `{public_id, url}` pair."""
    if isinstance(value, dict):
        return value.get("url") or ""
    return value or ""


def menu_image_map():
    """Item name to image, read from the menu catalog.

    Historic cart items predate image uploads, so the catalog is the fallback
    before the static placeholder.
    """
    try:
        collection = get_collection()
        catalog = collection.database["fooditems"]
        return {
            str(doc.get("name") or "").strip(): catalog_image_url(doc.get("image"))
            for doc in catalog.find({}, {"name": 1, "image": 1})
            if doc.get("name")
        }
    except Exception:
        return {}


def resolve_image(item, catalog):
    return item.get("image") or catalog.get(item.get("name"), "") or PLACEHOLDER_IMAGE


def apply_image_fallback(items, catalog):
    return [{**item, "image": resolve_image(item, catalog)} for item in items]


def summarize(rows):
    totals = {}
    for row in rows:
        current = totals.get(row["name"])
        if current is None:
            current = {
                "name": row["name"],
                "image": row["image"],
                "units": 0,
                "revenue": 0.0,
            }
            totals[row["name"]] = current
        current["units"] += row["quantity"]
        current["revenue"] += row["revenue"]
        if not current["image"] and row["image"]:
            current["image"] = row["image"]

    ranked = sorted(
        totals.values(),
        key=lambda item: (item["units"], item["revenue"]),
        reverse=True,
    )
    for item in ranked:
        item["revenue"] = round(float(item["revenue"]), 2)
    return ranked


def rank_items(ranked, limit):
    return [{**item, "rank": index + 1} for index, item in enumerate(ranked[:limit])]


def predicted_today_peak_hour(timestamps=None):
    model, _meta = load_saved_model()
    if model is None:
        return None
    today_name = WEEKDAYS[now_local().weekday()]
    values = predict_week(model, timestamps).get(today_name) or []
    if not any(values):
        return None
    hours = active_hours()
    peak = int(max(range(len(values)), key=lambda index: values[index]))
    return hours[peak] if peak < len(hours) else None


def most_common_hour(rows):
    hours = active_hours()
    counts = defaultdict(int)
    for row in rows:
        hour = row["timestamp"].hour
        if hour in hours:
            counts[hour] += row["quantity"]
    if not counts:
        return hours[len(hours) // 2]
    return max(counts, key=counts.get)


def peak_pairing(window_rows, hour, catalog=None):
    hour_rows = [row for row in window_rows if row["timestamp"].hour == hour]
    items = apply_image_fallback(
        rank_items(summarize(hour_rows), 3), catalog or {}
    )
    today_name = WEEKDAYS[now_local().weekday()]
    label = format_hour_label(hour)
    if not items:
        prep_line = f"Not enough item sales at {label} yet to suggest prep."
    elif len(items) == 1:
        prep_line = f"At {label}, {items[0]['name']} leads — prep that first."
    elif len(items) == 2:
        prep_line = (
            f"At {label}, {items[0]['name']} and {items[1]['name']} lead — "
            "prep those first."
        )
    else:
        prep_line = (
            f"At {label}, {items[0]['name']}, {items[1]['name']}, and "
            f"{items[2]['name']} lead — prep those first."
        )
    return {
        "hour": hour,
        "label": label,
        "weekday": today_name,
        "items": items,
        "prepLine": prep_line,
    }


def menu_insights_payload():
    now = now_local()
    try:
        rows = load_order_item_rows()
        load_error = None
    except Exception as error:
        rows = []
        load_error = str(error)

    catalog = menu_image_map() if rows else {}

    window_start = now - timedelta(days=WINDOW_DAYS)
    window_rows = [row for row in rows if row["timestamp"] >= window_start]
    ranked = summarize(window_rows)
    hot_sellers_all = apply_image_fallback(rank_items(ranked, 8), catalog)
    hot_sellers = hot_sellers_all[:3]
    top_names = {item["name"] for item in hot_sellers}
    quiet = apply_image_fallback(
        [
            {**item, "rank": None}
            for item in reversed(ranked)
            if item["name"] not in top_names
        ][:3],
        catalog,
    )

    timestamps, _peak_error = load_live_orders()
    peak_hour = predicted_today_peak_hour(timestamps) or most_common_hour(window_rows)
    pairing = peak_pairing(window_rows, peak_hour, catalog)

    return {
        "windowDays": WINDOW_DAYS,
        "orderCount": len({row["order_id"] for row in window_rows}),
        "hotSellers": hot_sellers,
        "hotSellersAll": hot_sellers_all,
        "quietItems": quiet,
        "peakPairing": pairing,
        "demandForecast": _demand_forecast(rows, catalog),
        "source": "flask-live",
        "usedSynthetic": False,
        "loadError": load_error,
    }


def _demand_forecast(rows, catalog):
    try:
        payload = demand_payload(rows)
    except Exception as error:
        return {"ready": False, "items": [], "reason": str(error)}

    payload["items"] = [
        {**item, "image": resolve_image({"name": item["name"], "image": ""}, catalog)}
        for item in payload.get("items") or []
    ]
    return payload
