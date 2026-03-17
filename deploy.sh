#!/bin/bash
set -e
SERVER="ubuntu@54.213.59.245"
REMOTE="~/scratch"
KEY="$HOME/Dropbox/Sys/aws/scratch.pem"
SSH="ssh -i $KEY"
RSYNC="rsync -az -e \"ssh -i $KEY\""

echo "Building frontend..."
cd frontend && npm run build && cd ..

echo "Provisioning remote directories..."
$SSH $SERVER "mkdir -p $REMOTE/frontend/dist $REMOTE/backend $REMOTE/nginx $REMOTE/data"

echo "Syncing to server..."
eval "$RSYNC --delete frontend/dist/ $SERVER:$REMOTE/frontend/dist/"
eval "$RSYNC --exclude='.venv' --exclude='__pycache__' --exclude='*.db' backend/ $SERVER:$REMOTE/backend/"
eval "$RSYNC nginx/nginx.conf $SERVER:$REMOTE/nginx/"
eval "$RSYNC docker-compose.yml $SERVER:$REMOTE/"
eval "$RSYNC delete.py backfill.py $SERVER:$REMOTE/"

if [ -f ".env" ]; then
  echo "Syncing .env to server..."
  eval "$RSYNC .env $SERVER:$REMOTE/.env"
else
  echo "Warning: no local .env file found — make sure one exists on the server."
fi

echo "Restarting services..."
$SSH $SERVER "cd $REMOTE && docker compose up -d --build api web"
echo "Done."
