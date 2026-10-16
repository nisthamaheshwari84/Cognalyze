import os
import sys
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

def main():
    src_path = '/Users/nisthamaheshwari/.gemini/antigravity-ide/brain/171f7ec4-bd51-4435-9bed-a81727dbbfa8/.user_uploaded/media_1792176852087.jpg'
    if not os.path.exists(src_path):
        print(f"Error: {src_path} not found")
        sys.exit(1)

    im = Image.open(src_path).convert('RGB')
    arr = np.array(im, dtype=np.float32)
    h, w, _ = arr.shape

    print(f"Loaded source image: {w}x{h}")

    # 1. Background Flood-Fill in Squircle Region (y < 640)
    visited = np.zeros((640, w), dtype=bool)
    q = deque()
    for x in range(w):
        q.append((0, x))
        visited[0, x] = True
    for y in range(640):
        q.append((y, 0))
        visited[y, 0] = True
        q.append((y, w-1))
        visited[y, w-1] = True

    while q:
        y, x = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < 640 and 0 <= nx < w and not visited[ny, nx]:
                if arr[ny, nx].min() > 110:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    # Squircle RGBA with smooth antialiased perimeter
    squircle_rgba = np.zeros((640, w, 4), dtype=np.uint8)
    for y in range(640):
        for x in range(w):
            if not visited[y, x]:
                squircle_rgba[y, x] = [int(arr[y, x, 0]), int(arr[y, x, 1]), int(arr[y, x, 2]), 255]
            else:
                b = arr[y, x].mean()
                if b < 248:
                    alpha = int(np.clip((255 - b) / (255 - 60) * 255, 0, 255))
                    squircle_rgba[y, x] = [21, 44, 76, alpha]

    sy, sx = np.where(squircle_rgba[:, :, 3] > 0)
    min_sy, max_sy = sy.min(), sy.max()
    min_sx, max_sx = sx.min(), sx.max()
    squircle_crop = Image.fromarray(squircle_rgba[min_sy:max_sy+1, min_sx:max_sx+1])
    print(f"Extracted Squircle Symbol: {squircle_crop.size}")

    # 2. Wordmark Extraction (y >= 650)
    text_region = arr[650:800, :]
    th, tw, _ = text_region.shape
    tb = text_region.mean(axis=2)

    # Wordmark smooth alpha
    t_alpha = np.clip((250 - tb) / (250 - 60) * 255, 0, 255).astype(np.uint8)

    # Navy text
    text_navy_rgba = np.zeros((th, tw, 4), dtype=np.uint8)
    text_navy_rgba[:, :, 0] = 17
    text_navy_rgba[:, :, 1] = 39
    text_navy_rgba[:, :, 2] = 66
    text_navy_rgba[:, :, 3] = t_alpha

    # White text for dark mode
    text_white_rgba = np.zeros((th, tw, 4), dtype=np.uint8)
    text_white_rgba[:, :, 0] = 255
    text_white_rgba[:, :, 1] = 255
    text_white_rgba[:, :, 2] = 255
    text_white_rgba[:, :, 3] = t_alpha

    ty, tx = np.where(t_alpha > 0)
    min_ty, max_ty = ty.min(), ty.max()
    min_tx, max_tx = tx.min(), tx.max()

    wordmark_navy = Image.fromarray(text_navy_rgba[min_ty:max_ty+1, min_tx:max_tx+1])
    wordmark_white = Image.fromarray(text_white_rgba[min_ty:max_ty+1, min_tx:max_tx+1])
    print(f"Extracted Wordmark: {wordmark_navy.size}")

    os.makedirs('public', exist_ok=True)
    os.makedirs('public/icons', exist_ok=True)
    os.makedirs('app', exist_ok=True)

    # --- ASSET 1: public/cognalyze-symbol.png (512x512 transparent) ---
    symbol_512 = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    # resize squircle to fit cleanly with nice padding (e.g. 420x420 inside 512x512)
    sq_resized = squircle_crop.resize((420, 413), Image.Resampling.LANCZOS)
    symbol_512.paste(sq_resized, ((512 - 420) // 2, (512 - 413) // 2), sq_resized)
    symbol_512.save('public/cognalyze-symbol.png', 'PNG')
    print("Saved public/cognalyze-symbol.png")

    # --- ASSET 2: public/cognalyze-logo.png (Full stacked logo, 1024x1024 transparent) ---
    logo_stacked = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    # Place squircle at original position
    logo_stacked.paste(squircle_crop, (min_sx, min_sy), squircle_crop)
    # Place wordmark at original position
    logo_stacked.paste(wordmark_navy, (min_tx, min_ty + 650), wordmark_navy)
    logo_stacked.save('public/cognalyze-logo.png', 'PNG')
    print("Saved public/cognalyze-logo.png")

    # --- ASSET 3: public/cognalyze-logo-white.png (Stacked logo with white text for dark mode) ---
    logo_stacked_white = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    logo_stacked_white.paste(squircle_crop, (min_sx, min_sy), squircle_crop)
    logo_stacked_white.paste(wordmark_white, (min_tx, min_ty + 650), wordmark_white)
    logo_stacked_white.save('public/cognalyze-logo-white.png', 'PNG')
    print("Saved public/cognalyze-logo-white.png")

    # --- ASSET 4 & 5: Horizontal Lockups (public/cognalyze-logo-horizontal.png & -white.png) ---
    # Width ~640, Height ~160
    # Left: squircle height 130px. Right: wordmark height ~65px, vertically aligned
    h_h = 160
    sq_h = 130
    sq_w = int(squircle_crop.width * (sq_h / squircle_crop.height))
    sq_scaled = squircle_crop.resize((sq_w, sq_h), Image.Resampling.LANCZOS)

    wm_h = 60
    wm_w = int(wordmark_navy.width * (wm_h / wordmark_navy.height))
    wm_navy_scaled = wordmark_navy.resize((wm_w, wm_h), Image.Resampling.LANCZOS)
    wm_white_scaled = wordmark_white.resize((wm_w, wm_h), Image.Resampling.LANCZOS)

    gap = 28
    pad_x = 24
    total_w = pad_x * 2 + sq_w + gap + wm_w

    horiz_navy = Image.new('RGBA', (total_w, h_h), (0, 0, 0, 0))
    horiz_navy.paste(sq_scaled, (pad_x, (h_h - sq_h) // 2), sq_scaled)
    horiz_navy.paste(wm_navy_scaled, (pad_x + sq_w + gap, (h_h - wm_h) // 2), wm_navy_scaled)
    horiz_navy.save('public/cognalyze-logo-horizontal.png', 'PNG')

    horiz_white = Image.new('RGBA', (total_w, h_h), (0, 0, 0, 0))
    horiz_white.paste(sq_scaled, (pad_x, (h_h - sq_h) // 2), sq_scaled)
    horiz_white.paste(wm_white_scaled, (pad_x + sq_w + gap, (h_h - wm_h) // 2), wm_white_scaled)
    horiz_white.save('public/cognalyze-logo-horizontal-white.png', 'PNG')
    print(f"Saved horizontal logos ({total_w}x{h_h})")

    # --- ASSET 6 & 7: PWA Standard Icons (192x192 & 512x512) ---
    # Standard PWA icon: navy squircle symbol centered on transparent background with standard safe margin
    for size in [192, 512]:
        pwa_icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        # squircle sized to ~80% of canvas
        inner_s = int(size * 0.82)
        inner_sq = squircle_crop.resize((inner_s, int(inner_s * (squircle_crop.height / squircle_crop.width))), Image.Resampling.LANCZOS)
        ox = (size - inner_sq.width) // 2
        oy = (size - inner_sq.height) // 2
        pwa_icon.paste(inner_sq, (ox, oy), inner_sq)
        pwa_icon.save(f'public/icons/icon-{size}x{size}.png', 'PNG')
        print(f"Saved public/icons/icon-{size}x{size}.png")

    # --- ASSET 8 & 9: PWA Maskable Icons (192x192 & 512x512) ---
    # In maskable icons, the background must be full-bleed (brand navy #152c4b).
    # The symbol (white C + cap + gold tassel) must be safely within the 80% safe zone circle (40% radius from center).
    for size in [192, 512]:
        maskable = Image.new('RGBA', (size, size), (21, 44, 76, 255))
        # Inside the safe zone (80% diameter = 409px in 512x512):
        # We can place the squircle symbol or symbol with gentle rounded corner that extends gracefully into the navy background
        inner_s = int(size * 0.72)
        inner_sq = squircle_crop.resize((inner_s, int(inner_s * (squircle_crop.height / squircle_crop.width))), Image.Resampling.LANCZOS)
        ox = (size - inner_sq.width) // 2
        oy = (size - inner_sq.height) // 2
        maskable.paste(inner_sq, (ox, oy), inner_sq)
        maskable.save(f'public/icons/icon-maskable-{size}x{size}.png', 'PNG')
        print(f"Saved public/icons/icon-maskable-{size}x{size}.png")

    # --- ASSET 10: Apple Touch Icon (180x180) ---
    # iOS apple-touch-icon requires solid background (no transparency). Brand navy #152c4b with centered symbol.
    apple_icon = Image.new('RGBA', (180, 180), (21, 44, 76, 255))
    apple_s = 146
    apple_sq = squircle_crop.resize((apple_s, int(apple_s * (squircle_crop.height / squircle_crop.width))), Image.Resampling.LANCZOS)
    apple_icon.paste(apple_sq, ((180 - apple_sq.width) // 2, (180 - apple_sq.height) // 2), apple_sq)
    # Convert to RGB because Apple Touch icons ignore or glitch with alpha channels
    apple_icon_rgb = apple_icon.convert('RGB')
    apple_icon_rgb.save('public/icons/apple-touch-icon.png', 'PNG')
    apple_icon_rgb.save('public/apple-touch-icon.png', 'PNG')
    print("Saved Apple touch icons (180x180)")

    # --- ASSET 11: Multi-Resolution Favicon (app/favicon.ico & public/favicon.ico) ---
    # Standard sizes: 16, 32, 48, 64, 128, 256
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    # Use symbol_512
    symbol_512.save('app/favicon.ico', format='ICO', sizes=ico_sizes)
    symbol_512.save('public/favicon.ico', format='ICO', sizes=ico_sizes)
    print("Saved app/favicon.ico and public/favicon.ico")

    # --- ASSET 12: Open Graph Image (1200x630) ---
    # Modern premium brand card:
    # Deep navy gradient background, centered squircle symbol, bold COGNALYZE brand wordmark in white/gold,
    # and subtitle: "Evidence-First Career & Hiring Intelligence"
    og_img = Image.new('RGBA', (1200, 630), (11, 25, 44, 255))
    # Paste squircle symbol
    og_sq_size = 240
    og_sq = squircle_crop.resize((og_sq_size, int(og_sq_size * (squircle_crop.height / squircle_crop.width))), Image.Resampling.LANCZOS)
    og_img.paste(og_sq, ((1200 - og_sq.width) // 2, 100), og_sq)

    # Paste white wordmark
    og_wm_h = 75
    og_wm_w = int(wordmark_white.width * (og_wm_h / wordmark_white.height))
    og_wm = wordmark_white.resize((og_wm_w, og_wm_h), Image.Resampling.LANCZOS)
    og_img.paste(og_wm, ((1200 - og_wm_w) // 2, 375), og_wm)
    
    og_img.convert('RGB').save('public/og-image.png', 'PNG')
    print("Saved public/og-image.png (1200x630)")

    print("Brand asset generation completed successfully!")

if __name__ == '__main__':
    main()
