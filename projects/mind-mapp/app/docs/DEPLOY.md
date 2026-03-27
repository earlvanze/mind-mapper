# Mind Mapp — Production Deployment Guide

## Overview

Mind Mapp is a static single-page application with no backend dependencies. All data is stored in browser localStorage. The build output can be served from any static hosting provider.

## Build Process

```bash
cd projects/mind-mapp/app
npm install
npm run build
```

The build creates an optimized production bundle in `dist/` with:
- Minified JavaScript and CSS
- Optimized assets (images, fonts)
- Source maps for debugging
- Service worker for offline support (if configured)

## Deployment Options

### 1. Netlify (Recommended)

**Automated deployment via Git:**

1. Push your repository to GitHub/GitLab
2. Connect to Netlify
3. Configure build settings:
   - Build command: `cd app && npm install && npm run build`
   - Publish directory: `app/dist`
   - Node version: 18+

**Manual deployment:**

```bash
npm install -g netlify-cli
cd projects/mind-mapp/app
npm run build
netlify deploy --prod --dir=dist
```

**Custom domain:**
- Configure DNS CNAME to point to Netlify
- Add custom domain in Netlify dashboard
- HTTPS is automatic with Let's Encrypt

### 2. Vercel

**Automated deployment:**

1. Install Vercel CLI: `npm install -g vercel`
2. Deploy:
   ```bash
   cd projects/mind-mapp/app
   vercel --prod
   ```

**Configuration (vercel.json):**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 3. GitHub Pages

**Setup:**

```bash
cd projects/mind-mapp/app
npm install --save-dev gh-pages
```

**Add to package.json scripts:**

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

**Deploy:**

```bash
npm run deploy
```

**Configure base path in vite.config.ts if using project pages:**

```typescript
export default defineConfig({
  base: '/mind-mapp/', // Replace with your repo name
  // ... rest of config
})
```

### 4. AWS S3 + CloudFront

**S3 Setup:**

```bash
# Build the app
npm run build

# Create S3 bucket
aws s3 mb s3://your-mindmapp-bucket

# Configure for static website hosting
aws s3 website s3://your-mindmapp-bucket --index-document index.html --error-document index.html

# Upload files
aws s3 sync dist/ s3://your-mindmapp-bucket --delete

# Set bucket policy for public access
aws s3api put-bucket-policy --bucket your-mindmapp-bucket --policy file://bucket-policy.json
```

**bucket-policy.json:**

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-mindmapp-bucket/*"
  }]
}
```

**CloudFront (CDN) Setup:**

1. Create CloudFront distribution
2. Set origin to S3 bucket
3. Configure default root object: `index.html`
4. Set error pages to redirect to `index.html` for SPA routing
5. Enable HTTPS with ACM certificate

### 5. Docker + Self-Hosted

**Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing: serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Build and run:**

```bash
docker build -t mind-mapp .
docker run -p 8080:80 mind-mapp
```

### 6. Simple Local Server (Testing)

```bash
cd projects/mind-mapp/app
npm run build
npx serve dist
```

Or with Python:

```bash
cd dist
python3 -m http.server 8000
```

## Environment Configuration

### Allowed Hosts (Development)

Control which hosts can access the dev server:

```bash
MINDMAPP_ALLOWED_HOSTS="example.com,cyber.earlco.in" npm run dev
```

Accepts comma/space-separated hostnames or full URLs.

### Production Environment Variables

Mind Mapp has no backend, but you can configure build-time variables in `.env.production`:

```bash
# Optional: Analytics tracking ID
VITE_ANALYTICS_ID=your-analytics-id

# Optional: Feature flags
VITE_ENABLE_TELEMETRY=false
```

## Post-Deployment Checklist

- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Verify localStorage persistence works
- [ ] Test export functions (PNG, PDF, JSON, Markdown, FreeMind)
- [ ] Verify keyboard shortcuts work correctly
- [ ] Check responsive layout on mobile/tablet
- [ ] Test touch gestures (pinch zoom, pan)
- [ ] Validate HTTPS certificate (if custom domain)
- [ ] Test with screen reader (accessibility)
- [ ] Monitor browser console for errors
- [ ] Check performance (Lighthouse score)

## Performance Optimization

### Build Optimizations

The production build includes:
- Code splitting for faster initial load
- Tree shaking to remove unused code
- Minification and compression
- Asset optimization (images, fonts)

### CDN Configuration

For best performance:
- Enable gzip/brotli compression
- Set appropriate cache headers
- Use HTTP/2 or HTTP/3
- Enable prefetching for key resources

### Monitoring

Recommended monitoring setup:
- **Error tracking:** Sentry, Rollbar
- **Analytics:** Google Analytics, Plausible
- **Performance:** Lighthouse CI, WebPageTest
- **Uptime:** UptimeRobot, Pingdom

## Security Considerations

### Content Security Policy (CSP)

Add CSP headers to prevent XSS attacks:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:
```

### HTTPS

Always serve over HTTPS:
- Free certificates from Let's Encrypt
- Automatic HTTPS on Netlify/Vercel
- CloudFront supports ACM certificates

### Data Privacy

Mind Mapp stores all data in browser localStorage:
- No server-side data storage
- No user tracking (unless you add analytics)
- No cookies or session management
- Export/import uses client-side only

See [SECURITY.md](./SECURITY.md) for detailed security notes.

## Troubleshooting

### Build Fails

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Blank Page After Deployment

- Check browser console for errors
- Verify `base` path in vite.config.ts matches deployment path
- Ensure server serves `index.html` for all routes (SPA routing)

### LocalStorage Not Working

- Check browser privacy settings
- Verify HTTPS (some browsers restrict localStorage on HTTP)
- Check for browser extensions blocking storage

### Performance Issues

- Enable gzip compression on server
- Use CDN for asset delivery
- Check browser DevTools Performance tab
- Run Lighthouse audit

## Continuous Deployment

### GitHub Actions Example

```yaml
name: Deploy to Netlify
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd app && npm ci && npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=app/dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Support

- Documentation: See [LINKS.md](./LINKS.md) for full doc index
- Issues: GitHub Issues
- Contributing: See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT License — see LICENSE file for details
