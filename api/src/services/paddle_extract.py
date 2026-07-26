import sys
import logging
import os
os.environ["FLAGS_enable_pir_api"] = "0"
from paddleocr import PaddleOCR

# Suppress debug/info logs from PaddleOCR which can clutter stdout
logging.getLogger("ppocr").setLevel(logging.WARNING)

def extract_text(image_path):
    try:
        # use_textline_orientation=True to automatically rotate the text
        # lang='en' for English
        ocr = PaddleOCR(use_textline_orientation=True, lang='en', enable_mkldnn=False)
        
        result = ocr.ocr(image_path)
        
        extracted_text = []
        overall_confidence = 0
        total_items = 0
        
        if result and len(result) > 0 and result[0] is not None:
            # Check if it's the newer dictionary format (PaddleX)
            if isinstance(result[0], dict) and 'rec_texts' in result[0]:
                texts = result[0]['rec_texts']
                scores = result[0]['rec_scores']
                for text, conf in zip(texts, scores):
                    if text and str(text).strip():
                        extracted_text.append(str(text))
                        overall_confidence += float(conf)
                        total_items += 1
            # Fallback to the older list of lists format
            elif isinstance(result[0], list):
                for line in result[0]:
                    if len(line) > 1 and len(line[1]) > 1:
                        text = line[1][0]
                        conf = line[1][1]
                        if text and str(text).strip():
                            extracted_text.append(str(text))
                            overall_confidence += float(conf)
                            total_items += 1
                
        # Calculate average confidence
        avg_conf = overall_confidence / total_items if total_items > 0 else 0
        
        # Print a structured string for Node.js to parse easily
        # format: CONFIDENCE:::TEXT
        # We replace newlines with spaces so it prints on one line
        text_joined = ' '.join(extracted_text).replace('\n', ' ').replace('\r', '')
        print(f"{avg_conf}:::{text_joined}")
    except Exception as e:
        print(f"0.0:::ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python paddle_extract.py <image_path>", file=sys.stderr)
        sys.exit(1)
        
    image_path = sys.argv[1]
    extract_text(image_path)
