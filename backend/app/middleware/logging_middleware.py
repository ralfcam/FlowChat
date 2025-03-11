"""
Logging middleware for Flask requests and responses.
"""
import time
import logging
import uuid
from flask import request, g

# Get logger
request_logger = logging.getLogger('request')

def log_request_start():
    """Log information about the request before it's processed."""
    # Generate a unique request ID and attach to the request
    request.id = str(uuid.uuid4())
    g.start_time = time.time()
    
    # Log basic request information
    request_logger.info(
        f"Request started",
        extra={
            'request_id': request.id,
            'method': request.method,
            'url': request.url,
            'path': request.path,
            'remote_addr': request.remote_addr,
            'user_agent': request.user_agent.string,
            'content_length': request.content_length,
            'content_type': request.content_type,
        }
    )

def log_request_end(response):
    """Log information about the request after it's processed."""
    # Calculate request duration
    duration = time.time() - g.start_time if hasattr(g, 'start_time') else None
    
    # Log request completion
    request_logger.info(
        f"Request completed",
        extra={
            'request_id': getattr(request, 'id', 'unknown'),
            'method': request.method,
            'url': request.url,
            'status_code': response.status_code,
            'content_length': response.content_length,
            'duration_ms': int(duration * 1000) if duration else None,
        }
    )
    
    return response

def setup_request_logging(app):
    """Set up request logging for the Flask app."""
    app.before_request(log_request_start)
    app.after_request(log_request_end) 