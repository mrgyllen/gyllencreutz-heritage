# Gyllencreutz Family Heritage Website

## Overview

This is a heritage website for the Gyllencreutz family, one of Sweden's oldest noble families (Adliga ätten nr 54). The project is built as a full-stack web application showcasing the family's genealogical history through an interactive family tree, historical content, and visual gallery.

## User Preferences

Preferred communication style: Simple, everyday language.
Color scheme: 1500-1700s Swedish nobility aesthetic - subtle, muted tones that don't overtake content, reflecting historical authenticity without ostentation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and production builds
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state management
- **Styling**: Tailwind CSS with custom noble family color scheme
- **UI Components**: Radix UI components with shadcn/ui styling system
- **Data Visualization**: D3.js for interactive family tree rendering

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Data Layer**: In-memory storage (MemStorage) with interfaces for future database integration
- **Session Management**: Express sessions (prepared for PostgreSQL session store)

### Development Setup
- **Development Server**: Vite dev server with Express middleware in development
- **Production Build**: Static file serving with Express in production
- **Hot Module Replacement**: Vite HMR for fast development iteration

## Key Components

### Family Tree Visualization
- Interactive D3.js-based genealogical tree
- Hierarchical data structure built from flat family member records
- Search functionality to locate specific family members
- Responsive design with zoom and pan capabilities
- Visual indicators for succession sons and biological sex

### Data Management
- Family member records with fields: name, birth/death dates, biological sex, notes, father references, monarch information
- Tree-building algorithm to convert flat data structure into hierarchical format
- Search capabilities across names and notes
- Type-safe data handling with Zod validation schemas
- Updated to use cleaned final data files with corrected structure and "BiologicalSex" field naming

### User Interface
- Single-page application with smooth scrolling navigation
- Responsive design optimized for desktop and mobile
- Custom noble family color palette (burgundy, gold, parchment)
- Typography using Playfair Display, Inter, and Cinzel fonts
- Image gallery with family heraldic symbols

## Data Flow

1. **Initial Load**: Client fetches family member data from `/api/family-members`
2. **Tree Construction**: Frontend converts flat data into hierarchical tree structure
3. **Visualization**: D3.js renders interactive family tree with SVG elements
4. **Search**: Real-time search queries sent to `/api/family-members/search/:query`
5. **User Interaction**: Click/hover events display detailed member information

## External Dependencies

### Core Libraries
- **React Ecosystem**: React, React DOM, React Query for state management
- **Visualization**: D3.js for tree rendering and data manipulation
- **UI Framework**: Radix UI primitives with custom styling
- **Development**: Vite, TypeScript, ESLint for development workflow
- **Database**: Drizzle ORM configured for PostgreSQL (currently using in-memory storage)

### Styling and Assets
- **CSS Framework**: Tailwind CSS with custom configuration
- **Fonts**: Google Fonts (Playfair Display, Inter, Cinzel)
- **Icons**: Lucide React for UI icons
- **Images**: Family heraldic symbols and coat of arms

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React application to `dist/public`
2. **Backend Build**: ESBuild bundles Express server to `dist/index.js`
3. **Static Assets**: Images and fonts bundled with frontend build

### Production Setup
- Express server serves static files from `dist/public`
- API routes handle family data requests
- Environment variables configure database connections
- Session management ready for PostgreSQL integration

### Database Migration Path
- Drizzle ORM configured for PostgreSQL with migration support
- Schema definitions in `shared/schema.ts` for type safety
- Current in-memory storage can be replaced with database calls
- Migration scripts ready with `npm run db:push`

### Environment Configuration
- Development: `npm run dev` - Vite dev server with Express API
- Production: `npm run build && npm start` - Static file serving
- Database: `DATABASE_URL` environment variable for PostgreSQL connection
- Session: PostgreSQL session store configured for production scaling

### External Deployment
- Frontend build: `npm run build` creates production-ready static files in `dist/public/`
- Static hosting: Deploy `dist/public/` contents to Azure Static Web Apps, Netlify, Vercel, or GitHub Pages
- Build output: ~316KB JS (99KB gzipped), ~65KB CSS (12KB gzipped), ~1.4MB images
- Configuration: `staticwebapp.config.json` provided for Azure Static Web Apps
- SPA routing: Configured with fallback to `index.html` for proper client-side routing
- Performance: Assets have hashed filenames for optimal caching and cache invalidation

## Recent Changes (January 2025)
- Updated to use cleaned final data files with corrected structure
- Fixed father relationship processing to display complete family tree lineage
- Renamed "Sex" field to "BiologicalSex" throughout the application
- Added proper monarch information parsing for each family member
- Successfully loaded 148 family members with complete genealogical connections
- Verified modern descendants (1950-1980) are properly linked in the tree structure
- Integrated official Riddarhuset (House of Nobility) information into About section
- Added comprehensive book information for "Makt, intriger och krig" by Claes Gyllencreutz
- Enhanced Heraldic Gallery with official heraldic images from Riddarhuset archive
- Updated Hero section with authentic historical information from official sources
- Refined color scheme to authentic 1500-1700s Swedish nobility palette with muted, period-appropriate tones
- Replaced modern burgundy/gold with subtle deep forest, antique brass, and warm stone colors
- Updated all components to use historically-inspired color scheme that supports content rather than overwhelming it
- Implemented comprehensive bilingual support with Swedish and English language switching functionality
- Created language context system and toggle component for seamless language switching
- Updated all major components (hero, about, legacy, gallery, navigation) with translation support
- Maintained authentic historical content from Riddarhuset while adding multilingual accessibility
- Successfully implemented complete collection of 23 authentic Swedish royal portraits (January 16, 2025)
- Resolved all portrait loading issues by replacing corrupted files with manually provided authentic images
- Integrated authentic historical portraits from Gustav Vasa (1523) to Carl XVI Gustaf (present)
- All portraits now display correctly with proper fallback system and robust error handling
- Portrait system ready for seamless integration throughout family tree and website components
- Cleaned up all test pages, debug code, and unnecessary assets for production readiness