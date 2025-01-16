"""
Otani Development Server
-----------------------

A simple HTTP server for local development of the Otani web application.
This server provides:
- Static file serving
- Directory listing
- Support for HTML5 routing

Usage:
    python server.py

The server will start on http://localhost:5000/
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

def main():
    # Change to the project root directory
    os.chdir(os.path.dirname(__file__))

    # Create an HTTP server with the directory handler
    server_address = ('', 5000)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    print('Server running on http://localhost:5000/')

    # Start the server
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
        httpd.server_close()

if __name__ == '__main__':
    main()
