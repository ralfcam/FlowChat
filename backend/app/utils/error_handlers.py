"""
Error handlers for the Flask application.
"""
import logging
import traceback
from flask import jsonify, request

# Get logger
logger = logging.getLogger(__name__)

class APIError(Exception):
    """Base exception for API errors."""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        """Convert exception to a dictionary for JSON response."""
        result = dict(self.payload or {})
        result['error'] = self.message
        result['status'] = 'error'
        return result

def log_exception(exception):
    """Log detailed exception information."""
    # Get request information if available
    request_id = getattr(request, 'id', 'no-request-id') if request else 'no-request'
    
    # Get exception details
    exc_type = type(exception).__name__
    exc_message = str(exception)
    exc_traceback = ''.join(traceback.format_exception(
        type(exception), exception, exception.__traceback__
    ))
    
    # Log the exception
    logger.error(
        f"Exception occurred: {exc_type}: {exc_message}",
        extra={
            'request_id': request_id,
            'exception_type': exc_type,
            'exception_message': exc_message,
            'traceback': exc_traceback
        },
        exc_info=True
    )

def register_error_handlers(app):
    """Register error handlers for the Flask application."""
    
    @app.errorhandler(APIError)
    def handle_api_error(error):
        """Handle APIError exceptions."""
        log_exception(error)
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response
    
    @app.errorhandler(404)
    def handle_not_found(error):
        """Handle 404 Not Found errors."""
        logger.warning(f"404 Not Found: {request.path}")
        return jsonify({
            'status': 'error',
            'error': 'The requested resource was not found'
        }), 404
    
    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        """Handle 405 Method Not Allowed errors."""
        logger.warning(f"405 Method Not Allowed: {request.method} {request.path}")
        return jsonify({
            'status': 'error',
            'error': 'The method is not allowed for the requested URL'
        }), 405
    
    @app.errorhandler(500)
    def handle_server_error(error):
        """Handle 500 Internal Server Error."""
        log_exception(error)
        return jsonify({
            'status': 'error',
            'error': 'An internal server error occurred'
        }), 500
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Handle unexpected exceptions."""
        log_exception(error)
        return jsonify({
            'status': 'error',
            'error': 'An unexpected error occurred'
        }), 500 