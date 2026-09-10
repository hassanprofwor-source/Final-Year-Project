import argparse
import os

from dotenv import load_dotenv

load_dotenv()


def set_tuning_profile(fast):
    """Pin the grid for this run instead of trusting the surrounding shell.

    load_dotenv does not override a variable that is already exported, so a
    leftover TUNING_PROFILE=fast in the session would otherwise tune the
    shipped model over a fraction of the grid without saying so. A real
    training run is always thorough unless --fast is asked for explicitly.
    """
    os.environ["TUNING_PROFILE"] = "fast" if fast else "full"


def describe_grid():
    from model_training import active_param_grid

    grid = active_param_grid()
    combinations = 1
    for values in grid.values():
        combinations *= len(values)
    return f"{os.environ['TUNING_PROFILE']} ({combinations} combinations)"


def print_stage(label, metrics):
    if not metrics:
        print(f"  {label}: not evaluated")
        return
    print(
        f"  {label}: MAE {metrics.get('mae')} | RMSE {metrics.get('rmse')} "
        f"| R2 {metrics.get('r2')} | rows {metrics.get('rows')}"
    )


def train_peak_hours():
    from peak_hours import train_and_save

    _model, meta = train_and_save()
    metrics = meta.get("metrics") or {}

    print("Peak-hours model")
    print(f"  samples: {meta.get('sampleSize')}")
    print(f"  real orders: {meta.get('realOrderCount')}")
    print(f"  used synthetic: {meta.get('usedSynthetic')}")
    if meta.get("loadError"):
        print(f"  mongo error: {meta['loadError']}")
    print(f"  rows: {metrics.get('rows')}")
    print(f"  best params: {metrics.get('bestParams')}")
    print_stage("train", metrics.get("train"))
    print_stage("validation", metrics.get("validation"))
    print_stage("test (holdout)", metrics.get("test"))

    promotion = meta.get("promotion") or {}
    print(f"  promoted: {promotion.get('promote')} — {promotion.get('reason')}")

    for entry in (meta.get("featureImportances") or [])[:5]:
        print(f"    {entry['feature']}: {entry['weight']}")
    print(f"  trained at: {meta.get('trainedAt')}")


def train_items():
    import item_demand
    from popular_items import load_order_item_rows

    _model, meta = item_demand.train_and_save(load_order_item_rows())
    meta = meta or {}
    metrics = meta.get("metrics") or {}

    print("Item-demand model")
    if not meta.get("ready"):
        print(f"  skipped: {meta.get('reason')}")
        return
    print(f"  items: {meta.get('itemCount')} | days: {meta.get('days')}")
    print(f"  best params: {meta.get('hyperparameters')}")
    print_stage("train", metrics.get("train"))
    print_stage("validation", metrics.get("validation"))
    print_stage("test (holdout)", metrics.get("test"))

    promotion = meta.get("promotion") or {}
    print(f"  promoted: {promotion.get('promote')} — {promotion.get('reason')}")

    for entry in (meta.get("featureImportances") or [])[:5]:
        print(f"    {entry['feature']}: {entry['weight']}")
    print(f"  trained at: {meta.get('trainedAt')}")


def main():
    parser = argparse.ArgumentParser(description="Train the analytics models.")
    parser.add_argument(
        "--only",
        choices=["peak", "items"],
        help="Train just one of the two models.",
    )
    parser.add_argument(
        "--fast",
        action="store_true",
        help="Search a trimmed hyperparameter grid. Quicker, but a weaker model.",
    )
    args = parser.parse_args()

    set_tuning_profile(args.fast)
    print(f"Tuning grid: {describe_grid()}\n")

    if args.only != "items":
        train_peak_hours()
    if args.only != "peak":
        train_items()


if __name__ == "__main__":
    main()
