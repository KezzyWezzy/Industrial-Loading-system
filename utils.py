# backend/app/core/utils.py
import os
import random
import string
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import hashlib
import json
from decimal import Decimal
import uuid

def generate_random_string(length: int = 32) -> str:
    """Generate a random string of specified length"""
    letters = string.ascii_letters + string.digits
    return ''.join(random.choice(letters) for _ in range(length))

def generate_transaction_id() -> str:
    """Generate a unique transaction ID"""
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    random_part = generate_random_string(6)
    return f"TXN{timestamp}{random_part}"

def generate_bol_number() -> str:
    """Generate a unique BOL number"""
    timestamp = datetime.utcnow().strftime('%Y%m%d')
    random_part = generate_random_string(4)
    return f"BOL{timestamp}{random_part}"

def calculate_hash(data: str) -> str:
    """Calculate SHA256 hash of data"""
    return hashlib.sha256(data.encode()).hexdigest()

def convert_weight_to_volume(weight_lbs: Decimal, specific_gravity: Decimal) -> Decimal:
    """Convert weight in pounds to volume in barrels"""
    # 1 barrel of water weighs approximately 350 lbs
    # Volume = Weight / (Specific Gravity * 350)
    water_weight_per_bbl = Decimal("350")
    if specific_gravity > 0:
        return weight_lbs / (specific_gravity * water_weight_per_bbl)
    return Decimal("0")

def convert_volume_to_weight(volume_bbls: Decimal, specific_gravity: Decimal) -> Decimal:
    """Convert volume in barrels to weight in pounds"""
    # Weight = Volume * Specific Gravity * 350
    water_weight_per_bbl = Decimal("350")
    return volume_bbls * specific_gravity * water_weight_per_bbl

def temperature_correction_factor(observed_temp: float, api_gravity: float) -> float:
    """Calculate temperature correction factor for petroleum products"""
    # Simplified API temperature correction
    # In production, use API MPMS Chapter 11.1 tables
    reference_temp = 60.0  # °F
    if observed_temp == reference_temp:
        return 1.0
    
    # Simplified linear correction (not accurate for production use)
    alpha = 0.00035  # Thermal expansion coefficient
    return 1.0 + alpha * (reference_temp - observed_temp)

def format_datetime(dt: Optional[datetime], format_string: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Format datetime to string"""
    if dt:
        return dt.strftime(format_string)
    return ""

def parse_datetime(date_string: str, format_string: str = "%Y-%m-%d %H:%M:%S") -> Optional[datetime]:
    """Parse string to datetime"""
    try:
        return datetime.strptime(date_string, format_string)
    except ValueError:
        return None

def round_decimal(value: Decimal, places: int = 2) -> Decimal:
    """Round decimal to specified number of places"""
    return value.quantize(Decimal(10) ** -places)

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe file system storage"""
    # Remove any path separators
    filename = os.path.basename(filename)
    # Replace spaces and special characters
    filename = "".join(c if c.isalnum() or c in ".-_" else "_" for c in filename)
    # Limit length
    name, ext = os.path.splitext(filename)
    if len(name) > 100:
        name = name[:100]
    return name + ext

def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """Split a list into chunks of specified size"""
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]

def merge_dicts(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """Deep merge two dictionaries"""
    result = dict1.copy()
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = merge_dicts(result[key], value)
        else:
            result[key] = value
    return result

def calculate_utilization(current: Decimal, capacity: Decimal) -> Decimal:
    """Calculate utilization percentage"""
    if capacity > 0:
        return (current / capacity) * 100
    return Decimal("0")

def is_valid_uuid(value: str) -> bool:
    """Check if string is a valid UUID"""
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False

def get_shift_info(timestamp: datetime) -> Dict[str, Any]:
    """Get shift information for a given timestamp"""
    hour = timestamp.hour
    
    if 6 <= hour < 14:
        shift = "Day"
        shift_start = timestamp.replace(hour=6, minute=0, second=0, microsecond=0)
        shift_end = timestamp.replace(hour=14, minute=0, second=0, microsecond=0)
    elif 14 <= hour < 22:
        shift = "Evening"
        shift_start = timestamp.replace(hour=14, minute=0, second=0, microsecond=0)
        shift_end = timestamp.replace(hour=22, minute=0, second=0, microsecond=0)
    else:
        shift = "Night"
        if hour >= 22:
            shift_start = timestamp.replace(hour=22, minute=0, second=0, microsecond=0)
            shift_end = (timestamp + timedelta(days=1)).replace(hour=6, minute=0, second=0, microsecond=0)
        else:
            shift_start = (timestamp - timedelta(days=1)).replace(hour=22, minute=0, second=0, microsecond=0)
            shift_end = timestamp.replace(hour=6, minute=0, second=0, microsecond=0)
    
    return {
        "shift": shift,
        "shift_start": shift_start,
        "shift_end": shift_end
    }

def validate_email(email: str) -> bool:
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def mask_sensitive_data(data: Dict[str, Any], fields: List[str]) -> Dict[str, Any]:
    """Mask sensitive fields in dictionary"""
    result = data.copy()
    for field in fields:
        if field in result:
            if isinstance(result[field], str):
                # Keep first and last characters
                if len(result[field]) > 2:
                    result[field] = result[field][0] + "*" * (len(result[field]) - 2) + result[field][-1]
                else:
                    result[field] = "*" * len(result[field])
    return result

# Export common regex patterns
REGEX_PATTERNS = {
    "email": r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    "phone": r'^\+?1?\d{9,15}$',
    "alphanumeric": r'^[a-zA-Z0-9]+$',
    "tank_number": r'^[A-Z0-9\-]+$',
    "vehicle_id": r'^[A-Z0-9\-]+$'
}