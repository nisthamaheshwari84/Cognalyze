import os
from PIL import Image
import numpy as np

src_path = '/Users/nisthamaheshwari/.gemini/antigravity-ide/brain/171f7ec4-bd51-4435-9bed-a81727dbbfa8/.user_uploaded/media_1792176852087.jpg'

if not os.path.exists(src_path):
    raise FileNotFoundError(f"Source file not found: {src_path}")

# Load the exact original image in RGB mode
orig = Image.open(src_path).convert('RGB')
w, h = orig.size
print(f"Loaded original image: {w}x{h}")

# 1. Full Official Logo (100% exact pixels from user image, saved as lossless PNG)
orig.save('public/cognalyze-logo.png', 'PNG', optimize=True)
print("Saved public/cognalyze-logo.png (exact original)")

# 2. Standalone Symbol: crop the squircle directly from original image
# Bounding box of squircle: x in [301, 725], y in [205, 622]
squircle_crop = orig.crop((301, 205, 725, 622))
squircle_crop.save('public/cognalyze-symbol.png', 'PNG', optimize=True)
print(f"Saved public/cognalyze-symbol.png: size {squircle_crop.size} (exact untouched colors)")

# 3. Horizontal Lockup: squircle + COGNALYZE on white background
# Wordmark bounding box: x in [112, 913], y in [672, 776]
wordmark_crop = orig.crop((112, 672, 913, 776))

# Construct horizontal layout using the exact untouched crops
sq_h = 120
sq_w = int(squircle_crop.width * (sq_h / squircle_crop.height))
sq_scaled = squircle_crop.resize((sq_w, sq_h), Image.Resampling.LANCZOS)

wm_h = 58
wm_w = int(wordmark_crop.width * (wm_h / wordmark_crop.height))
wm_scaled = wordmark_crop.resize((wm_w, wm_h), Image.Resampling.LANCZOS)

gap = 24
pad_x = 16
pad_y = 10
total_w = pad_x * 2 + sq_w + gap + wm_w
total_h = sq_h + pad_y * 2

horiz = Image.new('RGB', (total_w, total_h), (255, 255, 255))
horiz.paste(sq_scaled, (pad_x, pad_y))
horiz.paste(wm_scaled, (pad_x + sq_w + gap, pad_y + (sq_h - wm_h) // 2))
horiz.save('public/cognalyze-logo-horizontal.png', 'PNG', optimize=True)
print(f"Saved public/cognalyze-logo-horizontal.png: size {horiz.size}")

# 4. Standard PWA Icons (192x192, 512x512) directly from exact squircle
for s in [192, 512]:
    icon = squircle_crop.resize((s, s), Image.Resampling.LANCZOS)
    icon.save(f'public/icons/icon-{s}x{s}.png', 'PNG', optimize=True)
    icon.save(f'public/icons/icon-maskable-{s}x{s}.png', 'PNG', optimize=True)
    print(f"Saved public/icons/icon-{s}x{s}.png")

# 5. Apple Touch Icons (180x180)
apple = squircle_crop.resize((180, 180), Image.Resampling.LANCZOS)
apple.save('public/icons/apple-touch-icon.png', 'PNG', optimize=True)
apple.save('public/apple-touch-icon.png', 'PNG', optimize=True)
print("Saved Apple touch icons (180x180)")

# 6. Multi-resolution Favicons
fav_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
squircle_crop.save('public/favicon.ico', format='ICO', sizes=fav_sizes)
squircle_crop.save('app/favicon.ico', format='ICO', sizes=fav_sizes)
print("Saved favicon.ico")

# Remove any white-text / modified files
for dead_file in [
    'public/cognalyze-logo-white.png',
    'public/cognalyze-logo-horizontal-white.png',
]:
    if os.path.exists(dead_file):
        os.remove(dead_file)
        print(f"Removed modified variant: {dead_file}")

print("Exact brand asset generation completed successfully!")
