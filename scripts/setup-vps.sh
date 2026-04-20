#!/bin/bash
# ============================================================
# SMAVO VPS Setup Script
# VPS: 72.61.140.193 | Domain: smavo.vertinova.id
# Run as root on the VPS: bash setup-vps.sh
# ============================================================

set -e

DOMAIN="smavo.vertinova.id"
APP_DIR="/opt/smavo"
EMAIL="admin@vertinova.id"   # <- ganti dengan email Anda

echo "======================================"
echo " SMAVO VPS Setup - $DOMAIN"
echo "======================================"

# 1. Update system
echo "[1/6] Updating system..."
apt-get update -y && apt-get upgrade -y

# 2. Install Docker
echo "[2/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# 3. Install Docker Compose plugin
echo "[3/6] Installing Docker Compose..."
if ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

# 4. Clone repository
echo "[4/6] Cloning repository..."
if [ ! -d "$APP_DIR/.git" ]; then
    git clone https://github.com/vertinova/smavo.git $APP_DIR
else
    cd $APP_DIR && git pull origin main
fi

# 5. Create .env file
echo "[5/6] Creating .env file..."
cd $APP_DIR
if [ ! -f ".env" ]; then
    cp .env.example .env
    POSTGRES_PASSWORD=$(openssl rand -hex 16)
    JWT_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
    sed -i "s/GANTI_DENGAN_PASSWORD_KUAT/$POSTGRES_PASSWORD/" .env
    sed -i "s/GANTI_DENGAN_RANDOM_64_KARAKTER\.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/GANTI_DENGAN_RANDOM_64_KARAKTER_BERBEDA/$JWT_REFRESH_SECRET/" .env
    echo ""
    echo ">>> .env dibuat. Simpan credentials berikut:"
    cat .env
    echo ""
fi

# Open firewall ports
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
fi

# 6. Issue SSL certificate
echo "[6/6] Requesting SSL certificate..."
echo ""
echo "PENTING: Pastikan DNS record berikut sudah aktif:"
echo "  A record: $DOMAIN -> 72.61.140.193"
echo ""
echo "Tekan Enter jika DNS sudah aktif, Ctrl+C untuk skip SSL..."
read -r

# Jalankan nginx sementara untuk certbot challenge
docker run -d --name smavo-nginx-init \
    -p 80:80 \
    -v smavo_certbot-www:/var/www/certbot \
    nginx:alpine \
    sh -c 'mkdir -p /var/www/certbot && nginx -g "daemon off;"' || true

sleep 3

# Request certificate
docker run --rm \
    -v smavo_certbot-www:/var/www/certbot \
    -v smavo_certbot-conf:/etc/letsencrypt \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

docker stop smavo-nginx-init && docker rm smavo-nginx-init || true

echo ">>> SSL certificate berhasil!"

# Deploy aplikasi
cd $APP_DIR
docker compose up -d --build

echo ""
echo "======================================"
echo " Setup selesai!"
echo " Akses: https://$DOMAIN"
echo "======================================"
echo ""
echo "=== Setup GitHub Actions Secrets ==="
echo "Pergi ke: https://github.com/vertinova/smavo/settings/secrets/actions"
echo "Tambahkan 3 secret berikut:"
echo "  VPS_HOST     = 72.61.140.193"
echo "  VPS_USER     = root"
echo "  VPS_PASSWORD = (password root VPS Anda)"
echo ""
echo "Setelah itu setiap git push ke main akan auto-deploy!"
