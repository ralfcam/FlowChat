@echo off
echo Starting FlowChat Application...

REM Start the backend server (in a new window)
start cmd /k "cd backend && python app.py"

REM Wait a moment for the backend to start
timeout /t 3

REM Start the frontend development server
cd frontend && npm run start 