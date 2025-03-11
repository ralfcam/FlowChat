"""
FlowChat - Backend API

A Python-based backend for the FlowChat application
using MongoDB for data storage.
"""

from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
from config.settings import Settings

app = None
mongo_client = None


def create_app(config=None):
    """Initialize and configure the Flask application."""
    global app, mongo_client
    
    app = Flask(__name__)
    
    # Load configuration
    settings = Settings()
    app.config.from_object(settings)
    
    # Override with passed config if provided
    if config:
        app.config.update(config)
    
    # Initialize MongoDB connection
    mongo_client = MongoClient(app.config['MONGODB_URI'])
    app.db = mongo_client[app.config['MONGODB_DATABASE']]
    
    # Setup CORS
    CORS(app)
    
    # Register blueprints
    from app.routes import register_routes
    register_routes(app)
    
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