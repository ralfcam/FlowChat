"""
Logging Configuration

This module configures the logging system for the FlowChat backend application.
It sets up proper log formatters, handlers, and configuration for both console
and file-based logging.
"""

import os
import logging
import logging.config
from logging.handlers import RotatingFileHandler
import json
from datetime import datetime
import sys


class JsonFormatter(logging.Formatter):
    """
    Formatter that outputs JSON strings after parsing the log record.
    """
    
    def format(self, record):
        """Format log record as JSON"""
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
        }
        
        # Add exception info if present
        if record.exc_info:
            log_record["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
            }
        
        # Add any extra attributes
        for key, value in record.__dict__.items():
            if key not in ["args", "asctime", "created", "exc_info", "exc_text", 
                          "filename", "funcName", "id", "levelname", "levelno",
                          "lineno", "module", "msecs", "message", "msg", 
                          "name", "pathname", "process", "processName", 
                          "relativeCreated", "stack_info", "thread", "threadName"]:
                log_record[key] = value
        
        return json.dumps(log_record)


def configure_logging():
    """
    Configure the logging system for the application.
    
    Returns:
        Logger: The main application logger
    """
    # Create logs directory if it doesn't exist
    logs_dir = "logs"
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir)
    
    # Configure the root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Clear any existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler with a higher log level
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    # Create file handler for all logs
    file_handler = RotatingFileHandler(
        filename=os.path.join(logs_dir, "flowchat.log"),
        maxBytes=10485760,  # 10MB
        backupCount=10,
    )
    file_handler.setLevel(logging.DEBUG)
    
    # Create separate error log file handler
    error_file_handler = RotatingFileHandler(
        filename=os.path.join(logs_dir, "error.log"),
        maxBytes=10485760,  # 10MB
        backupCount=10,
    )
    error_file_handler.setLevel(logging.ERROR)
    
    # Create formatters
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    json_formatter = JsonFormatter()
    
    # Add formatters to handlers
    console_handler.setFormatter(console_formatter)
    file_handler.setFormatter(json_formatter)
    error_file_handler.setFormatter(json_formatter)
    
    # Add handlers to root logger
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_file_handler)
    
    # Create and return the application logger
    app_logger = logging.getLogger("flowchat")
    app_logger.setLevel(logging.DEBUG)
    
    app_logger.info("Logging system initialized")
    return app_logger 