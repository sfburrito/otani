"""
Otani Development Server
-----------------------
A simple Flask server for the Otani web application.

This module provides a convenient way to start the development server
with the appropriate host and port settings. It imports the Flask app
from app.py and runs it in debug mode.

Usage:
    python server.py

The server will start on host 0.0.0.0 (all interfaces) and port 5000.
Debug mode is enabled for development convenience.
"""

import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(__file__))

from app import app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
