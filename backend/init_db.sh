#!/bin/bash
echo "Initializing FlowChat database..."

# Activate virtual environment if it exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# Run the database initialization script
python scripts/init_db.py

echo ""
echo "Database initialization complete."
echo ""

# Make the script executable
chmod +x init_db.sh 