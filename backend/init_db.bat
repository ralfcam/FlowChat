@echo off
echo Initializing FlowChat database...

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo Virtual environment not found. Creating one...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
)

REM Run the database initialization script
python scripts/init_db.py

echo.
echo Database initialization complete.
echo.

pause 