# Деплой SAGA на VPS (Ubuntu 22.04/24.04)

Полный путь: от чистого VPS до работающего сайта на домене.
Ориентировочное время: 30–60 минут.

## Что понадобится
- VPS (Ubuntu 22.04/24.04, минимум 2 ГБ RAM, 20 ГБ диска)
- Домен, DNS записи `A` → IP сервера (и `www` CNAME на апекс-домен)
- SSH-доступ под `root` или sudo-пользователем
- Репозиторий проекта на GitHub/GitLab (приватный — тогда настроим deploy key)

---

## 1. Подключение и базовая настройка сервера

```bash
ssh root@IP_СЕРВЕРА

# обновляемся
apt update && apt upgrade -y

# создаём нужные утилиты
apt install -y curl git nginx ufw build-essential

# Брандмауэр: открываем только SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## 2. Node.js 20 (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# проверяем
node -v     # должно быть v20.x
npm -v
```

## 3. PM2 (менеджер процессов)

```bash
npm install -g pm2

# настраиваем автозапуск при перезагрузке сервера
pm2 startup systemd
# команда выведет строку `env PATH=... pm2 startup systemd -u root --hp /root` —
# скопируй и выполни её
```

## 4. Клонирование проекта

```bash
# папка для сайтов
mkdir -p /var/www && cd /var/www

# приватный репозиторий → используем HTTPS с personal access token
# или добавляем deploy key в GitHub
git clone https://github.com/ТВОЙ-ЮЗЕРНЕЙМ/saga-new.git saga
cd saga
```

## 5. Конфигурация

```bash
# создаём .env из шаблона
cp .env.production.example .env
nano .env
```

Что поменять:
- `AUTH_SECRET` — сгенерировать случайную строку: `openssl rand -base64 32`
- `NEXTAUTH_URL` — `https://твой-домен.uz`
- `DATABASE_URL` — оставить `file:./prisma/prod.db`

## 6. Первый запуск

```bash
# делаем скрипт исполняемым
chmod +x deploy/deploy.sh

# устанавливаем зависимости, генерим Prisma, применяем миграции, собираем, запускаем
bash deploy/deploy.sh
```

После запуска:
```bash
pm2 status                # должен быть "online"
pm2 logs saga --lines 50  # проверяем что нет ошибок
curl http://127.0.0.1:3000   # должен вернуть HTML
```

## 7. Первый пользователь (админ)

Сидер создаёт админа с почтой `admin@saga.uz` и паролем `admin123`:

```bash
npx prisma db seed
```

⚠️ Сразу после заходи в /admin/users и смени пароль!

## 8. Nginx

```bash
# копируем конфиг
cp deploy/nginx.conf /etc/nginx/sites-available/saga

# ОБЯЗАТЕЛЬНО: замени в нём `saga-group.uz` на свой домен
nano /etc/nginx/sites-available/saga

# активируем
ln -s /etc/nginx/sites-available/saga /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default   # отключаем дефолтный сайт
nginx -t                              # проверка синтаксиса
systemctl reload nginx
```

Теперь по `http://ТВОЙ-ДОМЕН` должен открываться сайт.

## 9. SSL (HTTPS) через Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx

# сертификат на оба варианта домена
certbot --nginx -d твой-домен.uz -d www.твой-домен.uz

# certbot сам обновит nginx.conf на 443 порт и настроит auto-renew
```

Готово — сайт доступен по `https://`.

---

## Обновление после изменений в коде

Локально — `git push`. На сервере:

```bash
cd /var/www/saga
bash deploy/deploy.sh
```

Скрипт сам: подтянет изменения, обновит зависимости, применит миграции Prisma,
пересоберёт Next.js, скопирует статику и перезапустит PM2.

---

## Бэкап БД

SQLite — это обычный файл `prisma/prod.db`. Бэкап — просто копия.

```bash
# одноразовый бэкап
cp prisma/prod.db /root/backups/prod-$(date +%F).db

# cron: ежедневно в 3:00 ночи
crontab -e
```
Добавить строку:
```
0 3 * * * cp /var/www/saga/prisma/prod.db /root/backups/prod-$(date +\%F).db
```

Загрузки (папка `public/uploads/`) — бэкапить отдельно:
```
0 3 * * * tar -czf /root/backups/uploads-$(date +\%F).tar.gz -C /var/www/saga/public uploads
```

---

## Диагностика

**Сайт не открывается:**
- `pm2 status` — PM2 запущен?
- `pm2 logs saga` — есть ошибки?
- `curl http://127.0.0.1:3000` — Next отвечает локально?
- `systemctl status nginx` — Nginx работает?
- `tail -f /var/log/nginx/error.log` — ошибки Nginx

**502 Bad Gateway** — Next.js упал/не запущен. `pm2 restart saga`.

**Картинки из /uploads/ не грузятся** — проверь, что `public/uploads/` существует и имеет права 755.

**Миграция не применяется** — проверь `.env` и путь к БД:
```bash
npx prisma migrate status
```
