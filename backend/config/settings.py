"""
Configuration settings for the FlowChat backend.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""
    
    # Flask settings
    DEBUG = os.getenv('DEBUG', 'False') == 'True'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # MongoDB settings
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'flowchat')
    
    # JWT settings
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hour
    
    # WhatsApp API settings
    WHATSAPP_API_URL = os.getenv('WHATSAPP_API_URL', '')
    WHATSAPP_API_TOKEN = os.getenv('WHATSAPP_API_TOKEN', '')
    
    # Logging settings
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')


class DevelopmentSettings(Settings):
    """Development environment settings."""
    DEBUG = True


class TestingSettings(Settings):
    """Testing environment settings."""
    DEBUG = True
    TESTING = True
    MONGODB_DATABASE = 'flowchat_test'


class ProductionSettings(Settings):
    """Production environment settings."""
    DEBUG = False
    
    def __init__(self):
        super().__init__()
        # Ensure these are set in production
        assert self.SECRET_KEY != 'dev-secret-key', "SECRET_KEY must be set in production"
        assert self.JWT_SECRET_KEY != 'dev-secret-key', "JWT_SECRET_KEY must be set in production" 