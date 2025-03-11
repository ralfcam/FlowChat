"""
FlowChat - Backend Application Entry Point

This module is the main entry point for the FlowChat backend.
It creates and configures the Flask application.
"""

from app import create_app
import os

# Create logs directory if it doesn't exist
logs_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(logs_dir, exist_ok=True)

# Create and configure the app
app = create_app()

if __name__ == '__main__':
    app.run(debug=app.config.get('DEBUG', False),
            host=app.config.get('HOST', '0.0.0.0'),
            port=app.config.get('PORT', 5000)) 