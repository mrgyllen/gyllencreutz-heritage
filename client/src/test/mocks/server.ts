/**
 * Mock Service Worker (MSW) server configuration
 * Provides API mocking for testing components that make HTTP requests
 */

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { mockFamilyMembers } from './data';
import type { CosmosDbFamilyMember } from '@/types/family';

export const handlers = [
  // GET /api/cosmos/members - Mock family members API
  http.get('/api/cosmos/members', () => {
    return HttpResponse.json(mockFamilyMembers);
  }),

  // GET /api/cosmos/members/:id - Mock single family member API
  http.get('/api/cosmos/members/:id', ({ params }) => {
    const { id } = params;
    const member = mockFamilyMembers.find(m => m.id === id || m.externalId === id);
    
    if (!member) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json(member);
  }),

  // POST /api/cosmos/members - Mock create family member API
  http.post('/api/cosmos/members', async ({ request }) => {
    const newMember = await request.json() as CosmosDbFamilyMember;
    const member = {
      ...newMember,
      id: newMember.id || `test-${Date.now()}`,
      importedAt: new Date().toISOString(),
      importSource: 'test',
    };
    
    return HttpResponse.json(member, { status: 201 });
  }),

  // PUT /api/cosmos/members/:id - Mock update family member API
  http.put('/api/cosmos/members/:id', async ({ params, request }) => {
    const { id } = params;
    const updateData = await request.json() as Partial<CosmosDbFamilyMember>;
    const member = mockFamilyMembers.find(m => m.id === id || m.externalId === id);
    
    if (!member) {
      return new HttpResponse(null, { status: 404 });
    }
    
    const updatedMember = { ...member, ...updateData };
    return HttpResponse.json(updatedMember);
  }),

  // DELETE /api/cosmos/members/:id - Mock delete family member API
  http.delete('/api/cosmos/members/:id', ({ params }) => {
    const { id } = params;
    const member = mockFamilyMembers.find(m => m.id === id || m.externalId === id);
    
    if (!member) {
      return new HttpResponse(null, { status: 404 });
    }
    
    return HttpResponse.json({ 
      message: 'Family member deleted successfully', 
      member 
    });
  }),

  // GET /api/cosmos/import/status - Mock import status API
  http.get('/api/cosmos/import/status', () => {
    return HttpResponse.json({
      jsonFile: { count: mockFamilyMembers.length, available: true },
      cosmosDb: { count: mockFamilyMembers.length, available: true },
      needsImport: false,
      inSync: true,
    });
  }),

  // GET /api/github/status - Mock GitHub sync status API
  http.get('/api/github/status', () => {
    return HttpResponse.json({
      available: true,
      connected: true,
      configured: true,
      lastSync: new Date().toISOString(),
      pendingOperations: 0,
      error: null,
    });
  }),
];

export const server = setupServer(...handlers);