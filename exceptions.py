# backend/app/core/exceptions.py
from typing import Any, Dict, Optional

class AppException(Exception):
    """Base application exception"""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class NotFoundError(AppException):
    """Resource not found exception"""
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=404, details=details)

class ValidationError(AppException):
    """Validation error exception"""
    def __init__(self, message: str = "Validation error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, details=details)

class AuthenticationError(AppException):
    """Authentication error exception"""
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=401, details=details)

class AuthorizationError(AppException):
    """Authorization error exception"""
    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, details=details)

class ConflictError(AppException):
    """Conflict error exception"""
    def __init__(self, message: str = "Resource conflict", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=409, details=details)

class ExternalServiceError(AppException):
    """External service error exception"""
    def __init__(self, message: str = "External service error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=503, details=details)

class ConfigurationError(AppException):
    """Configuration error exception"""
    def __init__(self, message: str = "Configuration error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)

class PLCCommunicationError(AppException):
    """PLC communication error exception"""
    def __init__(self, message: str = "PLC communication error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=503, details=details)

class HardwareError(AppException):
    """Hardware error exception"""
    def __init__(self, message: str = "Hardware error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=503, details=details)


# backend/app/core/exceptions.py
from typing import Any, Dict, Optional

class AppException(Exception):
    """Base application exception"""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class NotFoundError(AppException):
    """Resource not found exception"""
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=404, details=details)

class ValidationError(AppException):
    """Validation error exception"""
    def __init__(self, message: str = "Validation error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, details=details)

class AuthenticationError(AppException):
    """Authentication error exception"""
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=401, details=details)

class AuthorizationError(AppException):
    """Authorization error exception"""
    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, details=details)

class ConflictError(AppException):
    """Conflict error exception"""
    def __init__(self, message: str = "Resource conflict", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=409, details=details)

class ExternalServiceError(AppException):
    """External service error exception"""
    def __init__(self, message: str = "External service error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=503, details=details)

class ConfigurationError(AppException):
    """Configuration error exception"""
    def __init__(self, message: str = "Configuration error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)

class PLCCommunicationError(AppException):
    """PLC communication error exception"""
    def __init__(self, message: str = "PLC communication error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=503, details=details)

class HardwareError(AppException):
    """Hardware error exception"""
    def __init__(self, message: str = "Hardware error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=503, details=details)