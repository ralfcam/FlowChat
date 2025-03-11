"""
Middleware Module

This module contains middleware functions for the Flask application.
"""

import logging
import time
import uuid
from flask import request, g

logger = logging.getLogger('flowchat.middleware')


def init_middleware(app):
    """Initialize all middleware for the Flask application."""
    register_request_logger(app)
    register_request_id(app)


def register_request_id(app):
    """Register middleware to assign a unique ID to each request."""
    
    @app.before_request
    def assign_request_id():
        """Assign a unique ID to each request for tracing."""
        g.request_id = str(uuid.uuid4())
        g.start_time = time.time()


def register_request_logger(app):
    """Register middleware to log requests and responses."""
    
    @app.before_request
    def log_request():
        """Log information about the incoming request."""
        # Skip logging for certain endpoints
        if request.path == '/healthcheck' or request.path.startswith('/static'):
            return
            
        # Log the request
        logger.info(
            f"Request received: {request.method} {request.path}",
            extra={
                'request_id': getattr(g, 'request_id', None),
                'method': request.method,
                'path': request.path,
                'remote_addr': request.remote_addr,
                'user_agent': getattr(request.user_agent, 'string', None),
                'content_type': request.content_type,
                'content_length': request.content_length,
            }
        )
        
    @app.after_request
    def log_response(response):
        """Log information about the outgoing response."""
        # Skip logging for certain endpoints
        if request.path == '/healthcheck' or request.path.startswith('/static'):
            return response
            
        # Calculate request duration
        duration = time.time() - getattr(g, 'start_time', time.time())
        duration_ms = round(duration * 1000, 2)
        
        # Log the response
        logger.info(
            f"Response sent: {request.method} {request.path} {response.status_code} - {duration_ms}ms",
            extra={
                'request_id': getattr(g, 'request_id', None),
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'duration_ms': duration_ms,
                'content_length': response.content_length,
                'content_type': response.content_type,
            }
        )
        
        # Add request ID to response headers for tracking
        response.headers['X-Request-ID'] = getattr(g, 'request_id', 'none')
        
        return response 