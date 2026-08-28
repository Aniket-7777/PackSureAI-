from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def safe_value(value: Any) -> str:
    if value is None:
        return "-"

    return str(value)


def build_compliance_pdf(
    report: dict[str, Any]
) -> BytesIO:

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15 * mm,
        leftMargin=15 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        
        fontSize=18,
        spaceAfter=12,
    )

    heading_style = ParagraphStyle(
        "ReportHeading",
        parent=styles["Heading2"],
        fontSize=13,
        spaceBefore=10,
        spaceAfter=7,
    )

    normal_style = ParagraphStyle(
        "ReportNormal",
        parent=styles["BodyText"],
        fontSize=9,
        leading=12,
    )

    small_style = ParagraphStyle(
        "ReportSmall",
        parent=styles["BodyText"],
        fontSize=7,
        leading=9,
    )

    story: list[Any] = []

    # ==================================================
    # TITLE
    # ==================================================

    story.append(
        Paragraph(
            "PACKSUREAI",
            title_style
        )
    )

    story.append(
        Paragraph(
            "Packaged Commodity Compliance Inspection Report",
            ParagraphStyle(
                "Subtitle",
                parent=normal_style,
                
                fontSize=11,
            )
        )
    )

    story.append(
        Spacer(1, 8)
    )

    inspection = (
        report.get("inspection")
        or {}
    )

    product = (
        report.get("product")
        or {}
    )

    summary = (
        report.get("summary")
        or {}
    )

    # ==================================================
    # INSPECTION INFORMATION
    # ==================================================

    story.append(
        Paragraph(
            "Inspection Information",
            heading_style
        )
    )

    inspection_data = [
        [
            "Inspection Number",
            safe_value(
                inspection.get(
                    "inspection_number"
                )
            ),
        ],
        [
            "Inspection ID",
            safe_value(
                inspection.get("id")
            ),
        ],
        [
            "Barcode",
            safe_value(
                inspection.get("barcode")
            ),
        ],
        [
            "Status",
            safe_value(
                inspection.get("status")
            ),
        ],
        [
            "Compliance Status",
            safe_value(
                inspection.get(
                    "compliance_status"
                )
            ),
        ],
        [
            "Compliance Score",
            safe_value(
                inspection.get(
                    "compliance_score"
                )
            ),
        ],
        [
            "Created At",
            safe_value(
                inspection.get(
                    "created_at"
                )
            ),
        ],
        [
            "Completed At",
            safe_value(
                inspection.get(
                    "completed_at"
                )
            ),
        ],
    ]

    inspection_table = Table(
        inspection_data,
        colWidths=[
            55 * mm,
            120 * mm,
        ],
    )

    inspection_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.lightgrey,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (0, -1),
                    "Helvetica-Bold",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "PADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
            ]
        )
    )

    story.append(
        inspection_table
    )

    # ==================================================
    # PRODUCT INFORMATION
    # ==================================================

    story.append(
        Paragraph(
            "Product Information",
            heading_style
        )
    )

    product_data = [
        [
            "Product Name",
            safe_value(
                product.get(
                    "product_name"
                )
            ),
        ],
        [
            "Brand",
            safe_value(
                product.get(
                    "brand_name"
                )
            ),
        ],
        [
            "Category",
            safe_value(
                product.get(
                    "category"
                )
            ),
        ],
        [
            "Manufacturer",
            safe_value(
                product.get(
                    "manufacturer_name"
                )
            ),
        ],
        [
            "Packer",
            safe_value(
                product.get(
                    "packer_name"
                )
            ),
        ],
        [
            "Importer",
            safe_value(
                product.get(
                    "importer_name"
                )
            ),
        ],
        [
            "Net Quantity",
            safe_value(
                product.get(
                    "net_quantity"
                )
            ),
        ],
        [
            "Unit",
            safe_value(
                product.get(
                    "unit"
                )
            ),
        ],
        [
            "MRP",
            safe_value(
                product.get(
                    "mrp"
                )
            ),
        ],
        [
            "Batch Number",
            safe_value(
                product.get(
                    "batch_number"
                )
            ),
        ],
    ]

    product_table = Table(
        product_data,
        colWidths=[
            55 * mm,
            120 * mm,
        ],
    )

    product_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.lightgrey,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (0, -1),
                    "Helvetica-Bold",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "PADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
            ]
        )
    )

    story.append(
        product_table
    )

    # ==================================================
    # COMPLIANCE SUMMARY
    # ==================================================

    story.append(
        Paragraph(
            "Compliance Summary",
            heading_style
        )
    )

    summary_data = [
        [
            "Metric",
            "Value",
        ],
        [
            "Total Rules",
            safe_value(
                summary.get(
                    "total_rules"
                )
            ),
        ],
        [
            "Passed Rules",
            safe_value(
                summary.get(
                    "passed_rules"
                )
            ),
        ],
        [
            "Failed Rules",
            safe_value(
                summary.get(
                    "failed_rules"
                )
            ),
        ],
        [
            "Needs Review",
            safe_value(
                summary.get(
                    "needs_review"
                )
            ),
        ],
        [
            "Total Violations",
            safe_value(
                summary.get(
                    "total_violations"
                )
            ),
        ],
        [
            "Resolved Violations",
            safe_value(
                summary.get(
                    "resolved_violations"
                )
            ),
        ],
        [
            "Unresolved Violations",
            safe_value(
                summary.get(
                    "unresolved_violations"
                )
            ),
        ],
    ]

    summary_table = Table(
        summary_data,
        colWidths=[
            110 * mm,
            65 * mm,
        ],
    )

    summary_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.grey,
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "PADDING",
                    (0, 0),
                    (-1, -1),
                    5,
                ),
            ]
        )
    )

    story.append(
        summary_table
    )

    # ==================================================
    # COMPLIANCE RESULTS
    # ==================================================

    story.append(
        Paragraph(
            "Rule Evaluation Results",
            heading_style
        )
    )

    compliance = (
        report.get("compliance")
        or {}
    )

    results = (
        compliance.get("results")
        or []
    )

    compliance_data = [
        [
            "Rule",
            "Status",
            "Score",
            "Actual Value",
            "Expected Value",
        ]
    ]

    for result in results:

        compliance_data.append(
            [
                safe_value(
                    result.get(
                        "rule_id"
                    )
                ),
                safe_value(
                    result.get(
                        "status"
                    )
                ),
                safe_value(
                    result.get(
                        "score"
                    )
                ),
                safe_value(
                    result.get(
                        "actual_value"
                    )
                ),
                safe_value(
                    result.get(
                        "expected_value"
                    )
                ),
            ]
        )

    if len(compliance_data) > 1:

        compliance_table = Table(
            compliance_data,
            colWidths=[
                32 * mm,
                25 * mm,
                18 * mm,
                45 * mm,
                55 * mm,
                ],
                repeatRows=1,
            )

        compliance_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.grey,
                    ),
                    (
                        "TEXTCOLOR",
                        (0, 0),
                        (-1, 0),
                        colors.white,
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.4,
                        colors.grey,
                    ),
                    (
                        "FONTSIZE",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "PADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                ]
            )
        )

        story.append(
            compliance_table
        )

    else:

        story.append(
            Paragraph(
                "No compliance results available.",
                normal_style
            )
        )

    # ==================================================
    # VIOLATIONS
    # ==================================================

    story.append(
        Paragraph(
            "Violations",
            heading_style
        )
    )

    violations = (
        report.get("violations")
        or []
    )

    if violations:

        violation_data = [
            [
                "Code",
                "Title",
                "Severity",
                "Detected",
                "Expected",
                "Resolved",
            ]
        ]

        for violation in violations:

            violation_data.append(
                [
                    safe_value(
                        violation.get(
                            "violation_code"
                        )
                    ),
                    safe_value(
                        violation.get(
                            "violation_title"
                        )
                    ),
                    safe_value(
                        violation.get(
                            "severity"
                        )
                    ),
                    safe_value(
                        violation.get(
                            "detected_value"
                        )
                    ),
                    safe_value(
                        violation.get(
                            "expected_value"
                        )
                    ),
                    (
                        "Yes"
                        if violation.get(
                            "is_resolved"
                        )
                        else "No"
                    ),
                ]
            )

        violation_table = Table(
            violation_data,
            colWidths=[
                25 * mm,
                35 * mm,
                22 * mm,
                30 * mm,
                38 * mm,
                20 * mm,
            ],
            repeatRows=1,
        )

        violation_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.grey,
                    ),
                    (
                        "TEXTCOLOR",
                        (0, 0),
                        (-1, 0),
                        colors.white,
                    ),
                    (
                        "GRID",
                        (0, 0),
                        (-1, -1),
                        0.4,
                        colors.grey,
                    ),
                    (
                        "FONTSIZE",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "PADDING",
                        (0, 0),
                        (-1, -1),
                        3,
                    ),
                ]
            )
        )

        story.append(
            violation_table
        )

    else:

        story.append(
            Paragraph(
                "No violations detected.",
                normal_style
            )
        )

    story.append(
        Spacer(1, 15)
    )

    story.append(
        Paragraph(
            "Generated by PacksureAI",
            small_style
        )
    )

    document.build(
        story
    )

    buffer.seek(0)

    return buffer