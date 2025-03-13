"""
FlowChat - Backend Application Entry Point

This module is the main entry point for the FlowChat backend.
It creates and configures the Flask application.
"""

from app import create_app
import os
from dotenv import load_dotenv

# Determine environment
is_development = os.environ.get('FLASK_ENV') == 'development'

# Load appropriate environment variables
if is_development:
    # Load development environment variables
    env_file = os.path.join(os.path.dirname(__file__), '.env.development')
    if os.path.exists(env_file):
        load_dotenv(env_file)
        print("\n" + "*" * 80)
        print("* DEVELOPMENT MODE ACTIVE")
        print("* Authentication bypass is ENABLED")
        print("* WARNING: Do not use in production!")
        print("*" * 80 + "\n")
    else:
        print("\nWarning: .env.development file not found. Using default environment.\n")
else:
    # Load production environment variables
    load_dotenv()

# Create logs directory if it doesn't exist
logs_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(logs_dir, exist_ok=True)

# Create and configure the app
app = create_app()

if __name__ == '__main__':
    app.run(debug=app.config.get('DEBUG', False),
            host=app.config.get('HOST', '0.0.0.0'),
            port=app.config.get('PORT', 5000)) 