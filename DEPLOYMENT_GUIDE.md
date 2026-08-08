# 📋 Deployment Guide - Cloudflare AI Integration

**Last Updated**: 2026-08-08  
**Status**: ✅ Ready for Production

---

## 🚀 Deployment Options

### Option 1: Docker (Recommended)

#### Build & Run Local

```bash
# Build image
docker build -t web-pegawai:latest .

# Run container
docker run -p 3000:3000 \
  -e CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id \
  -e CLOUDFLARE_API_TOKEN=your_cloudflare_api_token \
  -e NODE_ENV=production \
  web-pegawai:latest
```

#### Using Docker Compose

```bash
docker-compose up -d
```

Update `docker-compose.yml` environment variables:
```yaml
services:
  app:
    environment:
      CLOUDFLARE_ACCOUNT_ID: your_cloudflare_account_id
      CLOUDFLARE_API_TOKEN: your_cloudflare_api_token
      NODE_ENV: production
      PORT: 3000
```

#### Docker Hub / Registry Push

```bash
# Build & tag
docker build -t yourusername/web-pegawai:latest .

# Push
docker push yourusername/web-pegawai:latest
```

---

### Option 2: Direct Node.js (VPS/Server)

#### Prerequisites
```bash
# Update system
sudo apt update && apt upgrade -y

# Install Node.js v22+
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Deploy

```bash
# Clone repository
git clone <your-repo-url>
cd web-pegawai-master

# Copy and update .env
cp nodejs/.env.example nodejs/.env
# Edit nodejs/.env with production values

# Install dependencies
cd nodejs
npm install --omit=dev

# Start with PM2
pm2 start app.js --name "web-pegawai"
pm2 save
pm2 startup

# Check status
pm2 logs web-pegawai
```

#### Update on New Releases
```bash
cd web-pegawai-master
git pull
cd nodejs
npm install --omit=dev
pm2 restart web-pegawai
```

---

### Option 3: Vercel/Netlify (Serverless)

Vercel config already present in `vercel.json`

```bash
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add CLOUDFLARE_ACCOUNT_ID
vercel env add CLOUDFLARE_API_TOKEN
vercel env add SESSION_SECRET

# Deploy again
vercel --prod
```

---

## 🔐 Security Checklist

### Pre-Deployment

- [ ] Change `SESSION_SECRET` to long random string
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] Verify credentials in `.env`
  ```bash
  # Check CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are set
  cat nodejs/.env | grep CLOUDFLARE
  ```

- [ ] Use HTTPS in production (not HTTP)
  - Configure reverse proxy (nginx, Apache)
  - Or use Vercel (automatic HTTPS)
  - Or use Cloudflare Pages

- [ ] Set up rate limiting
  - API rate limits: Check Cloudflare docs
  - Consider adding express-rate-limit

- [ ] Enable CORS properly
  - Only allow trusted origins
  - Don't use `*`

- [ ] Secure headers middleware (already present)
  ```
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  ```

---

## 📊 Monitoring & Logging

### Error Logs

```bash
# Docker
docker logs <container-id>

# PM2
pm2 logs web-pegawai

# Journalctl (systemd)
journalctl -u web-pegawai -f
```

### Performance Monitoring

Set up monitoring for:
- API response times (10-30s normal for AI)
- Cloudflare API usage
- Database query times
- Server memory/CPU

---

## 🔄 Backup & Recovery

### Database Backup

```bash
# SQLite backup
cp database.sqlite database.sqlite.backup

# Scheduled backup (cron)
0 2 * * * cp /path/to/database.sqlite /backups/database.sqlite.$(date +\%Y\%m\%d)
```

### Environment Backup

```bash
# Keep backup of .env (SECURE!)
gpg -c nodejs/.env  # Encrypt with password
```

---

## 🚨 Troubleshooting

### Server won't start

```bash
# Check port 3000 is available
lsof -i :3000
sudo kill -9 <PID>

# Check Node version
node -v  # Should be v22+

# Check environment
cat nodejs/.env
```

### Cloudflare API errors

```bash
# Test token
curl -H "Authorization: Bearer <token>" \
  https://api.cloudflare.com/client/v4/accounts/<account-id>/tokens/verify

# Check token permissions (should have Workers AI Read/Write)
```

### Database errors

```bash
# Check SQLite file exists
ls -la database.sqlite

# Check permissions
chmod 664 database.sqlite
```

### High response times

- Normal for AI (10-30s)
- Check Cloudflare API status
- Consider caching results
- Monitor rate limits

---

## 📈 Performance Tips

1. **Cache AI Results**
   - Store results for 1-24 hours
   - Reduce API calls

2. **Batch Operations**
   - Use `/full-report` instead of multiple calls
   - Schedule during off-peak hours

3. **Database Optimization**
   - Add indexes if many rows
   - Archive old data

4. **Load Balancing**
   - Use nginx/Apache reverse proxy
   - Multiple Node instances

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '22'
      
      - name: Install
        run: npm install --omit=dev
        working-directory: nodejs
      
      - name: Test
        run: npm test
        working-directory: nodejs
      
      - name: Deploy to Docker Hub
        run: |
          docker build -t username/web-pegawai:latest .
          docker push username/web-pegawai:latest
```

---

## 📞 Support

- Check logs: `pm2 logs` or `docker logs`
- Review docs: `CLOUDFLARE_AI_DOCS.md`
- Test endpoints: `node test-cf.js`
- API test: `node test-endpoints.js`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-08-08 | Initial Cloudflare AI integration |

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-08-08
