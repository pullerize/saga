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

# Схема ведётся через db push (аддитивно), а не миграции: prod.db уже содержит
# таблицы, которых нет в prisma/migrations. db push добавит недостающие
# таблицы/колонки (GuestLead, CompanyPrice, showrooms, referralSource и т.д.),
# сохраняя данные. Без --accept-data-loss — только безопасные аддитивные правки.
echo "==> prisma db push"
npx prisma db push --skip-generate

echo "==> next build"
npm run build

# Standalone бандл не включает public/ и .next/static/ — копируем их рядом,
# чтобы Nginx + standalone server нашли ассеты.
echo "==> copy public & static into .next/standalone"
cp -r public .next/standalone/public
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static

# Убедиться, что каталог загрузок существует и доступен для записи.
# Рантайм пишет файлы в ./public/uploads (cwd процесса). А standalone-сервер
# отдаёт статику из .next/standalone/public — поэтому НЕ копируем uploads, а
# делаем symlink на единый каталог, иначе новые загрузки будут 404.
mkdir -p public/uploads
chmod 755 public/uploads
rm -rf .next/standalone/public/uploads
ln -s "$(pwd)/public/uploads" .next/standalone/public/uploads

echo "==> pm2 restart saga"
if pm2 describe saga >/dev/null 2>&1; then
  pm2 reload saga
else
  pm2 start ecosystem.config.cjs
  pm2 save
fi

echo "==> done. логи: pm2 logs saga"
