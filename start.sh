#!/bin/bash
echo "Starting FlowChat Application..."

# Start the backend server in the background
cd backend && python app.py &
BACKEND_PID=$!

# Save the backend PID to a file for easy cleanup later
echo $BACKEND_PID > ../flowchat_services.pid

# Wait a moment for the backend to start
sleep 3

# Start the frontend development server
cd ../frontend && npm run start

# When the frontend server exits, kill the backend
FRONTEND_EXIT=$?
kill $BACKEND_PID
exit $FRONTEND_EXIT 