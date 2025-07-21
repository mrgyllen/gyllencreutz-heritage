# Admin Interface Documentation

## Overview

The admin interface provides comprehensive family data management capabilities for the Gyllencreutz Heritage Website. Located at `/admin`, it allows authorized users to create, read, update, and delete family member records with full data validation and backup functionality.

## Features

### Search & Discovery
- **Real-time Search**: Find family members by name, external ID, or notes
- **Advanced Filtering**: Filter by succession status, biological sex, or date ranges
- **Statistics Dashboard**: View counts of total members, succession sons, and search results
- **Generation Analysis**: Track unique monarchs and family lineage spans

### Data Management
- **Add New Members**: Create new family member records with full validation
- **Edit Existing Data**: Modify any family member information with form validation
- **Delete Members**: Remove family members with confirmation dialogs
- **Bulk Operations**: Mass update capabilities for data migrations

### Data Integrity
- **Form Validation**: Ensure data consistency across all fields
- **Relationship Validation**: Verify father references and lineage connections
- **Backup System**: Automatic backups before bulk operations
- **Export Functionality**: Download family data in JSON format

## Technical Implementation

### Frontend Components
- **Admin Panel**: Main interface at `client/src/pages/admin.tsx`
- **Search Interface**: Real-time filtering with debounced queries
- **Edit Forms**: Modal dialogs with shadcn/ui components
- **Statistics Cards**: Dashboard showing key metrics

### Backend Services
- **Azure Functions**: Serverless backend for data persistence
  - `edit-family-member.ts`: Handle CRUD operations for individual members
  - `add-family-member.ts`: Create new family member records
  - `bulk-update-family.ts`: Mass update operations with backup
- **Data Storage**: File-based JSON storage with automatic ID generation
- **Error Handling**: Comprehensive error responses and validation

### API Endpoints

```
GET    /api/family-members/{id}    - Get specific family member
PUT    /api/family-members/{id}    - Update family member
DELETE /api/family-members/{id}    - Delete family member
POST   /api/family-members         - Create new family member
POST   /api/family-members/bulk-update - Bulk update operations
```

## Usage Guide

### Accessing the Admin Interface
1. Navigate to the main heritage website
2. Click the settings icon (⚙️) in the top navigation
3. Access the admin panel at `/admin`

### Managing Family Members
1. **Search**: Use the search bar to find specific members
2. **View Details**: Click on any family member card to see full information
3. **Edit**: Click the edit button to modify member data
4. **Delete**: Click the trash button and confirm deletion
5. **Add New**: Click "Add Member" button to create new records

### Data Export
1. Click the "Export Data" button in the admin interface
2. Download the complete family data as JSON file
3. Use for backup, analysis, or external processing

## Security Considerations

**Current Status**: No authentication implemented (development phase)

**Future Implementation**:
- Azure Static Web Apps built-in authentication
- Role-based access control for different user types
- Audit logging for all data modifications
- Session management and security headers

## Data Structure

Family member records include:
- **id**: Unique numeric identifier
- **externalId**: Lineage-based ID (e.g., "0", "1.2.3")
- **name**: Full name of family member
- **birth/death**: Years of birth and death
- **biologicalSex**: Male/Female designation
- **notes**: Additional biographical information
- **father**: External ID reference to father
- **monarch**: Contemporary Swedish monarch
- **isSuccessionSon**: Boolean flag for succession line

## Maintenance

### Backup Strategy
- Automatic backups created before bulk operations
- Manual export capability for regular backups
- Timestamp-based backup file naming

### Data Validation
- Required fields: name, externalId
- Date validation for birth/death years
- Reference validation for father relationships
- Enum validation for biological sex field

### Performance Optimization
- Client-side search filtering for instant results
- Debounced API calls to reduce server load
- React Query caching for efficient data management
- Optimistic updates for better user experience