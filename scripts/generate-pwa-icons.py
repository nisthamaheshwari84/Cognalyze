import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs("public/icons", exist_ok=True)

def create_cognalyze_icon(size, is_maskable=False):
    # Base image
    img = Image.new("RGBA", (size, size), (9, 13, 22, 255) if is_maskable else (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = size * 0.1 if is_maskable else size * 0.06
    shape_box = [margin, margin, size - margin, size - margin]
    corner_radius = size * 0.22

    # Draw rounded card with gradient illusion
    if not is_maskable:
        # Subtle outer glow / shadow
        draw.rounded_rectangle(shape_box, radius=corner_radius, fill=(15, 23, 42, 255), outline=(99, 102, 241, 200), width=max(2, int(size * 0.015)))
    else:
        # Full maskable safe zone
        draw.rounded_rectangle(shape_box, radius=corner_radius, fill=(15, 23, 42, 255), outline=(99, 102, 241, 255), width=max(2, int(size * 0.02)))

    # Central stylized Cognalyze emblem:
    # Outer ring arc (representing the 'C' of Cognalyze)
    center_x, center_y = size / 2, size / 2
    r = size * 0.28
    width_stroke = max(4, int(size * 0.07))
    arc_box = [center_x - r, center_y - r, center_x + r, center_y + r]
    
    # Draw indigo/cyan glowing arc from 45 deg to 315 deg (open C)
    draw.arc(arc_box, start=45, end=315, fill=(99, 102, 241, 255), width=width_stroke)

    # Core neural node / lightning node at center
    inner_r = size * 0.12
    draw.ellipse([center_x - inner_r, center_y - inner_r, center_x + inner_r, center_y + inner_r], fill=(168, 85, 247, 240), outline=(56, 189, 248, 255), width=max(2, int(size * 0.02)))

    # Spark points (4 placement radar vertices)
    vertex_r = max(3, int(size * 0.035))
    nodes = [
        (center_x, center_y - r * 1.15),
        (center_x, center_y + r * 1.15),
        (center_x + r * 1.15, center_y),
        (center_x - r * 1.15, center_y),
    ]
    for (nx, ny) in nodes:
        draw.ellipse([nx - vertex_r, ny - vertex_r, nx + vertex_r, ny + vertex_r], fill=(52, 211, 153, 255))

    return img

sizes = {
    "public/icons/icon-192x192.png": (192, False),
    "public/icons/icon-512x512.png": (512, False),
    "public/icons/icon-maskable-192x192.png": (192, True),
    "public/icons/icon-maskable-512x512.png": (512, True),
    "public/icons/apple-touch-icon.png": (180, True)
}

for path, (sz, maskable) in sizes.items():
    icon = create_cognalyze_icon(sz, maskable)
    icon.save(path, "PNG")
    print(f"Generated {path} ({sz}x{sz}, maskable={maskable})")
