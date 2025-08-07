/**
 * Custom hook for monarch timeline validation using backend API
 * 
 * This ensures we use Cosmos DB as the single source of truth for timeline calculations
 * instead of duplicating logic on the frontend.
 */

import { useQuery } from '@tanstack/react-query';
import { type Monarch } from '@/types/family';
import { monarchsApi } from '@/lib/api';

interface UseMonarchTimelineParams {
  memberId?: string;
  memberBornYear?: number | null;
  memberDiedYear?: number | null;
}

interface TimelineValidationResult {
  timelineValidMonarchs: Monarch[];
  timelineValidCount: number;
  isLoading: boolean;
  error: any;
  allMonarchs: Monarch[];
  isMonarchTimelineValid: (monarchId: string) => boolean;
}

export function useMonarchTimeline({ 
  memberId, 
  memberBornYear, 
  memberDiedYear 
}: UseMonarchTimelineParams): TimelineValidationResult {
  
  // Query for ALL monarchs
  const { data: allMonarchs = [], isLoading: allMonarchsLoading, error: allMonarchsError } = useQuery<Monarch[]>({
    queryKey: ['/api/cosmos/monarchs'],
    queryFn: monarchsApi.getAll,
    retry: 2,
  });
  
  // Query for timeline-valid monarchs only when we have member data
  const shouldQueryTimeline = Boolean(memberId || (memberBornYear && memberBornYear > 0));
  
  const { data: timelineValidMonarchs = [], isLoading: timelineLoading, error: timelineError } = useQuery<Monarch[]>({
    queryKey: ['/api/cosmos/members', memberId || 'temp', 'monarchs', memberBornYear, memberDiedYear],
    queryFn: async () => {
      if (memberId) {
        // Use existing member ID for timeline validation
        const response = await fetch(`/api/cosmos/members/${memberId}/monarchs`);
        if (!response.ok) {
          throw new Error('Failed to fetch timeline monarchs');
        }
        const result = await response.json();
        return result.data || [];
      } else if (memberBornYear && allMonarchs.length > 0) {
        // For new members, use the bulk update dry run API to calculate timeline
        const response = await fetch('/api/cosmos/members/bulk-update-monarchs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dryRun: true,
            membersData: [{
              born: memberBornYear,
              died: memberDiedYear || 9999
            }]
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to calculate timeline monarchs');
        }
        
        const result = await response.json();
        // Extract monarch IDs from the dry run result
        const monarchIds = result.data?.report?.[0]?.monarchIds || [];
        
        // Filter all monarchs to only timeline-valid ones
        return allMonarchs.filter((monarch: Monarch) => monarchIds.includes(monarch.id));
      }
      
      return [];
    },
    enabled: shouldQueryTimeline && allMonarchs.length > 0, // Wait for all monarchs to load first
    staleTime: 5 * 60 * 1000, // 5 minutes - timeline calculations are stable
    retry: 2,
  });

  // Create validation function
  const isMonarchTimelineValid = (monarchId: string): boolean => {
    return timelineValidMonarchs.some(monarch => monarch.id === monarchId);
  };

  return {
    timelineValidMonarchs,
    timelineValidCount: timelineValidMonarchs.length,
    isLoading: allMonarchsLoading || timelineLoading,
    error: allMonarchsError || timelineError,
    allMonarchs,
    isMonarchTimelineValid,
  };
}