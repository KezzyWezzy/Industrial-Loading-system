# backend/app/core/dependencies.py
from typing import Optional
from fastapi import Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db

class PaginationParams:
    """Common pagination parameters"""
    def __init__(
        self,
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return")
    ):
        self.skip = skip
        self.limit = limit

class DateRangeParams:
    """Common date range parameters"""
    def __init__(
        self,
        start_date: Optional[datetime] = Query(None, description="Start date for filtering"),
        end_date: Optional[datetime] = Query(None, description="End date for filtering")
    ):
        self.start_date = start_date
        self.end_date = end_date

class FilterParams:
    """Common filter parameters"""
    def __init__(
        self,
        search: Optional[str] = Query(None, description="Search term"),
        is_active: Optional[bool] = Query(None, description="Filter by active status"),
        sort_by: Optional[str] = Query(None, description="Field to sort by"),
        sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order")
    ):
        self.search = search
        self.is_active = is_active
        self.sort_by = sort_by
        self.sort_order = sort_order

def get_pagination(pagination: PaginationParams = Depends()) -> PaginationParams:
    """Get pagination parameters"""
    return pagination

def get_date_range(date_range: DateRangeParams = Depends()) -> DateRangeParams:
    """Get date range parameters"""
    return date_range

def get_filters(filters: FilterParams = Depends()) -> FilterParams:
    """Get filter parameters"""
    return filters
