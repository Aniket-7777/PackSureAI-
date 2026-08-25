import easyocr
import numpy as np
import time
from typing import Dict, Any

class OCREngine:
    def __init__(self):
        # Initialize EasyOCR reader for English running on CPU
        self.reader = easyocr.Reader(['en'], gpu=False)

    def extract_text_and_boxes(self, image_np: np.ndarray) -> Dict[str, Any]:
        """
        Detects and extracts text with bounding boxes.
        """
        start_time = time.time()
        raw_results = self.reader.readtext(image_np)

        full_text_list = []
        parsed_blocks = []

        for bbox, text, conf in raw_results:
            full_text_list.append(text)
            
            box_coords = {
                "top_left": [int(bbox[0][0]), int(bbox[0][1])],
                "top_right": [int(bbox[1][0]), int(bbox[1][1])],
                "bottom_right": [int(bbox[2][0]), int(bbox[2][1])],
                "bottom_left": [int(bbox[3][0]), int(bbox[3][1])]
            }

            parsed_blocks.append({
                "text": text,
                "confidence": round(float(conf), 4),
                "bounding_box": box_coords
            })

        duration_ms = int((time.time() - start_time) * 1000)

        return {
            "full_text": " ".join(full_text_list),
            "parsed_blocks": parsed_blocks,
            "processing_time_ms": duration_ms
        }

ocr_service = OCREngine()