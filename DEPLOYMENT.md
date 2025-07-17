# External Deployment Guide

This guide covers deploying the Gyllencreutz Family Heritage Website to external platforms like Azure Static Web Apps, Netlify, Vercel, or GitHub Pages.

## Quick Start

### 1. Build the Frontend
```bash
npm run build
```

This creates a production-ready build in `dist/public/` with:
- Bundled JavaScript (`assets/index-*.js`)
- CSS (`assets/index-*.css`)
- All images and assets with hashed filenames
- Proper `index.html` with Vite-injected script references

### 2. Deploy Static Files Only
For static hosting platforms, deploy only the `dist/public/` directory contents.

## Platform-Specific Instructions

### Azure Static Web Apps

1. **Build Configuration**
   - Source: `dist/public/`
   - Build command: `npm run build`
   - Output location: `dist/public`
   - API location: `functions` (for Azure Functions)

2. **Azure Static Web Apps Configuration File**
   Create `staticwebapp.config.json` in the root:
   ```json
   {
     "navigationFallback": {
       "rewrite": "/index.html"
     },
     "mimeTypes": {
       ".js": "text/javascript",
       ".css": "text/css",
       ".jpg": "image/jpeg",
       ".png": "image/png",
       ".svg": "image/svg+xml"
     },
     "globalHeaders": {
       "Cache-Control": "public, max-age=31536000, immutable"
     },
     "routes": [
       {
         "route": "/assets/*",
         "headers": {
           "Cache-Control": "public, max-age=31536000, immutable"
         }
       }
     ]
   }
   ```

3. **Build Pipeline**
   Azure auto-generates a GitHub Action, but you need to update it for your project structure:
   
   **Key Configuration Values to Update:**
   - **App location**: `/` (root directory)
   - **API location**: `functions` (for Azure Functions backend)
   - **Output location**: `dist/public`
   - **Skip app build**: `true` (we build manually)
   - **Build command**: `npm run build` (runs at root level)
   
   Apply these settings to the Azure-generated workflow directly in GitHub.

### Netlify

1. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist/public`

2. **Netlify Configuration**
   Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist/public"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Vercel

1. **Build Settings**
   - Build command: `npm run build`
   - Output directory: `dist/public`

2. **Vercel Configuration**
   Create `vercel.json`:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist/public",
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### GitHub Pages

1. **Build and Deploy Action**
   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Setup Node
           uses: actions/setup-node@v2
           with:
             node-version: '18'
         - name: Install and Build
           run: |
             npm ci
             npm run build
         - name: Deploy
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist/public
   ```

## Important Notes

### Frontend-Only Deployment
Since this is a React SPA (Single Page Application), you only need to deploy the frontend build. The current implementation uses:
- In-memory storage for family data
- No external APIs required
- All data loaded from static JSON files

### Family Data
The family genealogy data is embedded in the application build, so no external database is needed for basic functionality.

### Assets
All royal portraits and heraldic images are bundled with the application and will be available at `/assets/` paths with hashed filenames for optimal caching.

### Browser Compatibility
The build includes modern JavaScript that works in all contemporary browsers. The bundled files are optimized for production with proper minification and tree-shaking.

## Troubleshooting

### Common Issues

1. **Assets not loading**: Ensure the deployment platform serves files from the `dist/public` directory as the web root.

2. **Routing issues**: Configure your platform to serve `index.html` for all routes (SPA fallback).

3. **Cache issues**: The assets have hashed filenames, so cache invalidation should work automatically.

### Verification
After deployment, verify:
- [ ] Homepage loads correctly
- [ ] Family tree displays with all portraits
- [ ] Language switching works
- [ ] All royal portraits display correctly
- [ ] Navigation between sections works

## Performance Optimization

The production build includes:
- ✅ Code splitting and tree-shaking
- ✅ Asset optimization and hashing
- ✅ CSS minification
- ✅ Image optimization
- ✅ Gzip compression ready

The total bundle size is approximately:
- JavaScript: ~316 KB (99 KB gzipped)
- CSS: ~65 KB (12 KB gzipped)
- Images: ~1.4 MB (all royal portraits and heraldic symbols)

## Need Server-Side Features?

If you later need server-side functionality (database, APIs, authentication), you can:
1. Deploy the frontend as above
2. Deploy the backend separately to a service like Railway, Render, or Heroku
3. Update the API endpoints in the frontend to point to your backend service

The codebase is already structured to support this separation.