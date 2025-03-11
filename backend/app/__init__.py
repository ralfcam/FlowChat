"""
FlowChat - Backend API

A Python-based backend for the FlowChat application
using MongoDB for data storage.
"""

from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
from config.settings import Settings
from config.logging_config import configure_logging
from app.utils.error_handlers import register_error_handlers
from app.middleware import init_middleware

app = None
mongo_client = None


def create_app(config=None):
    """Initialize and configure the Flask application."""
    global app, mongo_client
    
    # Set up logging first so we can log application startup
    logger = configure_logging()
    logger.info("Starting FlowChat backend application")
    
    app = Flask(__name__)
    
    # Load configuration
    settings = Settings()
    app.config.from_object(settings)
    
    # Override with passed config if provided
    if config:
        app.config.update(config)
        logger.info("Applied custom application configuration")
    
    # Initialize MongoDB connection
    mongo_client = MongoClient(app.config['MONGODB_URI'])
    app.db = mongo_client[app.config['MONGODB_DATABASE']]
    logger.info(f"Connected to MongoDB database: {app.config['MONGODB_DATABASE']}")
    
    # Setup CORS
    CORS(app)
    logger.info("CORS initialized")
    
    # Initialize middleware
    init_middleware(app)
    logger.info("Middleware initialized")
    
    # Register error handlers
    register_error_handlers(app)
    logger.info("Error handlers registered")
    
    # Register blueprints
    from app.routes import register_routes
    register_routes(app)
    logger.info("Routes registered")
    
    logger.info("Application initialization complete")
    return app


def get_app():
    """Get the configured app instance."""
    global app
    if app is None:
        app = create_app()
    return app


def get_db():
    """Get the configured database instance."""
    global app
    if app is None:
        app = create_app()
    return app.db 