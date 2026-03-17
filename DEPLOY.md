# Deployment Guide

## Server

- **Provider:** AWS Lightsail
- **Static IP:** 54.213.59.245
- **Domain:** scratch.andykee.com
- **SSH key:** `~/Dropbox/Sys/aws/scratch.pem`

## First-Time Server Setup

### 1. SSH in

```bash
ssh -i ~/Dropbox/Sys/aws/scratch.pem ubuntu@54.213.59.245
```

### 2. Configure swap space

```bash
# first check if any
swapon -s

# then add some if not
sudo fallocate -l 1G /swapfile 
sudo chmod 600 /swapfile 
sudo mkswap /swapfile 
sudo swapon /swapfile 
sudo cp /etc/fstab /etc/fstab.bak 
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Source - https://stackoverflow.com/a/67925555
# Posted by JimJty
# Retrieved 2026-03-17, License - CC BY-SA 4.0
```

### 3. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker
```

### 4. Open firewall ports

In AWS Lightsail → instance → **Networking** tab, add rules for:
- HTTP (80)
- HTTPS (443)

### 5. Get SSL certificate

```bash
sudo apt install certbot -y
sudo certbot certonly --standalone -d scratch.andykee.com
```

Certs are written to `/etc/letsencrypt/live/scratch.andykee.com/` and mounted into the nginx container automatically via `docker-compose.yml`.

### 6. Set up cert auto-renewal

```bash
sudo crontab -e
```

Add:

```
0 0 1 * * certbot renew --pre-hook "docker compose -f /home/ubuntu/scratch/docker-compose.yml stop web" --post-hook "docker compose -f /home/ubuntu/scratch/docker-compose.yml start web"
```

The hooks stop nginx before renewal (so port 80 is free) and restart it after so the new cert is picked up.

## Deploying

From your local machine:

```bash
./deploy.sh
```

This will:
1. Build the frontend
2. Rsync frontend dist, backend, nginx config, and docker-compose.yml to the server
3. Run `docker compose up -d --build` on the server
