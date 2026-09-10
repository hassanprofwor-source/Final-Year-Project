import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from popular_items import PLACEHOLDER_IMAGE, apply_image_fallback, resolve_image


class ImageFallbackTests(unittest.TestCase):
    """Cart items predate image uploads, so ranked dishes need a fallback chain."""

    def test_cart_image_wins(self):
        image = resolve_image({"name": "Pizza", "image": "cart.png"}, {"Pizza": "menu.png"})
        self.assertEqual(image, "cart.png")

    def test_catalog_image_is_used_when_cart_has_none(self):
        image = resolve_image({"name": "Pizza", "image": ""}, {"Pizza": "menu.png"})
        self.assertEqual(image, "menu.png")

    def test_placeholder_is_used_when_nothing_else_exists(self):
        self.assertEqual(resolve_image({"name": "Pizza", "image": ""}, {}), PLACEHOLDER_IMAGE)

    def test_no_ranked_item_is_left_without_an_image(self):
        items = [
            {"name": "Pizza", "image": "cart.png"},
            {"name": "Naan", "image": ""},
            {"name": "Unknown Dish", "image": ""},
        ]
        for item in apply_image_fallback(items, {"Naan": "menu.png"}):
            self.assertTrue(item["image"])


if __name__ == "__main__":
    unittest.main()
