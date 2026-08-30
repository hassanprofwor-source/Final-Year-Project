from dotenv import load_dotenv

from peak_hours import train_and_save

load_dotenv()


def main():
    _, meta = train_and_save()
    print("Peak-hours model saved.")
    print(f"  samples: {meta['sampleSize']}")
    print(f"  real orders: {meta['realOrderCount']}")
    print(f"  used synthetic: {meta['usedSynthetic']}")
    if meta.get("loadError"):
        print(f"  mongo error: {meta['loadError']}")
    metrics = meta.get("metrics") or {}
    print(f"  MAE: {metrics.get('mae')}")
    print(f"  R2: {metrics.get('r2')}")
    print(f"  trained at: {meta['trainedAt']}")


if __name__ == "__main__":
    main()
