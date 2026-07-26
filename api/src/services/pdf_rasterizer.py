"""Rasterize selected PDF pages into compact JPEGs using pypdfium2.
Usage: python pdf_rasterizer.py <pdf_path> <output_dir> [max_pages] [max_edge] [quality]
"""
import sys
import os
import json


def rasterize_pdf(pdf_path: str, output_dir: str, max_pages: int = 3, max_edge: int = 1500, quality: int = 78):
    try:
        import pypdfium2 as pdfium
        from PIL import Image

        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"File not found: {pdf_path}")

        os.makedirs(output_dir, exist_ok=True)
        pdf = pdfium.PdfDocument(pdf_path)
        total_pages = len(pdf)
        pages_to_render = min(total_pages, max_pages)
        image_paths = []

        # Render close to the final target rather than producing a huge bitmap first.
        render_scale = max(1.25, min(2.0, max_edge / 1000.0))
        for i in range(pages_to_render):
            page = pdf[i]
            pil_image = page.render(scale=render_scale).to_pil()
            width, height = pil_image.size
            current_max = max(width, height)
            if current_max > max_edge:
                ratio = max_edge / float(current_max)
                pil_image = pil_image.resize(
                    (max(1, int(width * ratio)), max(1, int(height * ratio))),
                    Image.Resampling.LANCZOS,
                )
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')

            out_path = os.path.join(output_dir, f"page_{i + 1}_{os.path.basename(pdf_path)}.jpg")
            pil_image.save(out_path, 'JPEG', quality=quality, optimize=True)
            image_paths.append(out_path)

        print(json.dumps({"success": True, "pages": image_paths, "totalPages": total_pages}))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: pdf_rasterizer.py <pdf_path> <output_dir> [max_pages] [max_edge] [quality]"}))
        sys.exit(1)
    rasterize_pdf(
        sys.argv[1],
        sys.argv[2],
        int(sys.argv[3]) if len(sys.argv) > 3 else 3,
        int(sys.argv[4]) if len(sys.argv) > 4 else 1500,
        int(sys.argv[5]) if len(sys.argv) > 5 else 78,
    )
