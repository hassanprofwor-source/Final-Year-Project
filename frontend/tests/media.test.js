import { describe, expect, it } from "vitest";
import { optimizedImageUrl } from "../src/lib/media.js";

describe("Cloudinary image URLs", () => {
  it("W10 injects a transform and leaves an already-transformed URL alone", () => {
    const raw = "https://res.cloudinary.com/demo/image/upload/menu/burger.jpg";
    expect(optimizedImageUrl(raw, 480)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:eco,c_fill,g_auto,w_480/menu/burger.jpg",
    );

    const already =
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:eco,c_fill,g_auto,w_320/menu/burger.jpg";
    expect(optimizedImageUrl(already, 480)).toBe(already);
  });
});
