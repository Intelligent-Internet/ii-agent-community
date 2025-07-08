# Deployment Guide - Enhanced Google Docs Clone

This guide covers various deployment options for the Enhanced Google Docs Clone application.

## 🚀 Quick Deployment Options

### 1. Local Production Build

```bash
# Build and start production server
npm run build
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "enhanced-docs" -- start
```

### 2. Docker Deployment

```bash
# Build and run with Docker
docker build -t enhanced-docs .
docker run -p 3000:3000 --env-file .env.local enhanced-docs

# Or use Docker Compose
docker-compose up -d
```

### 3. Platform Deployments

Choose based on your needs and platform support for WebSockets:

| Platform | WebSocket Support | Recommended |
|----------|-------------------|-------------|
| Railway | ✅ Yes | ✅ Recommended |
| Render | ✅ Yes | ✅ Recommended |
| DigitalOcean App Platform | ✅ Yes | ✅ Recommended |
| Heroku | ✅ Yes | ✅ Good |
| Vercel | ❌ No | ❌ Not suitable* |
| Netlify | ❌ No | ❌ Not suitable* |

*Real-time collaboration features won't work without WebSocket support.

## 🔧 Environment Variables for Production

Create these environment variables in your deployment platform:

```env
NODE_ENV=production
OPENAI_API_KEY=your_production_openai_key
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_secure_random_string
```

## 📋 Platform-Specific Deployment Instructions

### Railway

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Environment Variables**
   ```
   OPENAI_API_KEY=your_openai_key
   NEXTAUTH_URL=https://your-app.railway.app
   NEXTAUTH_SECRET=your_secret
   NODE_ENV=production
   ```

3. **Deploy**
   - Railway will automatically build and deploy
   - Your app will be available at `https://your-app.railway.app`

### Render

1. **Create Web Service**
   - Go to [Render](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```
   Build Command: npm run build
   Start Command: npm start
   ```

3. **Environment Variables**
   ```
   OPENAI_API_KEY=your_openai_key
   NEXTAUTH_URL=https://your-app.onrender.com
   NEXTAUTH_SECRET=your_secret
   NODE_ENV=production
   ```

### DigitalOcean App Platform

1. **Create App**
   - Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository

2. **Configure App**
   ```yaml
   name: enhanced-docs
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/enhanced-docs
       branch: main
     run_command: npm start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: OPENAI_API_KEY
       value: your_openai_key
     - key: NEXTAUTH_URL
       value: https://your-app.ondigitalocean.app
     - key: NEXTAUTH_SECRET
       value: your_secret
     - key: NODE_ENV
       value: production
   ```

### Heroku

1. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set OPENAI_API_KEY=your_openai_key
   heroku config:set NEXTAUTH_URL=https://your-app.herokuapp.com
   heroku config:set NEXTAUTH_SECRET=your_secret
   heroku config:set NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

## 🐳 Docker Production Deployment

### Basic Docker Deployment

```bash
# Build the image
docker build -t enhanced-docs .

# Run the container
docker run -d \
  --name enhanced-docs \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your_openai_key \
  -e NEXTAUTH_URL=https://yourdomain.com \
  -e NEXTAUTH_SECRET=your_secret \
  -e NODE_ENV=production \
  enhanced-docs
```

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  enhanced-docs:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - enhanced-docs
    restart: unless-stopped
```

### Nginx Configuration (Optional)

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server enhanced-docs:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket support for Socket.io
        location /socket.io/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use strong, random values for `NEXTAUTH_SECRET`
- Rotate API keys regularly
- Use different API keys for development and production

### HTTPS
- Always use HTTPS in production
- Configure SSL certificates
- Update `NEXTAUTH_URL` to use `https://`

### CORS
- Configure CORS properly for your domain
- Restrict origins in production

## 📊 Monitoring and Health Checks

### Health Check Endpoint
The application includes a health check endpoint at `/api/health`:

```bash
curl https://yourdomain.com/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "features": {
    "ai": true,
    "realtime": true
  }
}
```

### Monitoring Setup
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor application logs
- Set up error tracking (Sentry)
- Monitor API usage and costs

## 🚨 Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Clear cache and rebuild
npm run clean:all
npm run build
```

#### WebSocket Connection Issues
- Ensure your platform supports WebSockets
- Check firewall settings
- Verify proxy configuration for Socket.io

#### Environment Variable Issues
- Verify all required variables are set
- Check variable names (case-sensitive)
- Restart application after changes

#### Performance Issues
- Monitor memory usage
- Check for memory leaks
- Scale horizontally if needed

### Logs and Debugging
```bash
# Docker logs
docker logs enhanced-docs

# PM2 logs
pm2 logs enhanced-docs

# Application logs
tail -f /var/log/enhanced-docs.log
```

## 📈 Scaling

### Horizontal Scaling
- Use load balancer
- Configure sticky sessions for Socket.io
- Consider Redis adapter for Socket.io

### Vertical Scaling
- Monitor resource usage
- Increase memory/CPU as needed
- Optimize bundle size

### Database Scaling
- If adding database features
- Use connection pooling
- Consider read replicas

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Railway
        uses: railway-app/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review platform-specific documentation
3. Check application logs
4. Create an issue with deployment details

---

**Happy deploying! 🚀**