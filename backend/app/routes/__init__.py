"""
API Routes for FlowChat backend.
"""

from flask import Blueprint

from app.routes.auth import auth_bp
from app.routes.messages import messages_bp
from app.routes.contacts import contacts_bp
from app.routes.webhooks import webhooks_bp
from app.routes.whatsapp import whatsapp_bp
from app.routes.flows import flows_bp


def register_routes(app):
    """Register all route blueprints."""
    
    # Register API v1 blueprint
    api_v1 = Blueprint('api_v1', __name__, url_prefix='/api/v1')
    
    # Register sub-blueprints
    api_v1.register_blueprint(auth_bp)
    api_v1.register_blueprint(messages_bp)
    api_v1.register_blueprint(contacts_bp)
    api_v1.register_blueprint(flows_bp)
    
    # Register root blueprints
    app.register_blueprint(api_v1)
    app.register_blueprint(webhooks_bp)
    app.register_blueprint(whatsapp_bp)
    
    # Add health check route
    @app.route('/health')
    def health_check():
        return {'status': 'ok'} 