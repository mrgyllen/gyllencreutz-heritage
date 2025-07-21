# Architecture Guidelines - Gyllencreutz Family Heritage Website

## 📐 Backend Overview

The Gyllencreutz Family Heritage Website employs a **dual backend architecture** designed for optimal development workflow and production deployment:

- **Development Environment**: Express.js server running on Replit for rapid iteration and testing
- **Production Environment**: Azure Functions v4 model deployed via Azure Static Web Apps
- **Data Storage**: JSON-based genealogical records with 148+ family members
- **Architecture Pattern**: RESTful API design with consistent endpoints across both environments

Both backend implementations provide identical API responses and functionality, ensuring seamless transition from development to production. The architecture supports real-time family tree visualization, search capabilities, and bilingual content delivery.

### Core Principles
- **Consistency**: Identical API contracts between development and production
- **Simplicity**: JSON-based data storage for genealogical records
- **Scalability**: Azure Functions provide automatic scaling for traffic spikes
- **Maintainability**: Clean separation of concerns with shared data access logic

---

## 🔌 API Endpoints

### Current Endpoints

#### Public API Endpoints

**`GET /api/family-members`**
- **Purpose**: Retrieve all family members with complete genealogical data
- **Response**: Array of family member objects with relationships, dates, and metadata
- **Usage**: Primary data source for family tree visualization and member listings

**`GET /api/family-members/search/{query}`**
- **Purpose**: Search family members by name and notes content
- **Parameters**: `query` - search term (minimum 2 characters)
- **Response**: Filtered array of family members matching the search criteria
- **Usage**: Real-time search functionality for finding specific family members

#### Admin API Endpoints (IMPLEMENTED)

**`GET /api/family-members/{id}`**
- **Purpose**: Retrieve specific family member by ID
- **Parameters**: `id` - unique family member identifier (externalId)
- **Response**: Single family member object with complete details
- **Usage**: Admin interface member detail viewing and editing
- **Implementation**: Available in both Express and Azure Functions

**`PUT /api/family-members/{id}`**
- **Purpose**: Update existing family member record
- **Parameters**: `id` - family member identifier, request body with updated data
- **Response**: Success confirmation with updated member data
- **Usage**: Admin interface data editing functionality
- **Implementation**: Full validation, data persistence, backup support, and GitHub sync

**`POST /api/family-members`**
- **Purpose**: Create new family member record
- **Request Body**: Family member data with required fields (externalId, name, biologicalSex)
- **Response**: Success confirmation with created member data including auto-generated ID
- **Usage**: Admin interface for adding new family members
- **Implementation**: Duplicate detection, field validation, and GitHub sync included

**`DELETE /api/family-members/{id}`**
- **Purpose**: Delete family member record
- **Parameters**: `id` - family member identifier (externalId)
- **Response**: Success confirmation with deleted member data
- **Usage**: Admin interface for removing family members
- **Implementation**: Safe deletion with data persistence and GitHub sync

**`POST /api/family-members/bulk-update`**
- **Purpose**: Bulk update multiple family members or entire dataset
- **Request Body**: Array of family member objects
- **Response**: Success confirmation with update/create counts and backup information
- **Usage**: Admin interface for mass data operations and imports
- **Implementation**: Automatic backup creation and GitHub sync for bulk operations

#### GitHub Sync API Endpoints (NEW)

**`GET /api/github/status`**
- **Purpose**: Get current GitHub sync configuration and status
- **Response**: Sync availability, connection status, last sync time, pending operations, and error information
- **Usage**: Admin interface sync status monitoring widget
- **Implementation**: Real-time status with retry management and connection testing

**`POST /api/github/test`**
- **Purpose**: Test GitHub API connection and authentication
- **Response**: Success/failure status with connection error details
- **Usage**: Admin interface connection verification button
- **Implementation**: Direct GitHub API authentication test with detailed error reporting

**`POST /api/github/retry`**
- **Purpose**: Manually retry failed GitHub sync operations
- **Response**: Retry attempt status and results
- **Usage**: Admin interface manual retry button for failed syncs
- **Implementation**: Exponential backoff retry with operation queue management

**`GET /api/github/logs`**
- **Purpose**: Retrieve GitHub sync operation logs and history
- **Response**: Array of sync operation logs with timestamps and results
- **Usage**: Admin interface sync history and debugging
- **Implementation**: In-memory log retention with operation details

#### Development/Debugging Endpoints

**`GET /api/debug-deployment`** *(Development/Debugging)*
- **Purpose**: Verify deployment status and file system accessibility
- **Response**: Deployment diagnostics including file paths and data loading status
- **Usage**: Troubleshooting Azure Functions deployment issues

### API Response Format
All endpoints return JSON responses with consistent structure:
```javascript
{
  id: number,           // Unique identifier
  externalId: string,   // Original data ID
  name: string,         // Full name
  birthDate: string,    // Birth year or date
  deathDate: string,    // Death year or date
  biologicalSex: string, // Male/Female
  notes: string,        // Historical notes and descriptions
  father: string,       // Father's name for genealogical relationships
  monarch: string,      // Ruling monarch during lifetime
  monarchYears: string, // Years of monarch's reign
  successionSon: boolean // Indicates succession line significance
}
```

---

## 📁 Data Management

### Data Source
- **File Location**: `functions/data/family-members.json`
- **Format**: JSON array with 148+ genealogical records
- **Source**: Cleaned and processed data from Gyllencreutz family research
- **Size**: ~77KB of genealogical data

### Data Loading Strategy
- **Development**: Express server loads from `attached_assets/` directory
- **Production**: Azure Functions load from `functions/data/` directory
- **Admin Operations**: Azure Functions write directly to `functions/data/family-members.json`
- **Initialization**: Data loaded once at startup and cached in memory for read operations
- **Processing**: Raw JSON transformed into structured family member objects
- **Backup System**: Automatic timestamped backups created before bulk operations

### Data Persistence (NEW)
- **Admin Interface**: Real-time data editing through Azure Functions
- **File-based Storage**: Direct JSON file manipulation for data persistence
- **CRUD Operations**: Full Create, Read, Update, Delete functionality
- **Data Validation**: Server-side validation for all data modifications
- **Auto-incrementing IDs**: Automatic ID generation for new family members
- **Relationship Integrity**: Validation of father references and genealogical connections
- **GitHub Integration**: Automatic commits to repository for all data changes with [data-only] prefix

### GitHub Sync System (NEW)
- **Automatic Commits**: All admin data changes automatically commit to GitHub repository
- **GitHub API Integration**: Uses Fine-Grained Personal Access Tokens for secure repository access
- **Commit Message Format**: `[data-only] admin: <operation description>` to identify admin changes
- **Deployment Filtering**: GitHub Actions skip site deployments for [data-only] commits
- **Retry Logic**: Exponential backoff retry system (5min → hourly) for failed sync operations
- **Status Monitoring**: Real-time sync status with admin interface widget
- **Dual Environment Support**: Available in both Express (development) and Azure Functions (production)

### Data Structure
The JSON data contains flat records that are processed into hierarchical family relationships:
- **Flat Structure**: Individual records with parent references
- **Field Mapping**: JSON fields (Born, Died, MonarchDuringLife) mapped to frontend schema (born, died, monarchDuringLife)
- **Hierarchical Processing**: Frontend converts to tree structure for visualization
- **Search Indexing**: In-memory filtering by name and notes content
- **Type Safety**: Data validation and transformation through shared schemas
- **Monarch Data**: String arrays parsed from Python-style format to JavaScript arrays

### Storage Interface
Both backend implementations use a common storage interface with full CRUD capabilities and GitHub sync:
```javascript
class FunctionStorage {
  // Read Operations
  async getAllFamilyMembers()         // Returns all family members
  async searchFamilyMembers(query)    // Filters members by search term
  async getFamilyMember(id)           // Gets specific member by externalId
  
  // Write Operations (IMPLEMENTED)
  async createFamilyMember(data)      // Creates new member with auto-generated ID + GitHub sync
  async updateFamilyMember(id, data)  // Updates existing member by externalId + GitHub sync
  async deleteFamilyMember(id)        // Removes member by externalId + GitHub sync
  async bulkUpdateFamilyMembers(data) // Mass update/create operations + GitHub sync
  
  // Data Persistence (IMPLEMENTED)
  async persistToFile()               // Writes changes to JSON file
  async createBackup()                // Creates timestamped backup before bulk ops
}

class GitHubSync {
  // GitHub Integration
  async syncFamilyData(operation, memberData, familyData) // Commits changes to GitHub
  async testConnection()              // Tests GitHub API authentication
  async manualRetry()                 // Manually retry failed operations
  getStatus()                         // Returns current sync status and metrics
  getSyncLogs()                       // Returns sync operation history
}
```

---

## 🛠️ Deployment

### Azure Static Web Apps Integration
- **Frontend**: Static files deployed to Azure CDN from `dist/public/`
- **Backend**: Azure Functions automatically deployed from `functions/` directory
- **Build Process**: GitHub Actions trigger builds on repository updates
- **Configuration**: `staticwebapp.config.json` defines routing and function integration

### Azure Functions v4 Model
- **Programming Model**: Code-based bindings using `@azure/functions` package
- **Entry Point**: Single `main.js` file imports all function handlers
- **Function Structure**: Individual functions in `src/functions/` directory
- **No Configuration Files**: Eliminates function.json files for simplified deployment
- **Route Definition**: Routes defined in code using `app.http()` declarations

### Development vs Production Differences

| Aspect | Development (Express) | Production (Azure Functions) |
|--------|----------------------|------------------------------|
| **Runtime** | Node.js with tsx | Azure Functions Node.js runtime |
| **Data Path** | `attached_assets/` | `functions/data/` |
| **Port** | 5000 (Replit) | Managed by Azure |
| **Scaling** | Single instance | Auto-scaling |
| **Deployment** | Instant restart | GitHub Actions build |
| **Data Write** | Read-only operations | Full CRUD via admin interface |

### Security Considerations (Future Implementation)
- **Authentication**: Azure Static Web Apps built-in authentication (GitHub, Azure AD)
- **Authorization**: Role-based access control for admin operations
- **Data Validation**: Server-side validation for all data modifications
- **Audit Trail**: Logging and backup system for all data changes
- **Rate Limiting**: Protection against excessive API usage

---

## 📝 Recent Updates

### Admin Interface Implementation (January 21, 2025)
- Added comprehensive CRUD operations for family data management
- Implemented Azure Functions backend for data persistence
- Created admin interface at `/admin` route with full data management capabilities
- Added automatic backup system for bulk operations
- Enhanced API endpoints with full family member lifecycle management

### GitHub Sync Integration (January 21, 2025)
- Implemented automatic GitHub commits for all admin data changes
- Added GitHub API integration with Fine-Grained Personal Access Token authentication
- Created sync status monitoring with real-time admin interface widget
- Added retry logic with exponential backoff for failed sync operations
- Updated GitHub Actions workflow to skip deployments for [data-only] commits
- Implemented dual backend support (Express + Azure Functions) for GitHub sync

_Last updated: January 21, 2025_
| **Environment** | Replit workspace | Azure cloud infrastructure |

### File Deployment Considerations
- **Data Inclusion**: `functions/package.json` explicitly includes data files
- **Path Resolution**: Absolute path resolution for consistent Azure deployment
- **Error Handling**: Comprehensive logging for deployment troubleshooting
- **Debugging**: Dedicated endpoint for verifying deployment integrity

### CI/CD Pipeline
1. **Code Push**: Changes pushed to GitHub repository
2. **Build Trigger**: Azure Static Web Apps detects changes
3. **Frontend Build**: Vite builds React application to `dist/public/`
4. **Function Deploy**: Azure packages and deploys functions from `functions/`
5. **Integration Test**: Automated verification of API endpoints
6. **Live Deployment**: Updated site available on custom domain



---

_Maintained by Claude AI_  
_Last updated: 2025-01-21_