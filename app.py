from flask import Flask, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def login():
    return send_from_directory('html', 'login.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
