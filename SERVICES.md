# Services & Infrastructure

## aops.studio (Web Platform)

### SSL Issue — Cloudflare + Hostinger

**Problem:** SSL certificate errors with Cloudflare Flexible SSL on aops.studio (hosted on Hostinger).

**Root Cause:** Flexible SSL means Cloudflare→Browser is encrypted, but Cloudflare→Hostinger is HTTP. If Hostinger redirects HTTP→HTTPS, you get a redirect loop.

**Fix — Option A: Switch to Full (Strict) SSL (Recommended)**
1. Cloudflare Dashboard → SSL/TLS → Overview
2. Set mode: **Flexible → Full (strict)**
3. Ensure Hostinger has a valid SSL cert (Hostinger hPanel → Security → SSL)
4. If no cert on Hostinger, install Let's Encrypt free cert first

**Fix — Option B: Keep Flexible, Remove HTTPS Redirect on Hostinger**
1. Hostinger hPanel → File Manager → public_html/.htaccess
2. Remove any `RewriteEngine On` + `RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI}` rules
3. Keep Cloudflare on Flexible

**Fix — Option C: Reinstall Let's Encrypt on Hostinger**
1. Hostinger hPanel → Security → SSL
2. Remove existing cert if broken
3. Install "Lifetime SSL" (Let's Encrypt) for aops.studio
4. Switch Cloudflare to Full (strict)

**Verification:**
```bash
# Check certificate
openssl s_client -connect aops.studio:443 -servername aops.studio </dev/null 2>/dev/null | openssl x509 -noout -dates

# Check redirect chain
curl -I https://aops.studio
```

**No credentials for Cloudflare/Hostinger in this workspace.** Earl needs to execute from his browser.

