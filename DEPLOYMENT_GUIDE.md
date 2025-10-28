# ERCS Dashboard - Local Server Deployment Guide

Complete guide for deploying the ERCS Intel Dashboard on an Ubuntu server with two scenarios: keeping Firebase (recommended) or migrating to MongoDB.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Scenario A: Deploy with Firebase (Recommended)](#scenario-a-deploy-with-firebase-recommended)
4. [Scenario B: Deploy with MongoDB Migration](#scenario-b-deploy-with-mongodb-migration)
5. [SSL/HTTPS Configuration](#ssl-https-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Server Requirements

**Minimum Specifications**:
- **OS**: Ubuntu 22.04 LTS or 24.04 LTS
- **CPU**: 2 cores
- **RAM**: 8GB (4GB for Firebase scenario, 8GB for MongoDB)
- **Storage**: 40GB SSD (20GB for Firebase, 40GB for MongoDB)
- **Network**: Static IP address, ports 80 and 443 open

### Required Credentials

**Firebase Credentials** (for both scenarios initially):
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Google AI Credentials**:
```
GOOGLE_API_KEY=your-gemini-api-key
```

**KoBoToolbox Credentials** (optional):
```
KOBO_SERVER=https://kobo.ifrc.org
KOBO_API_KEY=your-kobo-token
KOBO_ASSET_UID=your-form-asset-uid
```

**Admin Credentials**:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

---

## Server Setup

### Step 1: Initial Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential ufw

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Step 2: Install Node.js

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install PM2 globally (process manager)
sudo npm install -g pm2
```

### Step 3: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

---

## Scenario A: Deploy with Firebase (Recommended)

This scenario keeps your existing Firebase Firestore database and only hosts the application locally.

### A1: Clone and Setup Application

```bash
# Navigate to deployment directory
cd /var/www

# Clone your repository
sudo git clone https://github.com/cookiemp/eoc-dashboard.git
sudo chown -R $USER:$USER eoc-dashboard
cd eoc-dashboard

# Install dependencies (takes 5-10 minutes)
npm install
```

### A2: Configure Environment Variables

```bash
# Create production environment file
nano .env.local
```

**Paste the following** (replace with your actual values):

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# Google AI (Gemini)
GOOGLE_API_KEY=your-gemini-api-key

# KoBoToolbox (optional)
KOBO_SERVER=https://kobo.ifrc.org
KOBO_API_KEY=your-kobo-api-token
KOBO_ASSET_UID=your-form-asset-uid

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Production Settings
NODE_ENV=production
PORT=3000
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

### A3: Build the Application

```bash
# Build for production (takes 5-10 minutes)
npm run build

# You should see "Compiled successfully" at the end
```

### A4: Start with PM2

```bash
# Start the application
pm2 start npm --name "eoc-dashboard" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Copy and run the command it outputs

# Check application status
pm2 status

# View logs
pm2 logs eoc-dashboard
```

### A5: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/eoc-dashboard
```

**Paste the following**:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or server IP

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase max body size for PDF uploads
    client_max_body_size 50M;
}
```

**Save and exit**: `Ctrl+X`, `Y`, `Enter`

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/eoc-dashboard /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### A6: Test Deployment

```bash
# Check if app is running
curl http://localhost:3000

# Check through Nginx
curl http://localhost

# View application logs
pm2 logs eoc-dashboard --lines 50
```

**Access your application**: Open browser at `http://your-server-ip` or `http://your-domain.com`

---

## Scenario B: Deploy with MongoDB Migration

This scenario migrates your data from Firebase to a local MongoDB instance.

### B1: Export Data from Firebase

**On your local machine** (before server deployment):

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Export Firestore data
firebase firestore:export ./firestore-backup --project your-project-id

# Compress for transfer
tar -czf firestore-backup.tar.gz firestore-backup/

# Transfer to server
scp firestore-backup.tar.gz user@your-server-ip:~/
```

### B2: Install MongoDB on Server

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
sudo systemctl status mongod
```

### B3: Configure MongoDB Security

```bash
# Connect to MongoDB
mongosh

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "your-secure-admin-password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Create app database and user
use ercs_dashboard
db.createUser({
  user: "ercs_app",
  pwd: "your-secure-app-password",
  roles: [ { role: "readWrite", db: "ercs_dashboard" } ]
})

exit
```

### B4: Import Data to MongoDB

See separate file `MONGODB_MIGRATION.md` for detailed code migration steps.

### B5: Deploy Application

Follow steps A1-A6 from Scenario A, but use this `.env.local`:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://ercs_app:your-password@localhost:27017/ercs_dashboard

# Google AI (Gemini)
GOOGLE_API_KEY=your-gemini-api-key

# KoBoToolbox (optional)
KOBO_SERVER=https://kobo.ifrc.org
KOBO_API_KEY=your-kobo-api-token
KOBO_ASSET_UID=your-form-asset-uid

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Production Settings
NODE_ENV=production
PORT=3000
```

---

## SSL/HTTPS Configuration

### Install and Configure SSL

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (make sure domain points to server first!)
sudo certbot --nginx -d your-domain.com

# Follow prompts and choose to redirect HTTP to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Monitoring & Maintenance

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs eoc-dashboard

# Restart app
pm2 restart eoc-dashboard

# Monitor resources
pm2 monit
```

### System Monitoring

```bash
# Check disk usage
df -h

# Check memory
free -h

# Check CPU
top

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Update Application

```bash
cd /var/www/eoc-dashboard
git pull origin main
npm install
npm run build
pm2 restart eoc-dashboard
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs eoc-dashboard --err

# Check port 3000
sudo lsof -i :3000

# Restart
pm2 restart eoc-dashboard
```

### Nginx Issues

```bash
# Test config
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart
sudo systemctl restart nginx
```

### MongoDB Issues (Scenario B)

```bash
# Check status
sudo systemctl status mongod

# View logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart
sudo systemctl restart mongod
```

---

## Quick Reference

### Daily Operations
```bash
pm2 status                    # Check app status
pm2 logs eoc-dashboard        # View logs
df -h                         # Check disk space
```

### Weekly Maintenance
```bash
sudo apt update && sudo apt upgrade -y    # Update system
pm2 logs eoc-dashboard --err --lines 100  # Check errors
sudo certbot certificates                 # Check SSL expiry
```

### Monthly Tasks
```bash
cd /var/www/eoc-dashboard
npm outdated                  # Check for updates
npm update                    # Update packages
npm run build                 # Rebuild
pm2 restart eoc-dashboard     # Restart app
```

---

For MongoDB-specific migration code changes, see `MONGODB_MIGRATION.md`
