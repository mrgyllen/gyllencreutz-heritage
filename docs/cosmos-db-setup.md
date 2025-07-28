# Azure Cosmos DB Integration Setup Guide

This guide explains how to set up and use the Azure Cosmos DB integration for the Gyllencreutz Family Heritage Website.

## Overview

The Cosmos DB integration provides an alternative backend for storing family member data using Azure Cosmos DB NoSQL database instead of the JSON file system. This allows for better scalability, concurrent access, and cloud-native features.

## Features

- **Dual System Support**: Works alongside the existing JSON-based system without interference
- **Full CRUD Operations**: Create, Read, Update, Delete family member records
- **Data Import**: Import existing data from JSON files to Cosmos DB
- **Admin Interface**: Dedicated `/admin-db` page for managing Cosmos DB data
- **Local Development**: Works in both local development and Azure Static Web Apps production environments

## Architecture

### Frontend
- **Admin Page**: `/admin-db` - Complete admin interface for Cosmos DB operations
- **React Components**: Built with React + TypeScript using the same UI components as the main admin page
- **API Integration**: Uses React Query for efficient data fetching and caching

### Backend
- **Local Development**: Express.js server with Cosmos DB routes (`/api/cosmos/*`)
- **Production**: Azure Functions with Cosmos DB integration
- **Database**: Azure Cosmos DB NoSQL container with partitioned storage

## Setup Instructions

### 1. Azure Cosmos DB Setup

1. **Create Cosmos DB Account**:
   - Go to Azure Portal
   - Create a new Cosmos DB account
   - Choose "Core (SQL)" API
   - Select appropriate region and pricing tier

2. **Create Database and Container**:
   - Database ID: `familyTreeDb`
   - Container ID: `members`
   - Partition key: `/id`
   - Provisioned throughput: Start with 400 RU/s (can be scaled)

3. **Get Connection Details**:
   - Copy the endpoint URL
   - Copy the primary key from the Keys section

### 2. Environment Configuration

#### Local Development (.env file)
```bash
# Add these to your .env file
COSMOS_DB_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_DB_PRIMARY_KEY=your-primary-key-here
COSMOS_DB_DATABASE_ID=familyTreeDb
COSMOS_DB_CONTAINER_ID=members
```

#### Azure Functions (local.settings.json)
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_DB_ENDPOINT": "https://your-cosmos-account.documents.azure.com:443/",
    "COSMOS_DB_PRIMARY_KEY": "your-primary-key-here",
    "COSMOS_DB_DATABASE_ID": "familyTreeDb",
    "COSMOS_DB_CONTAINER_ID": "members"
  }
}
```

#### Azure Static Web Apps (Environment Variables)
Set these in the Azure Static Web Apps configuration:
- `COSMOS_DB_ENDPOINT`
- `COSMOS_DB_PRIMARY_KEY`
- `COSMOS_DB_DATABASE_ID`
- `COSMOS_DB_CONTAINER_ID`

### 3. Dependencies

The required dependencies are already included:
- **Functions**: `@azure/cosmos` package in `functions/package.json`
- **Server**: `@azure/cosmos` package in root `package.json`

## Usage

### 1. Access the Admin Interface

Navigate to `/admin-db` in your browser to access the Cosmos DB admin interface.

### 2. Import Data

1. **Check Import Status**: The interface shows the current sync status between JSON and Cosmos DB
2. **Import from JSON**: Click "Import from JSON" to migrate existing family member data
3. **Monitor Progress**: The interface will show import results and any errors

### 3. Manage Family Members

- **View All Members**: Browse all family members with search functionality
- **Add New Member**: Click "Add Member" to create new records
- **Edit Members**: Click the edit button on any member card
- **Delete Members**: Click the delete button (with confirmation)
- **Export Data**: Download current Cosmos DB data as JSON

### 4. Data Format

Cosmos DB records include additional metadata:
```typescript
{
  id: string,              // Cosmos DB document ID (same as externalId)
  externalId: string,      // Original external identifier
  name: string,            // Full name
  born: number | null,     // Birth year
  died: number | null,     // Death year
  biologicalSex: string,   // Male, Female, or Unknown
  notes: string | null,    // Additional notes
  father: string | null,   // Father's external ID
  // ... other fields
  importedAt: string,      // ISO timestamp of import
  importSource: string,    // Source of the data (json-import, admin-db)
  _rid: string,           // Cosmos DB resource ID
  _etag: string,          // Version for optimistic concurrency
  _ts: number             // Cosmos DB timestamp
}
```

## API Endpoints

### Local Development (Express Server)
- `GET /api/cosmos/members` - Get all members
- `GET /api/cosmos/members/:id` - Get single member
- `POST /api/cosmos/members` - Create new member
- `PUT /api/cosmos/members/:id` - Update member
- `DELETE /api/cosmos/members/:id` - Delete member
- `GET /api/cosmos/import/status` - Get import status
- `POST /api/cosmos/import` - Import from JSON
- `DELETE /api/cosmos/import/clear` - Clear all data

### Production (Azure Functions)
Same endpoints available at `/api/cosmos/*` through Azure Functions.

## Monitoring and Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Verify endpoint and key are correct
   - Check if Cosmos DB account is active
   - Ensure firewall settings allow connections

2. **Import Failures**:
   - Check the import status for error details
   - Verify JSON data format
   - Monitor Cosmos DB metrics for throttling

3. **Performance Issues**:
   - Monitor RU consumption in Azure Portal
   - Consider scaling up provisioned throughput
   - Optimize queries and indexing

### Monitoring

- **Azure Portal**: Monitor Cosmos DB metrics, requests, and performance
- **Application Logs**: Check server logs for detailed error information
- **Browser Console**: Monitor network requests and React Query cache

## Security Best Practices

1. **Key Management**:
   - Never commit Cosmos DB keys to version control
   - Use Azure Key Vault for production environments
   - Rotate keys regularly

2. **Access Control**:
   - Use resource tokens for fine-grained access control
   - Implement proper authentication for admin interfaces
   - Monitor access patterns

3. **Network Security**:
   - Configure Cosmos DB firewall rules
   - Use private endpoints for production
   - Enable audit logging

## Cost Optimization

1. **Provisioned Throughput**:
   - Start with minimum 400 RU/s
   - Monitor actual usage and scale accordingly
   - Consider autoscale for variable workloads

2. **Storage**:
   - Monitor document sizes
   - Use TTL for temporary data
   - Consider archiving old records

3. **Queries**:
   - Optimize query patterns
   - Use point reads when possible
   - Monitor query costs

## Future Enhancements

Potential improvements for the Cosmos DB integration:
- **Backup and Restore**: Automated backup procedures
- **Data Validation**: Schema validation for data integrity
- **Audit Trail**: Track all changes with timestamps and user info
- **Advanced Search**: Full-text search capabilities
- **Caching**: Redis cache layer for frequently accessed data
- **Bulk Operations**: Optimize bulk imports and updates