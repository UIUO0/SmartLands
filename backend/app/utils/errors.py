# app/utils/errors.py
"""
Centralized error handling utilities for consistent logging and error responses
"""
import logging
from functools import wraps
from typing import Callable, Any
from fastapi import HTTPException, status


def handle_errors(logger: logging.Logger, operation_name: str):
    """
    Decorator for consistent error handling in route handlers
    
    Usage:
        @router.get("/something")
        @handle_errors(logger, "GET_SOMETHING")
        async def get_something(...):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            try:
                return await func(*args, **kwargs)
            except HTTPException:
                # Re-raise HTTP exceptions as-is
                raise
            except Exception as exc:
                logger.error(
                    "%s_ERROR: %s",
                    operation_name,
                    exc,
                    exc_info=True
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"{operation_name.lower().replace('_', ' ')} failed"
                )
        return wrapper
    return decorator


class ErrorMessages:
    """Centralized error messages for consistency"""
    
    # Authentication
    INVALID_CREDENTIALS = "Invalid email or password"
    EMAIL_ALREADY_EXISTS = "Email already registered"
    ACCOUNT_INACTIVE = "Account is inactive"
    UNAUTHORIZED = "Not authenticated"
    TOKEN_EXPIRED = "Token has expired"
    TOKEN_INVALID = "Invalid token"
    
    # Authorization
    FORBIDDEN = "You don't have permission to perform this action"
    NOT_OWNER = "You are not the owner of this resource"
    
    # Resources
    NOT_FOUND = "Resource not found"
    LAND_NOT_FOUND = "Land not found"
    USER_NOT_FOUND = "User not found"
    IMAGE_NOT_FOUND = "Image not found"
    
    # Validation
    INVALID_STATUS = "Invalid status value"
    INVALID_FILE_TYPE = "Unsupported file type"
    FILE_TOO_LARGE = "File size exceeds maximum allowed"
    EMPTY_FILE = "File is empty"
    
    # Verification
    INVALID_CODE = "Invalid or expired verification code"
    CODE_EXPIRED = "Verification code has expired"
    
    # Generic
    INTERNAL_ERROR = "An internal error occurred"
    DATABASE_ERROR = "Database operation failed"


# ===== Common Exception Factories =====

def unauthorized_exception(detail: str = ErrorMessages.UNAUTHORIZED) -> HTTPException:
    """Create 401 Unauthorized exception"""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"}
    )


def forbidden_exception(detail: str = ErrorMessages.FORBIDDEN) -> HTTPException:
    """Create 403 Forbidden exception"""
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=detail
    )


def not_found_exception(detail: str = ErrorMessages.NOT_FOUND) -> HTTPException:
    """Create 404 Not Found exception"""
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=detail
    )


def conflict_exception(detail: str) -> HTTPException:
    """Create 409 Conflict exception"""
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=detail
    )


def validation_exception(detail: str) -> HTTPException:
    """Create 422 Validation exception"""
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=detail
    )


def internal_error_exception(detail: str = ErrorMessages.INTERNAL_ERROR) -> HTTPException:
    """Create 500 Internal Server Error exception"""
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=detail
    )


# ===== Ownership Check Utility =====

def check_ownership(resource_owner_id: int, current_user_id: int):
    """
    Check if current user owns the resource
    Raises 403 if not
    """
    if resource_owner_id != current_user_id:
        raise forbidden_exception(ErrorMessages.NOT_OWNER)


# ===== Database Error Handler =====

async def safe_db_operation(
    logger: logging.Logger,
    operation_name: str,
    operation_callable: Callable,
    *args,
    **kwargs
) -> Any:
    """
    Safely execute a database operation with error handling
    
    Usage:
        result = await safe_db_operation(
            logger,
            "CREATE_LAND",
            db.execute,
            stmt
        )
    """
    try:
        return await operation_callable(*args, **kwargs)
    except Exception as exc:
        logger.error(
            "Database error in %s: %s",
            operation_name,
            exc,
            exc_info=True
        )
        raise internal_error_exception(ErrorMessages.DATABASE_ERROR)


# ===== Example Usage in Routers =====
"""
Example of how to use these utilities in your routers:

from app.utils.errors import (
    handle_errors,
    ErrorMessages,
    not_found_exception,
    forbidden_exception,
    check_ownership
)

@router.get("/{land_id}", response_model=LandOut)
@handle_errors(logger, "GET_LAND")
async def get_land(land_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Land).where(Land.land_id == land_id))
    land = result.scalar_one_or_none()
    
    if not land:
        raise not_found_exception(ErrorMessages.LAND_NOT_FOUND)
    
    return LandOut.model_validate(land)


@router.delete("/{land_id}", status_code=204)
@handle_errors(logger, "DELETE_LAND")
async def delete_land(
    land_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Land).where(Land.land_id == land_id))
    land = result.scalar_one_or_none()
    
    if not land:
        raise not_found_exception(ErrorMessages.LAND_NOT_FOUND)
    
    # Check ownership
    check_ownership(land.owner_id, current_user.user_id)
    
    await db.execute(delete(Land).where(Land.land_id == land_id))
    await db.commit()
    
    return Response(status_code=204)
"""