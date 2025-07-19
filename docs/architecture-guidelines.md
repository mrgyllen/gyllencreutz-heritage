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

**`GET /api/family-members`**
- **Purpose**: Retrieve all family members with complete genealogical data
- **Response**: Array of family member objects with relationships, dates, and metadata
- **Usage**: Primary data source for family tree visualization and member listings

**`GET /api/family-members/search/{query}`**
- **Purpose**: Search family members by name and notes content
- **Parameters**: `query` - search term (minimum 2 characters)
- **Response**: Filtered array of family members matching the search criteria
- **Usage**: Real-time search functionality for finding specific family members

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
- **Initialization**: Data loaded once at startup and cached in memory
- **Processing**: Raw JSON transformed into structured family member objects

### Data Structure
The JSON data contains flat records that are processed into hierarchical family relationships:
- **Flat Structure**: Individual records with parent references
- **Hierarchical Processing**: Frontend converts to tree structure for visualization
- **Search Indexing**: In-memory filtering by name and notes content
- **Type Safety**: Data validation and transformation through shared schemas

### Storage Interface
Both backend implementations use a common storage interface:
```javascript
class FunctionStorage {
  async getAllFamilyMembers()     // Returns all family members
  async searchFamilyMembers(query) // Filters members by search term
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
- **File Convention**: Functions use `main.js` naming for automatic detection
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

## 🔄 Future Considerations

### Database Migration Path
- **Current**: JSON file storage for simplicity and rapid development
- **Future**: Drizzle ORM configured for PostgreSQL migration when needed
- **Schema**: Defined in `shared/schema.ts` for type safety
- **Migration**: Seamless transition from JSON to database storage

### Performance Optimization
- **Caching**: Consider Redis for session management and data caching
- **CDN**: Optimize static asset delivery for global users
- **Search**: Potential integration with Azure Cognitive Search for advanced queries
- **Analytics**: Application Insights for performance monitoring

### Security Considerations
- **Authentication**: Currently public; family member authentication may be added
- **Rate Limiting**: Azure Functions provide built-in DDoS protection
- **Data Privacy**: Genealogical data handling follows privacy best practices
- **HTTPS**: Enforced through Azure Static Web Apps SSL certificates

---

_Maintained by Claude AI_  
_Last updated: 2025-01-18_