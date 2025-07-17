# Azure Functions Development Guide

This project now supports both Express API (for Replit development) and Azure Functions (for Azure Static Web Apps deployment).

## Development Setup

### Current Structure
```
├── server/                    # Express API (Replit development)
├── functions/                 # Azure Functions (Azure deployment)
│   ├── host.json             # Functions runtime configuration
│   ├── local.settings.json   # Local development settings
│   ├── package.json          # Functions-specific dependencies
│   ├── data/                 # JSON data files
│   │   └── family-members.json  # Family genealogy data
│   ├── family-members/       # GET /api/family-members
│   │   └── main.js           # Function implementation (v4 model)
│   ├── family-members-search/ # GET /api/family-members/search/{query}
│   │   └── main.js           # Function implementation (v4 model)
│   ├── debug-deployment/     # GET /api/debug-deployment
│   │   └── main.js           # Deployment debugging endpoint
│   └── shared/               # Shared storage logic
│       └── storage.js        # Data loading and search logic
└── client/                   # React frontend
```

### Running Azure Functions Locally

1. **Start Azure Functions Runtime**
   ```bash
   cd functions
   npm install
   func start
   ```
   Functions will be available at `http://localhost:7071`

2. **Available Endpoints**
   - `GET http://localhost:7071/api/family-members` - Get all family members
   - `GET http://localhost:7071/api/family-members/search/{query}` - Search family members

3. **Test Functions**
   ```bash
   curl http://localhost:7071/api/family-members
   curl http://localhost:7071/api/family-members/search/gustav
   ```

### Development Workflow

**Option A: Express Development (Current)**
- Run `npm run dev` in project root
- Uses Express server at `http://localhost:5000`
- Frontend calls `/api/family-members`

**Option B: Azure Functions Development**
- Run `func start` in `/functions` directory
- Functions available at `http://localhost:7071`
- Update frontend API calls to `http://localhost:7071/api/family-members`

**Option C: Parallel Development**
- Run both Express (port 5000) and Functions (port 7071)
- Switch between them for testing
- Useful for comparing behavior

## Azure Static Web Apps Deployment

### 1. Functions Deployment
Azure Static Web Apps automatically detects and deploys functions from the `/functions` directory.

### 2. Build Configuration
Update your GitHub Actions workflow to include functions:

```yaml
- name: Build And Deploy
  uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
    action: "upload"
    app_location: "/"
    api_location: "functions"  # <-- Add this line
    output_location: "dist/public"
```

### 3. Frontend Configuration
No changes needed! The frontend will automatically use `/api/family-members` which Azure Static Web Apps routes to your functions.

## Data Synchronization

Both Express and Functions use the same data source:
- **Express**: `server/storage.ts` loads from `attached_assets/`
- **Functions**: `functions/shared/storage.js` loads from `functions/data/`

Both implementations provide identical API responses. The Functions version includes the data file within the functions directory to ensure Azure deployment packages it correctly.

## Azure Functions v4 Programming Model

This project uses the Azure Functions v4 programming model with the `@azure/functions` package:
- **No function.json files** - bindings are declared in code using `app.http()`
- **main.js naming convention** - Azure automatically picks up main.js files
- **Simplified structure** - each function is a single JavaScript file
- **Built-in routing** - routes defined directly in the handler registration

## Key Benefits

1. **Seamless Development**: Continue using Express in Replit
2. **Production Ready**: Functions automatically work with Azure Static Web Apps
3. **No Frontend Changes**: Same API endpoints work for both
4. **Easy Testing**: Can run both environments locally

## Troubleshooting

### Functions Not Starting
```bash
cd functions
npm install
func --version  # Should show Azure Functions Core Tools version
```

### CORS Issues
Functions include CORS headers for local development. Azure Static Web Apps handles CORS automatically.

### Data Loading Issues
- **Express**: Loads from `attached_assets/Gyllencreutz_Ancestry_Flat_CLEAN_Final_1752612544769.json`
- **Functions**: Loads from `functions/shared/data/family-members.json`
- JSON file has been cleaned to remove `NaN` values for proper parsing

## Next Steps

1. Test Functions locally: `cd functions && func start`
2. Update Azure Static Web Apps configuration to include `api_location: "functions"`
3. Deploy and test on Azure Static Web Apps

Your current Express development workflow remains unchanged!