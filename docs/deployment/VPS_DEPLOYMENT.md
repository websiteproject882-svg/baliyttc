# Bali YTTC VPS Deployment

This is the target production deployment flow after staging is complete.

## VPS Requirements

- Ubuntu 22.04 or 24.04
- 4 GB RAM minimum, 8 GB preferred for production builds
- Docker + Docker Compose
- Nginx or Caddy as the public reverse proxy
- Cloudflare DNS in front of the VPS

## First Deploy

1. Clone the repo on the VPS.

```bash
git clone <repo-url> baliyytc
cd baliyytc
```

2. Create production env.

```bash
cp .env.production.example .env.production
nano .env.production
```

3. Build and start services.

```bash
docker compose -f docker-compose.vps.yml up -d --build
```

4. Run database migrations.

```bash
docker compose -f docker-compose.vps.yml exec app npm run db:migrate:deploy
```

5. Optional seed for first staging check only.

```bash
docker compose -f docker-compose.vps.yml exec app npm run db:seed
```

Do not seed over real production data.

## Nginx Reverse Proxy

Point Nginx to the app container on port `3000`.

```nginx
server {
  server_name baliyttc.com www.baliyttc.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Use Certbot or Cloudflare Full SSL once DNS is pointed.

## Backups

Daily Postgres backup:

```bash
docker compose -f docker-compose.vps.yml exec postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "backup-$(date +%F).sql"
```

Store backups outside the VPS as well.

## Updates

```bash
git pull
docker compose -f docker-compose.vps.yml up -d --build
docker compose -f docker-compose.vps.yml exec app npm run db:migrate:deploy
```

## Cron Jobs

The app exposes `/api/cron/communications`.

Run from Linux cron after `CRON_SECRET` is configured:

```bash
0 8 * * * curl -X POST https://baliyttc.com/api/cron/communications -H "Authorization: Bearer YOUR_CRON_SECRET" -H "Content-Type: application/json" -d '{}'
```

## Health Check

Use:

```bash
curl https://baliyttc.com/api/health
```
