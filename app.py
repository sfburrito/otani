from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__, static_folder='.')

@app.route('/')
def login():
    return send_from_directory('.', 'html/login.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
