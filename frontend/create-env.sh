#!/bin/bash

# Create .env file from .env.example if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env file created from .env.example"
    echo "Please update the .env file with your actual values"
else
    echo ".env file already exists"
fi

