from PIL import Image
from pathlib import Path
import sys

def remove_white_background(image_path, output_path, threshold=240):
    print(f"Processing {image_path}...")
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        new_data = []
        for item in datas:
            # item is (R, G, B, A)
            # Check if pixel is close to white
            if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                # Make it transparent
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)

        img.putdata(new_data)
        img.save(output_path, "PNG")
        print(f"Successfully removed background and saved to {output_path}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # backend/scripts/remove_bg.py -> parents[2] = root
    repo_root = Path(__file__).resolve().parents[2]
    target_file = repo_root / "desktop-shell" / "assets" / "starfield_icon.png"
    
    if not target_file.exists():
        print(f"File not found: {target_file}")
        sys.exit(1)
        
    remove_white_background(target_file, target_file)
