import re
from typing import List, Dict, Any, Optional

class FieldParser:
    @staticmethod
    def extract_fields(ocr_blocks: List[Dict[str, Any]], full_text: str) -> Dict[str, Dict[str, Any]]:
        extracted = {}

        # 1. Maximum Retail Price (MRP)
        mrp_match = re.search(
            r'(?i)(?:m\.?r\.?p\.?|max(?:imum)?\s*retail\s*price|incl\.?\s*of\s*all\s*taxes|rs\.?|₹)\s*[:\-\s]?\s*(?:rs\.?|₹)?\s*([0-9]+(?:\.[0-9]{1,2})?)',
            full_text
        )
        if mrp_match:
            extracted["MRP"] = {
                "value": mrp_match.group(0).strip(),
                "confidence": 0.95,
                "bounding_box": FieldParser._find_bounding_box(ocr_blocks, mrp_match.group(1))
            }

        # 2. Net Quantity / Weight / Units
        qty_match = re.search(
            r'(?i)(?:net\s*(?:wt\.?|weight|qty\.?|quantity|content|volume)?)\s*[:\-\s]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|gm|gms|mg|l|ltr|liter|litres|ml|m|cm|mm|n|units|u|pieces|pcs|count))\b',
            full_text
        )
        if not qty_match:
            qty_match = re.search(
                r'\b([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|gm|gms|mg|l|ltr|ml|n|units|pcs))\b',
                full_text,
                re.IGNORECASE
            )
        if qty_match:
            extracted["NET_QUANTITY"] = {
                "value": qty_match.group(0).strip(),
                "confidence": 0.92,
                "bounding_box": FieldParser._find_bounding_box(ocr_blocks, qty_match.group(1))
            }

        # 3. Date of Manufacture / Packing / Import
        date_match = re.search(
            r'(?i)(?:mfg|mfd|pkd|packed|pkg|manufactured|imported|use\s*by|exp\.?)\s*(?:date)?\s*[:\-\s]?\s*([0-9]{1,2}[\/\-\.\s](?:[0-9]{1,2}|[A-Za-z]{3,4})[\/\-\.\s][0-9]{2,4}|[0-9]{1,2}[\/\-\.][0-9]{2,4})',
            full_text
        )
        if date_match:
            extracted["MANUFACTURE_DATE"] = {
                "value": date_match.group(0).strip(),
                "confidence": 0.90,
                "bounding_box": FieldParser._find_bounding_box(ocr_blocks, date_match.group(1))
            }

        # 4. Manufacturer / Packer Details
        mfg_name_match = re.search(
            r'(?i)(?:mfd\.?\s*by|mfg\.?\s*by|manufactured\s*(?:and\s*packed)?\s*by|marketed\s*by|packed\s*by)\s*[:\-\s]?\s*([A-Za-z0-9\s,\.\(\)\&\-]+?(?:ltd|limited|pvt|inc|corp|co\.|industries|foods|enterprises))',
            full_text
        )
        if mfg_name_match:
            extracted["MANUFACTURER_NAME"] = {
                "value": mfg_name_match.group(0).strip(),
                "confidence": 0.88,
                "bounding_box": FieldParser._find_bounding_box(ocr_blocks, mfg_name_match.group(1)[:15])
            }

        # 5. Consumer Care Details
        care_match = re.search(
            r'(?i)(?:consumer\s*care|customer\s*(?:care|support)|helpdesk|feedback|toll\s*free|care\s*executive)\s*[:\-\s]?\s*([A-Za-z0-9\s@\.\:\-\+\(\)]+)',
            full_text
        )
        if care_match:
            extracted["CONSUMER_CARE_CONTACT"] = {
                "value": care_match.group(0)[:120].strip(),
                "confidence": 0.85,
                "bounding_box": FieldParser._find_bounding_box(ocr_blocks, "care")
            }

        # 6. Country of Origin
        coo_match = re.search(
            r'(?i)(?:country\s*of\s*origin|made\s*in|mfd\s*in|product\s*of)\s*[:\-\s]?\s*([A-Za-z]+)',
            full_text
        )
        if coo_match:
            extracted["COUNTRY_OF_ORIGIN"] = {
                "value": coo_match.group(0).strip(),
                "confidence": 0.94,
                "bounding_box": FieldParser._find_bounding_box(ocr_blocks, coo_match.group(1))
            }

        # 7. Generic Commodity Name
        extracted["COMMODITY_NAME"] = {
            "value": full_text[:40].strip() if full_text else "Packaged Commodity",
            "confidence": 0.70,
            "bounding_box": ocr_blocks[0]["bounding_box"] if ocr_blocks else None
        }

        return extracted

    @staticmethod
    def _find_bounding_box(ocr_blocks: List[Dict[str, Any]], target_subtext: str) -> Optional[Dict[str, Any]]:
        target_subtext_clean = target_subtext.strip().lower()
        for block in ocr_blocks:
            if target_subtext_clean in block["text"].lower():
                return block["bounding_box"]
        return None