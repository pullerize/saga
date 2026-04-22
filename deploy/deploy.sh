#!/usr/bin/env bash
# Скрипт первого/обновляющего деплоя на VPS.
# Запускать из корня проекта (/var/www/saga):  bash deploy/deploy.sh
set -euo pipefail

echo "==> git pull"
git pull --ff-only

echo "==> npm ci"
npm ci --omit=dev=false

echo "==> prisma generate"
npx prisma generate

echo "==> prisma migrate deploy"
npx prisma migrate deploy

echo "==> next build"
npm run build

# Standalone бандл не включает public/ и .next/static/ — копируем их рядом,
# чтобы Nginx + standalone server нашли ассеты.
echo "==> copy public & static into .next/standalone"
cp -r public .next/standalone/public
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static

# Убедиться, что каталог загрузок существует и доступен для записи
mkdir -p public/uploads
chmod 755 public/uploads

echo "==> pm2 restart saga"
if pm2 describe saga >/dev/null 2>&1; then
  pm2 reload saga
else
  pm2 start ecosystem.config.cjs
  pm2 save
fi

echo "==> done. логи: pm2 logs saga"
