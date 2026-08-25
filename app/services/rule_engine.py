import re
from typing import List, Dict, Any

class ComplianceEngine:
    @staticmethod
    def evaluate(
        rules: List[Any], 
        extracted_fields: Dict[str, Dict[str, Any]],
        category: str = "FOOD"
    ) -> Dict[str, Any]:
        evaluations = []
        violations = []
        overall_status = "PASS"

        for rule in rules:
            # 1. Check category applicability
            if rule.applicable_category != 'ALL' and rule.applicable_category != category:
                evaluations.append({
                    "rule_id": rule.rule_id,
                    "rule_code": rule.rule_code,
                    "status": "NOT_APPLICABLE",
                    "details": f"Exempt for commodity category {category}"
                })
                continue

            mandatory_key = rule.mandatory_field
            is_present = mandatory_key in extracted_fields and bool(extracted_fields[mandatory_key]["value"])

            # 2. Check presence of mandatory field
            if not is_present:
                overall_status = "FAIL"
                evaluations.append({
                    "rule_id": rule.rule_id,
                    "rule_code": rule.rule_code,
                    "status": "FAIL",
                    "details": f"Mandatory declaration '{mandatory_key}' is missing on the package."
                })
                violations.append({
                    "rule_id": rule.rule_id,
                    "rule_code": rule.rule_code,
                    "severity": "CRITICAL" if mandatory_key in ["MRP", "NET_QUANTITY", "MANUFACTURER_NAME"] else "MAJOR",
                    "detected_value": None,
                    "expected_format": f"Mandatory {mandatory_key} declaration under {rule.rule_code}",
                    "explanation": f"Missing statutory declaration under Legal Metrology Rules, 2011."
                })
                continue

            # 3. Check regex formatting standard (if defined)
            field_data = extracted_fields[mandatory_key]
            field_val = field_data["value"]

            if rule.validation_regex:
                regex_match = re.search(rule.validation_regex, field_val, re.IGNORECASE)
                if not regex_match:
                    overall_status = "FAIL"
                    evaluations.append({
                        "rule_id": rule.rule_id,
                        "rule_code": rule.rule_code,
                        "status": "FAIL",
                        "details": f"Field '{mandatory_key}' value ('{field_val}') violates standard units or format."
                    })
                    violations.append({
                        "rule_id": rule.rule_id,
                        "rule_code": rule.rule_code,
                        "severity": "MAJOR",
                        "detected_value": field_val,
                        "expected_format": rule.validation_regex,
                        "explanation": f"Invalid unit or formatting under {rule.rule_code}."
                    })
                    continue

            # 4. Field is compliant
            evaluations.append({
                "rule_id": rule.rule_id,
                "rule_code": rule.rule_code,
                "status": "PASS",
                "details": f"Declaration '{mandatory_key}' complies with statutory norms."
            })

        return {
            "overall_status": overall_status,
            "evaluations": evaluations,
            "violations": violations
        }