"""
Context Logger

This module provides a context-aware logger that can be used throughout
the application to maintain contextual information in logs.
"""

import logging
import time
import traceback
import functools
from datetime import datetime
from flask import g, request, has_request_context


class ContextLogger:
    """
    A logger that maintains context and provides consistent logging
    across the application.
    """

    def __init__(self, name, context=None):
        """
        Initialize the context logger.
        
        Args:
            name (str): The name of the logger.
            context (dict, optional): The context to include in the logs.
        """
        self.logger = logging.getLogger(name)
        self.context = context or {}
        
    def with_context(self, **context):
        """
        Create a new logger with additional context.
        
        Args:
            **context: Key-value pairs to add to the context.
            
        Returns:
            ContextLogger: A new logger with the additional context.
        """
        new_context = self.context.copy()
        new_context.update(context)
        return ContextLogger(self.logger.name, new_context)
        
    def _get_full_context(self):
        """
        Get the full context for the log message, including request
        and user information if available.
        
        Returns:
            dict: The full context.
        """
        full_context = self.context.copy()
        
        # Add request information if in a request context
        if has_request_context():
            # Add request ID from middleware
            full_context['request_id'] = getattr(g, 'request_id', None)
            
            # Basic request info
            full_context['method'] = request.method
            full_context['path'] = request.path
            full_context['endpoint'] = request.endpoint
            
            # Add user information if available
            if hasattr(g, 'user') and g.user:
                full_context['user_id'] = getattr(g.user, 'id', None)
                full_context['user_email'] = getattr(g.user, 'email', None)
                
        # Add timestamp
        full_context['timestamp'] = datetime.utcnow().isoformat()
        
        return full_context
        
    def debug(self, message, **kwargs):
        """Log a debug message with context."""
        context = self._get_full_context()
        context.update(kwargs)
        self.logger.debug(message, extra=context)
        
    def info(self, message, **kwargs):
        """Log an info message with context."""
        context = self._get_full_context()
        context.update(kwargs)
        self.logger.info(message, extra=context)
        
    def warning(self, message, **kwargs):
        """Log a warning message with context."""
        context = self._get_full_context()
        context.update(kwargs)
        self.logger.warning(message, extra=context)
        
    def error(self, message, **kwargs):
        """Log an error message with context."""
        context = self._get_full_context()
        context.update(kwargs)
        self.logger.error(message, extra=context)
        
    def critical(self, message, **kwargs):
        """Log a critical message with context."""
        context = self._get_full_context()
        context.update(kwargs)
        self.logger.critical(message, extra=context)
        
    def exception(self, message, exc_info=True, **kwargs):
        """Log an exception message with context."""
        context = self._get_full_context()
        context.update(kwargs)
        
        # Add exception traceback
        if exc_info:
            context['traceback'] = traceback.format_exc()
            
        self.logger.exception(message, extra=context)


def log_operation(logger=None, operation_name=None):
    """
    A decorator to log the start and end of an operation.
    
    Args:
        logger (ContextLogger, optional): The logger to use.
            If not provided, creates a new logger with the function's module name.
        operation_name (str, optional): The name of the operation to log.
            If not provided, uses the function's name.
            
    Returns:
        callable: The decorated function.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Create a logger if not provided
            nonlocal logger
            if logger is None:
                logger = ContextLogger(func.__module__)
                
            # Use function name if operation name not provided
            nonlocal operation_name
            if operation_name is None:
                operation_name = func.__name__
                
            # Log start of operation
            logger.info(f"Starting operation: {operation_name}")
            
            # Track timing
            start_time = time.time()
            
            try:
                # Execute the function
                result = func(*args, **kwargs)
                
                # Calculate duration
                duration = time.time() - start_time
                duration_ms = round(duration * 1000, 2)
                
                # Log successful completion
                logger.info(
                    f"Completed operation: {operation_name}",
                    duration_ms=duration_ms
                )
                
                return result
                
            except Exception as e:
                # Calculate duration
                duration = time.time() - start_time
                duration_ms = round(duration * 1000, 2)
                
                # Log failure
                logger.exception(
                    f"Failed operation: {operation_name} - {str(e)}",
                    duration_ms=duration_ms,
                    error=str(e),
                    error_type=type(e).__name__
                )
                
                # Re-raise the exception
                raise
                
        return wrapper
    return decorator


# Create a global logger instance for import
logger = ContextLogger('flowchat') 