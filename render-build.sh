#!/bin/bash
# Install Chrome dependencies for Puppeteer
apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libnss3 \
    libxcomposite1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends
