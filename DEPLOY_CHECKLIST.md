# Azure Static Web Apps Deployment Checklist

## Pre-Deployment
- [ ] Verify build works locally: `npm run build`
- [ ] Check `dist/public/` contains all necessary files
- [ ] Ensure `staticwebapp.config.json` is in project root

## Azure Static Web Apps Setup
1. [ ] Create Azure Static Web App resource
2. [ ] Connect to GitHub repository
3. [ ] Set build configuration:
   - **Build command**: `npm run build`
   - **App location**: `/` (root)
   - **Output location**: `dist/public`
   - **Skip app build**: No

## Deployment Configuration
- [ ] Verify GitHub Actions workflow is created
- [ ] Check deployment logs for any errors
- [ ] Test deployment URL

## Post-Deployment Verification
- [ ] Homepage loads correctly
- [ ] All 23 royal portraits display
- [ ] Family tree renders properly
- [ ] Language switching (Swedish/English) works
- [ ] Navigation between sections works
- [ ] Images and assets load correctly
- [ ] Mobile responsiveness works

## Performance Check
- [ ] Page load time < 3 seconds
- [ ] Images load quickly
- [ ] No console errors
- [ ] Proper caching headers applied

## Troubleshooting Common Issues

### Assets Not Loading
- Check that files are in `dist/public/assets/` directory
- Verify Azure serves files from root correctly

### Routing Issues
- Ensure `staticwebapp.config.json` has proper fallback configuration
- Check that SPA routing works for all page refreshes

### Build Failures
- Verify all dependencies are in `package.json`
- Check Node.js version compatibility (18+)
- Ensure no TypeScript errors

## Success Criteria
✅ All family portraits display correctly
✅ Interactive family tree works
✅ Bilingual content switches properly
✅ Responsive design works on mobile
✅ Fast loading performance
✅ No console errors
✅ SEO meta tags present