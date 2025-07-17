# HTML File Management

This project uses a three-file approach to manage index.html for both development and production environments.

## File Structure

```
client/
├── index.dev.html     # Development version (for Replit)
├── index.prod.html    # Production version (Vite-compatible)
├── index.html         # Working version (overwritten by CI)
```

## File Descriptions

### `index.dev.html` - Development Version
- Contains `<script type="module" src="/src/main.tsx"></script>`
- Used for development in Replit
- Allows direct TypeScript execution via Vite dev server

### `index.prod.html` - Production Version
- **NO** script tag referencing `/src/main.tsx`
- Vite will inject the bundled JavaScript and CSS during build
- Ready for external deployment platforms

### `index.html` - Working Version
- Gets overwritten by CI build process
- Should not be edited directly
- Always copied from either `.dev.html` or `.prod.html` during build

## Development Workflow

### Making Changes to HTML
1. **Always update all three files** when making HTML changes
2. Ensure `index.dev.html` includes the script tag
3. Ensure `index.prod.html` excludes the script tag
4. Keep all other content (meta tags, title, etc.) identical

### Key Differences
The **only** difference between `.dev.html` and `.prod.html` should be:

**Development version includes:**
```html
<script type="module" src="/src/main.tsx"></script>
```

**Production version excludes this line completely**

## CI/CD Integration

Your GitHub Actions workflow should copy the appropriate version:

```yaml
# For production deployment
- name: Prepare production HTML
  run: cp client/index.prod.html client/index.html

# Then run build
- name: Build
  run: npm run build
```

## Maintenance Rules

1. **Never edit `index.html` directly** - it gets overwritten
2. **Always maintain consistency** between `.dev.html` and `.prod.html`
3. **Test both versions** - development in Replit, production via build
4. **Keep script tag as the only difference** between versions

## Why This Approach?

- **Replit Development**: Needs direct TypeScript execution
- **External Deployment**: Requires Vite to inject bundled assets
- **Consistency**: Maintains identical HTML structure for both environments
- **Automation**: CI handles the switching automatically