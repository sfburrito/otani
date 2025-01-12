#!/bin/bash

# Initialize the database
python init_db.py

# Start Gunicorn
gunicorn app:app
