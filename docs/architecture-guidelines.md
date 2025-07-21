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

#### Admin API Endpoints (NEW)

**`GET /api/family-members/{id}`**
- **Purpose**: Retrieve specific family member by ID
- **Parameters**: `id` - unique family member identifier
- **Response**: Single family member object with complete details
- **Usage**: Admin interface member detail viewing and editing

**`PUT /api/family-members/{id}`**
- **Purpose**: Update existing family member record
- **Parameters**: `id` - family member identifier, request body with updated data
- **Response**: Success confirmation with updated member data
- **Usage**: Admin interface data editing functionality

**`POST /api/family-members`**
- **Purpose**: Create new family member record
- **Request Body**: Family member data without ID (auto-generated)
- **Response**: Success confirmation with created member data including new ID
- **Usage**: Admin interface for adding new family members

**`DELETE /api/family-members/{id}`**
- **Purpose**: Delete family member record
- **Parameters**: `id` - family member identifier
- **Response**: Success confirmation with deleted member data
- **Usage**: Admin interface for removing family members

**`POST /api/family-members/bulk-update`**
- **Purpose**: Bulk update multiple family members or entire dataset
- **Request Body**: Array of family member objects or complete dataset
- **Response**: Success confirmation with update count and backup information
- **Usage**: Admin interface for mass data operations and imports

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

### Data Structure
The JSON data contains flat records that are processed into hierarchical family relationships:
- **Flat Structure**: Individual records with parent references
- **Field Mapping**: JSON fields (Born, Died, MonarchDuringLife) mapped to frontend schema (born, died, monarchDuringLife)
- **Hierarchical Processing**: Frontend converts to tree structure for visualization
- **Search Indexing**: In-memory filtering by name and notes content
- **Type Safety**: Data validation and transformation through shared schemas
- **Monarch Data**: String arrays parsed from Python-style format to JavaScript arrays

### Storage Interface
Both backend implementations use a common storage interface:
```javascript
class FunctionStorage {
  async getAllFamilyMembers()         // Returns all family members
  async searchFamilyMembers(query)    // Filters members by search term
  async getFamilyMember(id)           // Gets specific member by ID (NEW)
  async updateFamilyMember(id, data)  // Updates existing member (NEW)
  async addFamilyMember(data)         // Creates new member (NEW)
  async deleteFamilyMember(id)        // Removes member (NEW)
  async bulkUpdateFamilyMembers(data) // Mass update operations (NEW)
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
_Last updated: 2025-01-19_