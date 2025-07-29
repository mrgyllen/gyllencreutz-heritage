# Gyllencreutz Family Heritage Website - Project Overview

## Project Summary

The Gyllencreutz Family Heritage Website is a personal family website documenting the genealogical history of one of Sweden's oldest noble families (Adliga ätten nr 54). The site features an interactive family tree visualization, historical content, authentic Swedish royal portraits, and bilingual support (Swedish/English). It presents the family's rich heritage in an accessible digital format.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build System**: Vite
- **Styling**: Tailwind CSS with custom noble family color scheme
- **UI Components**: Radix UI components with shadcn/ui styling system
- **Visualization**: D3.js for interactive family tree rendering
- **State Management**: React Query (TanStack Query) for API state
- **Routing**: Wouter for client-side routing
- **Languages**: Bilingual support (Swedish/English) with context-based switching

### Backend
- **Development**: Express.js server for local development
- **Production**: Azure Functions (Node.js v4 model)
- **Data Storage**: JSON-based genealogical records with 148+ family members
- **Database**: Optional Azure Cosmos DB integration
- **Type Safety**: TypeScript with shared schemas
- **Future Ready**: Drizzle ORM configured for PostgreSQL migration

### Deployment
- **Platform**: Azure Static Web Apps
- **CI/CD**: GitHub Actions for automatic builds
- **CDN**: Global distribution for optimal performance
- **SSL**: Built-in certificates and custom domain support
- **Scaling**: Automatic scaling and high availability

## Key Features

### Interactive Family Tree
- **Multiple Views**: Detail view, tree visualization, and generation timeline
- **D3.js Visualization**: Zoomable and pannable tree with smooth interactions  
- **Authentic Design**: Family coat of arms integration for succession indicators
- **Responsive**: Works seamlessly across all device sizes

### Admin Interface
- **Data Management**: Full CRUD operations for family member records
- **Real-time Search**: Live filtering and search functionality
- **Statistics Dashboard**: Real-time metrics and data insights
- **Backup System**: Automatic GitHub-based backups with smart retention
- **GitHub Sync**: Automatic commits for all data changes

### Content Management
- **Bilingual Support**: Seamless Swedish/English language switching
- **Historical Portraits**: Authentic royal portraits and family imagery
- **Search Functionality**: Real-time search across all family data
- **Mobile Optimized**: Responsive design for all screen sizes

## API Endpoints

### Public APIs
- `GET /api/family-members` - Returns all family members with complete genealogical data
- `GET /api/family-members/search/{query}` - Searches family members by name and notes
- `GET /api/debug-deployment` - Deployment debugging and file system verification

### Admin APIs
- `GET /api/family-members/{id}` - Get specific family member by ID
- `PUT /api/family-members/{id}` - Update existing family member record
- `POST /api/family-members` - Create new family member record
- `DELETE /api/family-members/{id}` - Delete family member record
- `POST /api/family-members/bulk-update` - Bulk update operations with backup

### GitHub Sync APIs
- `GET /api/github/status` - Get GitHub sync status and connection information
- `POST /api/github/test` - Test GitHub API connection and authentication
- `POST /api/github/retry` - Manually retry failed GitHub sync operations
- `GET /api/github/logs` - Retrieve GitHub sync operation history

### Backup Management APIs
- `GET /api/backups` - List all available backups with metadata
- `POST /api/backups/create` - Create backup with specified trigger type
- `POST /api/backups/restore` - Restore family data from backup

### Cosmos DB APIs (Optional)
- `GET /api/cosmos/members` - Get all Cosmos DB members
- `POST /api/cosmos/members` - Create Cosmos DB member
- `PUT /api/cosmos/members/{id}` - Update Cosmos DB member
- `DELETE /api/cosmos/members/{id}` - Delete Cosmos DB member
- `POST /api/cosmos/import/restore` - Restore Cosmos DB from JSON backup

## Architecture

### Dual Backend System
- **Development Environment**: Express.js server running locally
- **Production Environment**: Azure Functions v4 model deployed via Azure Static Web Apps
- **Data Consistency**: Identical API responses across both environments
- **Scalability**: Azure Functions provide automatic scaling for traffic spikes

### Data Management
- **Primary Storage**: JSON-based genealogical records in `functions/data/family-members.json`
- **Backup System**: GitHub-based automatic backups with smart retention policies
- **GitHub Integration**: Automatic commits for all admin data changes
- **Optional Database**: Azure Cosmos DB integration for advanced scenarios

### Security & Reliability
- **Data Validation**: Server-side validation for all data modifications
- **Backup Safety**: Pre-restore backups created automatically
- **Retry Logic**: Exponential backoff for failed GitHub sync operations
- **Audit Trail**: Complete logging of all data changes

## Data Structure

### Family Member Schema
```typescript
{
  id: number,              // Unique identifier
  externalId: string,      // Original data ID
  name: string,            // Full name
  born: number | null,     // Birth year
  died: number | null,     // Death year
  biologicalSex: string,   // Male/Female
  notes: string | null,    // Historical notes and descriptions
  father: string | null,   // Father's external ID for relationships
  ageAtDeath: number | null,
  diedYoung: boolean,
  isSuccessionSon: boolean,
  hasMaleChildren: boolean,
  nobleBranch: string | null,
  monarchDuringLife: string[],
  generation?: number
}
```

### Smart Backup System
- **GitHub Storage**: Backups stored in repository `/backups` folder
- **Smart Naming**: `family-data_YYYY-MM-DDTHH-mm-ss_[trigger].json` format
- **Backup Types**: 
  - `manual` - User-initiated backups (permanent retention)
  - `auto-bulk` - Created before bulk operations (keeps last 5)
  - `pre-restore` - Created before restore operations (keeps last 3)
- **Safety Features**: Pre-restore backup automatically created
- **Auto-cleanup**: Intelligent retention preserving manual backups

## Development Workflow

### Local Development
1. Run `npm run dev` to start Express server + Vite dev server
2. Backend serves from `server/` directory  
3. Frontend hot-reloads from `client/` directory
4. Admin interface available at `/admin-db`

### Production Deployment
1. Azure Static Web Apps builds from GitHub
2. Frontend builds to `dist/public/`
3. Azure Functions deploy from `functions/` directory
4. Automatic GitHub sync for admin data changes

### Environment Configuration
- **GitHub Sync**: Requires `GITHUB_TOKEN` and `GITHUB_REPO`
- **Cosmos DB**: Optional, requires `COSMOS_DB_ENDPOINT` and `COSMOS_DB_PRIMARY_KEY`

## Design Philosophy

The website embodies **authentic 1500-1700s Swedish nobility aesthetics** with:
- **Historical Authenticity**: Visual elements honoring noble heritage
- **Respectful Presentation**: Content takes precedence over decoration
- **Timeless Elegance**: Subtle sophistication reflecting Swedish aristocracy
- **Modern Accessibility**: Contemporary usability with period-appropriate atmosphere

For detailed design specifications, see `/docs/design-guidelines.md`.

---

_Last updated: January 29, 2025_