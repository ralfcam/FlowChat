#!/bin/bash
# FlowChat - Service Management Script
# This script starts, stops, and checks the status of the FlowChat services

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# File to store PIDs
PID_FILE="./flowchat_services.pid"

# Backend variables
BACKEND_DIR="./backend"
VENV_DIR="$BACKEND_DIR/venv"
LOGS_DIR="$BACKEND_DIR/logs"
BACKEND_LOG="$LOGS_DIR/backend.log"

# Frontend variables
FRONTEND_DIR="./frontend"
FRONTEND_LOG="$FRONTEND_DIR/frontend.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Python 3 is not installed. Please install it to run the backend.${NC}"
        exit 1
    fi
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js is not installed. Please install it to run the frontend.${NC}"
        exit 1
    fi
}

# Setup Python virtual environment
setup_venv() {
    echo -e "${BLUE}Setting up Python virtual environment...${NC}"
    
    if [ ! -d "$VENV_DIR" ]; then
        # Create virtual environment
        python3 -m venv "$VENV_DIR"
        
        # Activate virtual environment and install dependencies
        source "$VENV_DIR/bin/activate"
        pip install -r "$BACKEND_DIR/requirements.txt"
        deactivate
        
        echo -e "${GREEN}Virtual environment created and dependencies installed.${NC}"
    else
        echo -e "${GREEN}Virtual environment already exists.${NC}"
    fi
}

# Check if .env file exists, if not create from example
check_env_file() {
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
            echo -e "${YELLOW}Please update the .env file with your actual configuration values.${NC}"
        else
            echo -e "${RED}No .env.example file found. Please create a .env file manually.${NC}"
        fi
    fi
}

# Start the backend service
start_backend() {
    echo -e "${BLUE}Starting FlowChat Backend...${NC}"
    
    # Check if already running
    if is_backend_running; then
        echo -e "${YELLOW}Backend is already running.${NC}"
        return
    fi
    
    # Activate virtual environment and start the backend
    cd "$BACKEND_DIR"
    source "$VENV_DIR/bin/activate"
    python app.py > "$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    deactivate
    cd ..
    
    echo "backend:$BACKEND_PID" >> "$PID_FILE"
    echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"
    echo -e "${GREEN}Logs available at: $BACKEND_LOG${NC}"
}

# Start the frontend service
start_frontend() {
    echo -e "${BLUE}Starting FlowChat Frontend...${NC}"
    
    # Check if already running
    if is_frontend_running; then
        echo -e "${YELLOW}Frontend is already running.${NC}"
        return
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        echo -e "${BLUE}Installing frontend dependencies...${NC}"
        cd "$FRONTEND_DIR"
        npm install
        cd ..
    fi
    
    # Start the frontend
    cd "$FRONTEND_DIR"
    npm start > "$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    echo "frontend:$FRONTEND_PID" >> "$PID_FILE"
    echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"
    echo -e "${GREEN}Logs available at: $FRONTEND_LOG${NC}"
}

# Check if backend is running
is_backend_running() {
    if [ -f "$PID_FILE" ]; then
        BACKEND_PID=$(grep "backend:" "$PID_FILE" | cut -d':' -f2)
        if [ -n "$BACKEND_PID" ] && ps -p "$BACKEND_PID" > /dev/null; then
            return 0 # Running
        fi
    fi
    return 1 # Not running
}

# Check if frontend is running
is_frontend_running() {
    if [ -f "$PID_FILE" ]; then
        FRONTEND_PID=$(grep "frontend:" "$PID_FILE" | cut -d':' -f2)
        if [ -n "$FRONTEND_PID" ] && ps -p "$FRONTEND_PID" > /dev/null; then
            return 0 # Running
        fi
    fi
    return 1 # Not running
}

# Stop the backend service
stop_backend() {
    echo -e "${BLUE}Stopping FlowChat Backend...${NC}"
    
    if [ -f "$PID_FILE" ]; then
        BACKEND_PID=$(grep "backend:" "$PID_FILE" | cut -d':' -f2)
        if [ -n "$BACKEND_PID" ]; then
            if ps -p "$BACKEND_PID" > /dev/null; then
                kill -15 "$BACKEND_PID"
                echo -e "${GREEN}Backend stopped.${NC}"
            else
                echo -e "${YELLOW}Backend is not running.${NC}"
            fi
            sed -i "/backend:$BACKEND_PID/d" "$PID_FILE"
        else
            echo -e "${YELLOW}Backend PID not found.${NC}"
        fi
    else
        echo -e "${YELLOW}No PID file found.${NC}"
    fi
}

# Stop the frontend service
stop_frontend() {
    echo -e "${BLUE}Stopping FlowChat Frontend...${NC}"
    
    if [ -f "$PID_FILE" ]; then
        FRONTEND_PID=$(grep "frontend:" "$PID_FILE" | cut -d':' -f2)
        if [ -n "$FRONTEND_PID" ]; then
            if ps -p "$FRONTEND_PID" > /dev/null; then
                kill -15 "$FRONTEND_PID"
                echo -e "${GREEN}Frontend stopped.${NC}"
            else
                echo -e "${YELLOW}Frontend is not running.${NC}"
            fi
            sed -i "/frontend:$FRONTEND_PID/d" "$PID_FILE"
        else
            echo -e "${YELLOW}Frontend PID not found.${NC}"
        fi
    else
        echo -e "${YELLOW}No PID file found.${NC}"
    fi
}

# Show status of services
show_status() {
    echo -e "${BLUE}===== FlowChat Services Status =====${NC}"
    
    if is_backend_running; then
        BACKEND_PID=$(grep "backend:" "$PID_FILE" | cut -d':' -f2)
        echo -e "${GREEN}Backend: Running (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${RED}Backend: Stopped${NC}"
    fi
    
    if is_frontend_running; then
        FRONTEND_PID=$(grep "frontend:" "$PID_FILE" | cut -d':' -f2)
        echo -e "${GREEN}Frontend: Running (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${RED}Frontend: Stopped${NC}"
    fi
    
    echo -e "${BLUE}==================================${NC}"
}

# Display usage information
usage() {
    echo -e "${BLUE}FlowChat Service Management Script${NC}"
    echo -e "Usage: $0 [command]"
    echo -e ""
    echo -e "Commands:"
    echo -e "  start       Start both backend and frontend services"
    echo -e "  stop        Stop both backend and frontend services"
    echo -e "  restart     Restart both backend and frontend services"
    echo -e "  status      Show status of services"
    echo -e "  start-b     Start only the backend service"
    echo -e "  start-f     Start only the frontend service"
    echo -e "  stop-b      Stop only the backend service"
    echo -e "  stop-f      Stop only the frontend service"
    echo -e "  help        Show this help message"
    echo -e ""
}

# Main execution logic
case "$1" in
    start)
        check_python
        check_node
        setup_venv
        check_env_file
        start_backend
        start_frontend
        ;;
    stop)
        stop_backend
        stop_frontend
        ;;
    restart)
        stop_backend
        stop_frontend
        check_python
        check_node
        setup_venv
        check_env_file
        start_backend
        start_frontend
        ;;
    status)
        show_status
        ;;
    start-b)
        check_python
        setup_venv
        check_env_file
        start_backend
        ;;
    start-f)
        check_node
        start_frontend
        ;;
    stop-b)
        stop_backend
        ;;
    stop-f)
        stop_frontend
        ;;
    help|*)
        usage
        ;;
esac

exit 0 