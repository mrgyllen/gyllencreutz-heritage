# Gyllencreutz Family Heritage Website - Solution Overview

## Project Summary

The Gyllencreutz Family Heritage Website is a personal family website documenting the genealogical history of one of Sweden's oldest noble families (Adliga ätten nr 54). The site features an interactive family tree visualization, historical content, authentic Swedish royal portraits, and bilingual support (Swedish/English). Built entirely through vibe coding, it presents the family's rich heritage in an accessible digital format.

## Technologies

- **Frontend**: React 18 with TypeScript, Vite build system, Tailwind CSS
- **Backend**: Azure Functions (Node.js v4 model), Express.js for development
- **Data**: JSON-based genealogical records with 148+ family members
- **Visualization**: D3.js for interactive family tree rendering
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Deployment**: Azure Static Web Apps with GitHub CI/CD integration
- **Languages**: Bilingual support (Swedish/English) with context-based switching

## Deployment

The website is deployed on **Azure Static Web Apps**, providing:
- Automatic builds from GitHub repository
- Global CDN distribution for optimal performance
- Integrated Azure Functions for API endpoints
- Built-in SSL certificates and custom domain support
- Seamless scaling and high availability

---

# 🤝 AI Collaboration Overview

This project is collaboratively developed using **two AI systems**:

- **Replit AI**: Responsible for UI/UX design, frontend code (React), and visual design systems.
- **Claude AI**: Responsible for backend logic, architecture, API design, and data handling.

---

## 📘 Collaboration Guidelines

- Both AIs must read this `/docs/solution.md` file before working on the project.
- Replit maintains `/docs/design-guidelines.md`.
- Claude maintains `/docs/architecture-guidelines.md`.
- Each AI must keep **its section of this file** up to date.
- This file acts as the **source of truth** for overall solution intent, structure, and responsibilities.
- Do **not** maintain a full changelog — instead, update the `_Last updated_` date at the end of your section when a change is made.
- **Follow git commit format**: `<type>(Replit): <description>` or `<type>(Claude): <description>` for all changes (see docs/git-commit-guidelines.md)

---

## 🎨 Frontend (Replit's Responsibility)

Replit is responsible for all frontend development and visual presentation.

### Technologies
- React 18 with TypeScript (via Vite)
- Tailwind CSS with custom noble family color scheme
- Radix UI components with shadcn/ui styling system
- D3.js for interactive family tree visualization
- React Query (TanStack Query) for state management
- Wouter for client-side routing

### Responsibilities
- Layout and component structure for all pages
- Interactive family tree visualization with three view modes (Detail/Tree/Generations)
- D3.js-powered zoomable and pannable tree visualization
- Generation timeline with enhanced visual design and branch filtering
- Authentic family coat of arms integration for succession indicators
- Visual hierarchy and user experience design with Swedish nobility aesthetics
- Responsive design and accessibility features
- Integration with backend API endpoints
- Bilingual language switching interface
- Historical portrait gallery implementation
- Search functionality UI components

### Design Alignment
- Follows `/docs/design-guidelines.md`
- Maintains authentic 1500-1700s Swedish nobility aesthetic
- Uses subtle, muted color palette that supports content
- All changes to visuals, styling, or component structure must reflect those guidelines

_Last updated: 2025-01-19_

---

## ⚙️ Backend (Claude's Responsibility)

Claude is responsible for the backend architecture and data processing.

### Technologies
- Azure Functions (Node.js v4 programming model with main.js convention)
- Express.js server for Replit development environment
- JSON data storage with 148+ genealogical records
- TypeScript for type safety and data validation
- Drizzle ORM configured for future PostgreSQL integration

### Responsibilities
- Define and maintain API endpoints (`/api/family-members`, `/api/family-members/search/{query}`)
- Load and parse family tree JSON data from `functions/data/family-members.json`
- Handle genealogical data retrieval, filtering, and search functionality
- Convert flat family data into hierarchical tree structures
- Support frontend requirements for family tree visualization
- Maintain dual backend systems (Express for development, Functions for production)
- Ensure consistent API responses across both environments

### Architecture Alignment
- Follows `/docs/architecture-guidelines.md`
- Uses Azure Functions v4 model with single entry point and modular function structure
- Robust data loading with multiple fallback paths for reliable deployment
- All changes to logic, data structure, or backend architecture must update that file accordingly

### Current API Endpoints
- `GET /api/family-members` - Returns all family members with complete genealogical data
- `GET /api/family-members/search/{query}` - Searches family members by name and notes
- `GET /api/debug-deployment` - Deployment debugging and file system verification

_Last updated: 2025-01-19_

---

## 🔄 Integration Points

### Data Flow
1. Frontend requests family data from backend APIs
2. Backend loads JSON genealogical records and processes queries
3. Frontend receives structured data and builds interactive visualizations
4. Search queries are processed in real-time with backend filtering

### Deployment Coordination
- Frontend builds to `dist/public/` for static hosting
- Backend Functions deploy automatically to Azure Static Web Apps
- Both systems share identical API endpoints for seamless integration
- Development uses Express server, production uses Azure Functions

### Quality Assurance
- Both AIs must test their changes against the integration points
- Frontend changes must verify API compatibility
- Backend changes must ensure frontend functionality remains intact
- Any breaking changes require coordination between both systems