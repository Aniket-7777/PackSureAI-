from typing import Any

from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError

from ..database import supabase

router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


@router.get("/")
def get_users() -> dict[str, Any]:
    try:
        profiles = (
            supabase
            .table("profiles")
            .select("*")
            .execute()
        )

        users = profiles.data or []

        return {
            "success": True,
            "count": len(users),
            "data": users,
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load users: {exc!s}",
        ) from exc


@router.get("/{user_id}")
def get_user(user_id: str) -> dict[str, Any]:
    try:
        result = (
            supabase
            .table("profiles")
            .select("*")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        permissions = (
            supabase
            .table("user_permissions")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )

        return {
            "success": True,
            "data": {
                "profile": result.data[0],
                "permissions": permissions.data or [],
            },
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load user: {exc!s}",
        ) from exc


@router.get("/{user_id}/permissions")
def get_user_permissions(
    user_id: str,
) -> dict[str, Any]:
    try:
        result = (
            supabase
            .table("user_permissions")
            .select("*")
            .eq("user_id", user_id)
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
            detail=f"Failed to load permissions: {exc!s}",
        ) from exc