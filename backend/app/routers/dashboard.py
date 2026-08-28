from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError

from ..database import supabase

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/overview")
def get_dashboard_overview():
    try:
        inspections_result = (
            supabase
            .table("inspections")
            .select("*")
            .execute()
        )

        inspections = inspections_result.data or []

        total_inspections = len(inspections)

        completed = sum(
            1
            for item in inspections
            if item.get("status") == "completed"
        )

        draft = sum(
            1
            for item in inspections
            if item.get("status") == "draft"
        )

        processing = sum(
            1
            for item in inspections
            if item.get("status") == "processing"
        )

        failed = sum(
            1
            for item in inspections
            if item.get("status") == "failed"
        )

        review_required = sum(
            1
            for item in inspections
            if item.get("compliance_status")
            == "review_required"
        )

        compliant = sum(
            1
            for item in inspections
            if item.get("compliance_status")
            == "compliant"
        )

        non_compliant = sum(
            1
            for item in inspections
            if item.get("compliance_status")
            == "non_compliant"
        )

        scores = [
            float(item["compliance_score"])
            for item in inspections
            if item.get("compliance_score") is not None
        ]

        average_score = (
            round(sum(scores) / len(scores), 2)
            if scores
            else 0
        )

        violations_result = (
            supabase
            .table("violations")
            .select("*")
            .execute()
        )

        violations = violations_result.data or []

        total_violations = len(violations)

        unresolved_violations = sum(
            1
            for item in violations
            if item.get("is_resolved") is not True
        )

        resolved_violations = sum(
            1
            for item in violations
            if item.get("is_resolved") is True
        )

        products_result = (
            supabase
            .table("products")
            .select("id")
            .execute()
        )

        products = products_result.data or []

        images_result = (
            supabase
            .table("inspection_images")
            .select("id")
            .execute()
        )

        images = images_result.data or []

        return {
            "success": True,
            "data": {
                "inspections": {
                    "total": total_inspections,
                    "completed": completed,
                    "draft": draft,
                    "processing": processing,
                    "failed": failed,
                },
                "compliance": {
                    "compliant": compliant,
                    "non_compliant": non_compliant,
                    "review_required": review_required,
                    "average_score": average_score,
                },
                "violations": {
                    "total": total_violations,
                    "resolved": resolved_violations,
                    "unresolved": unresolved_violations,
                },
                "products": {
                    "total": len(products),
                },
                "evidence": {
                    "total_images": len(images),
                },
            },
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load dashboard overview: "
                f"{exc}"
            ),
        )


@router.get("/recent-inspections")
def get_recent_inspections(
    limit: int = 10,
):
    try:
        limit = max(limit, 1)
        limit = min(limit, 100)

        result = (
            supabase
            .table("inspections")
            .select("*")
            .order(
                "created_at",
                desc=True,
            )
            .limit(limit)
            .execute()
        )

        return {
            "success": True,
            "count": len(result.data or []),
            "data": result.data or [],
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load recent inspections: "
                f"{exc}"
            ),
        )


@router.get("/violations")
def get_dashboard_violations(
    limit: int = 10,
):
    try:
        limit = max(limit, 1)
        limit = min(limit, 100)
        result = (
            supabase
            .table("violations")
            .select("*")
            .order(
                "created_at",
                desc=True,
            )
            .limit(limit)
            .execute()
        )

        return {
            "success": True,
            "count": len(result.data or []),
            "data": result.data or [],
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load dashboard violations: "
                f"{exc}"
            ),
        )


@router.get("/compliance-distribution")
def get_compliance_distribution():
    try:
        result = (
            supabase
            .table("compliance_results")
            .select("status")
            .execute()
        )

        results = result.data or []

        distribution = {
            "pass": 0,
            "fail": 0,
            "needs_review": 0,
            "unknown": 0,
            "not_applicable": 0,
        }

        for item in results:
            status = item.get("status")

            if status in distribution:
                distribution[status] += 1

        return {
            "success": True,
            "data": distribution,
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load compliance distribution: "
                f"{exc}"
            ),
        )