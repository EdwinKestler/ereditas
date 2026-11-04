"""Extract the right-hand iPhone 16 frame used by the guided demo.

Run from anywhere with: python3 scripts/make_bezel.py
"""

from collections import deque
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[4]
SOURCE = REPO_ROOT / "resources" / "Thumbnail-Bezel-iPhone16_2x.png"
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "bezel" / "iphone16-silver.png"

# Pixel geometry in the 2046 x 1248 source. The crop includes a 3 px AA margin.
CROP = (1164, 98, 1674, 1150)
SCREEN_SEED = (1400, 600)
GREY = (128, 128, 128)
FLOOD_TOLERANCE = 30

# Geometry in the 510 x 1052 output, also mirrored in src/app/bezel.ts.
SCREEN_RECT = {"left": 21, "top": 19, "width": 468, "height": 1014, "radius": 58}


def grey_distance(pixel: tuple[int, int, int, int]) -> int:
    return max(abs(pixel[channel] - GREY[channel]) for channel in range(3))


def flood_grey(image: Image.Image, seeds: list[tuple[int, int]]) -> bytearray:
    width, height = image.size
    seen = bytearray(width * height)
    queue = deque(seeds)
    while queue:
        x, y = queue.popleft()
        if x < 0 or y < 0 or x >= width or y >= height:
            continue
        index = y * width + x
        if seen[index] or grey_distance(image.getpixel((x, y))) > FLOOD_TOLERANCE:
            continue
        seen[index] = 1
        queue.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))
    return seen


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    width, height = source.size
    edge_seeds = (
        [(x, 0) for x in range(width)]
        + [(x, height - 1) for x in range(width)]
        + [(0, y) for y in range(height)]
        + [(width - 1, y) for y in range(height)]
    )
    outside = flood_grey(source, edge_seeds)
    screen = flood_grey(source, [SCREEN_SEED])
    pixels = source.load()
    for y in range(height):
        for x in range(width):
            if not (outside[y * width + x] or screen[y * width + x]):
                continue
            distance = grey_distance(pixels[x, y])
            alpha = 0 if distance <= 3 else round(255 * (distance - 3) / (FLOOD_TOLERANCE - 3))
            red, green, blue, original_alpha = pixels[x, y]
            pixels[x, y] = (red, green, blue, min(original_alpha, alpha))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    source.crop(CROP).save(OUTPUT, optimize=True)
    print(f"wrote {OUTPUT} ({CROP[2] - CROP[0]}x{CROP[3] - CROP[1]})")
    print(f"screen rectangle: {SCREEN_RECT}")


if __name__ == "__main__":
    main()
