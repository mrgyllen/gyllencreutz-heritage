# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Philosophy

The Gyllencreutz Family Heritage Website is a comprehensive genealogical web application documenting one of Sweden's oldest noble families. The project emphasizes:

- **Historical Authenticity**: Accurate representation of Swedish nobility heritage
- **Technical Excellence**: Modern full-stack architecture with TypeScript throughout
- **User Experience**: Intuitive interface for exploring complex family relationships
- **Data Integrity**: Comprehensive backup systems and validation
- **Maintainability**: Clean code architecture with thorough documentation

## Commands

### Development
- `npm run dev` - Start development server (Express.js backend + Vite frontend on port 5000)
- `npm run build` - Build for production (outputs to `dist/public/`)
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking

### Testing
- `npm test` - Run all tests with Vitest
- `npm run test:ui` - Run tests with interactive UI
- `npm run test:run` - Run tests once (non-watch mode)
- `npm run test:coverage` - Run tests with coverage report

### Database
- `npm run db:push` - Push Drizzle schema changes (PostgreSQL ready, currently using JSON)

## Architecture Overview

This project uses a **dual backend architecture**:

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript, built with Vite
- **UI**: Tailwind CSS + Radix UI components (shadcn/ui styling)
- **Visualization**: D3.js for interactive family tree
- **State**: React Query (TanStack Query) for API state management
- **Routing**: Wouter for client-side routing
- **Key Components**:
  - `client/src/App.tsx` - Main app with routing
  - `client/src/pages/home.tsx` - Main family heritage page
  - `client/src/pages/admin-db.tsx` - Admin interface for data management
  - `client/src/components/family-tree.tsx` - D3.js family tree visualization
  - `client/src/types/family.ts` - Type definitions for family data

### Backend (Dual Environment)
- **Development**: Express.js server (`server/index.ts`)
- **Production**: Azure Functions v4 model (`functions/`)
- **Data Storage**: JSON-based family genealogy data
- **API Pattern**: RESTful endpoints with identical responses across environments

### Data Management
- **Primary Data**: `functions/data/family-members.json` (148+ family members)
- **Schema**: Shared TypeScript types in `shared/schema.ts`
- **Admin Interface**: Full CRUD operations through Azure Functions
- **Backup System**: GitHub-based automatic backups with smart retention
- **GitHub Sync**: Automatic commits for data changes with `[data-only]` prefix

## Test Structure

The project now uses a centralized test structure in the `/tests` directory:

### Test Organization
- `/tests/unit` - Unit tests organized by client/server/shared components
- `/tests/integration` - Integration tests for API and component interactions
- `/tests/e2e` - End-to-end tests for complete user workflows
- `/tests/mocks` - Mock data and utilities organized by client/server
- `/tests/utils` - Test utilities and helpers

### Test Conventions
- Unit tests: `[filename].test.ts`
- Integration tests: `[filename].integration.test.ts`
- E2E tests: `[feature].e2e.test.ts`
- Use proper path aliases: `@/`, `@shared/`, `@tests/`

## Key Patterns

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`
- `@tests/*` → `tests/*`

### API Endpoints
**Public APIs:**
- `GET /api/family-members` - All family members
- `GET /api/family-members/search/{query}` - Search functionality

**Admin APIs:**
- `GET /api/family-members/{id}` - Get specific member
- `PUT /api/family-members/{id}` - Update member
- `POST /api/family-members` - Create member
- `DELETE /api/family-members/{id}` - Delete member
- `POST /api/family-members/bulk-update` - Bulk operations

**GitHub Sync APIs:**
- `GET /api/github/status` - Sync status monitoring
- `POST /api/github/test` - Test GitHub connection
- `POST /api/github/retry` - Manual retry failed syncs

**Backup Management APIs:**
- `GET /api/backups` - List all backups
- `POST /api/backups/create` - Create backup
- `POST /api/backups/restore` - Restore from backup

**Performance Monitoring APIs:**
- `GET /api/performance/stats` - API usage statistics and performance metrics
- `GET /api/performance/health` - System health with performance score and issues
- `GET /api/performance/analytics` - User analytics and behavior data
- `POST /api/performance/clear` - Clear old metrics (maintenance)

### Data Flow
1. **Development**: Express server loads data from `attached_assets/`
2. **Production**: Azure Functions load from `functions/data/`
3. **Admin Operations**: Direct JSON file manipulation with GitHub sync
4. **Backup System**: GitHub repository `/backups` folder with smart retention

### Advanced Features

#### Cosmos DB Integration
- **Client**: `server/cosmosClient.js` provides Cosmos DB operations
- **Types**: Extended types in `client/src/types/family.ts`
- **APIs**: `/api/cosmos/*` endpoints for Cosmos DB operations
- **Migration**: Ready for future migration from JSON to Cosmos DB

#### Performance Optimizations
- **Frontend**: React memoization (useMemo, useCallback, React.memo) prevents unnecessary re-renders
- **D3.js Visualization**: Progressive loading (50 initial nodes, batches of 25), depth limiting, viewport culling
- **API Monitoring**: Real-time performance tracking with response times, error rates, system health

#### Validation & Error Handling
- **Zod Schemas**: Comprehensive input validation with business rules (external ID format validation, family relationship validation)
- **Standardized Responses**: Unified API response format with proper HTTP status codes and error severity
- **Error Tracking**: Automatic error recording with performance metrics

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

### GitHub Integration
- **Authentication**: Fine-grained Personal Access Tokens
- **Commit Format**: `[data-only] admin: <description>` for admin changes
- **CI/CD**: GitHub Actions skip deployments for `[data-only]` commits
- **Retry Logic**: Exponential backoff (5min → hourly) for failed syncs

## Important Notes

### Data Integrity
- All admin operations create automatic backups
- GitHub sync provides audit trail for data changes
- Three backup types: manual (permanent), auto-bulk (last 5), pre-restore (last 3)
- Server-side validation for all data modifications

### Environment Configuration
- **Cosmos DB**: Optional, requires `COSMOS_DB_ENDPOINT` and `COSMOS_DB_PRIMARY_KEY`
- **GitHub Sync**: Requires `GITHUB_TOKEN` and `GITHUB_REPO` environment variables

### Code Organization
- **Shared Types**: Use `shared/schema.ts` for backend schema definitions
- **API Consistency**: Maintain identical responses between Express and Azure Functions
- **Component Structure**: Follow existing Radix UI + shadcn/ui patterns
- **D3.js Integration**: Family tree visualization in `family-tree.tsx`

### Testing & Quality
- **Test Framework**: Vitest with React Testing Library and MSW for API mocking
- **Comprehensive Coverage**: 135+ tests covering validation, performance monitoring, business logic, and React components
- **Type Safety**: TypeScript strict mode enabled throughout codebase
- **Build Verification**: Always run `npm run check` before deployment  
- **API Testing**: Test both Express and Azure Functions environments
- **Data Validation**: Zod schemas for all API inputs with business rule validation

## Documentation Structure

This project includes comprehensive technical documentation:
- **CLAUDE.md** (this file): Primary development guide and quick reference
- `/docs/solution.md`: Complete project overview and architecture
- `/docs/architecture-guidelines.md`: Detailed backend architecture and API documentation
- `/docs/design-guidelines.md`: UI/UX design principles and visual guidelines
- `/docs/cosmos-db-setup.md`: Optional Cosmos DB integration guide
- `/docs/admin-interface-detailed.md`: Admin interface usage documentation

## Key Architecture Patterns

### Data Flow Architecture
The application follows a sophisticated data flow that handles both development and production environments:

1. **API Response Standardization**: All endpoints use `server/lib/api-response.ts` for consistent response format with proper HTTP status codes, error handling, and validation
2. **Performance Monitoring**: `server/lib/performance-monitor.ts` automatically tracks all API requests, response times, error rates, and system health
3. **Validation Layer**: `server/lib/validation.ts` provides Zod schemas with business rules validation for all API inputs

### Frontend Performance Optimization
The family tree visualization handles large datasets (148+ members) efficiently:

1. **React Optimization**: Components use `useMemo`, `useCallback`, and `React.memo` to prevent unnecessary re-renders
2. **Progressive Loading**: D3.js tree starts with 50 nodes, loads remaining in batches of 25
3. **Viewport Culling**: Only renders nodes visible in current viewport for better performance
4. **Data Transformation**: Expensive operations are memoized to prevent repeated calculations

### API Response Format
All APIs return standardized responses:
```typescript
{
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
  timestamp: string;
  path?: string;
}
```

### Validation Pipeline
1. **Schema Validation**: Zod schemas validate structure, types, and constraints
2. **Business Rules**: Custom validation for family relationships, external ID format, age consistency
3. **Error Response**: Standardized error format with field-level validation details

## Development Guidelines

When working on this project:

1. **Follow CLAUDE.md First**: This file is the primary reference - always consult it before making changes
2. **Test-Driven Development**: Always run `npm test` after changes - maintain 135+ passing tests
3. **Performance Monitoring**: Use `/api/performance/health` endpoint to monitor system performance
4. **Validation First**: All new API endpoints must use Zod validation middleware
5. **Response Standardization**: Use `sendSuccessResponse` and `sendErrorResponse` from `server/lib/api-response.ts`
6. **Data Safety**: Always use backup systems before bulk data operations
7. **Type Safety**: Run `npm run check` to ensure TypeScript compliance
8. **Test Structure**: Place new tests in the appropriate directory under `/tests` following naming conventions

This is a single-developer project with comprehensive monitoring, validation, and testing infrastructure.