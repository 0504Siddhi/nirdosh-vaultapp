"""
paddle_server.py — Persistent PaddleOCR server.

Reads JSON lines from stdin, each containing: {"path": "<image_path>"}
Writes JSON lines to stdout:          {"confidence": 0.91, "text": "..."}
Writes errors to stderr.

The OCR engine is loaded ONCE at startup so subsequent requests are fast.
"""
import sys
import json
import logging
import os

os.environ["FLAGS_enable_pir_api"] = "0"

# Suppress PaddleOCR's verbose init output on stderr
logging.getLogger("ppocr").setLevel(logging.ERROR)
logging.getLogger("paddle").setLevel(logging.ERROR)

def load_ocr():
    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(use_textline_orientation=True, lang='en', enable_mkldnn=False)
        # Signal to Node.js that warm-up is complete
        print(json.dumps({"status": "ready"}), flush=True)
        return ocr
    except Exception as e:
        print(json.dumps({"status": "unavailable", "error": str(e)}), flush=True)
        return None


def run_ocr(ocr, image_path: str) -> dict:
    result = ocr.ocr(image_path)
    extracted_text = []
    overall_confidence = 0.0
    total_items = 0

    if result and len(result) > 0 and result[0] is not None:
        # Newer dictionary format (PaddleX)
        if isinstance(result[0], dict) and 'rec_texts' in result[0]:
            texts = result[0]['rec_texts']
            scores = result[0]['rec_scores']
            for text, conf in zip(texts, scores):
                if text and str(text).strip():
                    extracted_text.append(str(text))
                    overall_confidence += float(conf)
                    total_items += 1
        # Older list-of-lists format
        elif isinstance(result[0], list):
            for line in result[0]:
                if len(line) > 1 and len(line[1]) > 1:
                    text = line[1][0]
                    conf = line[1][1]
                    if text and str(text).strip():
                        extracted_text.append(str(text))
                        overall_confidence += float(conf)
                        total_items += 1

    avg_conf = overall_confidence / total_items if total_items > 0 else 0.0
    text_joined = ' '.join(extracted_text).replace('\n', ' ').replace('\r', '')
    return {"confidence": avg_conf, "text": text_joined}


def main():
    ocr = load_ocr()
    if ocr is None:
        # No PaddleOCR available — keep process alive but return errors
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                req = json.loads(line)
                if req.get("ping"):
                    print(json.dumps({"pong": True}), flush=True)
                else:
                    print(json.dumps({"error": "PaddleOCR not available"}), flush=True)
            except Exception as e:
                print(json.dumps({"error": str(e)}), flush=True)
        return

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            if req.get("ping"):
                print(json.dumps({"pong": True}), flush=True)
                continue
            image_path = req.get("path", "")
            if not image_path:
                print(json.dumps({"error": "Missing 'path' field"}), flush=True)
                continue
            result = run_ocr(ocr, image_path)
            print(json.dumps(result), flush=True)
        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)


if __name__ == "__main__":
    main()
