import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Crown, Calculator, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Command components removed - using simple div-based layout for better rendering control
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// ScrollArea removed - using simple div with overflow-y-auto for better control
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MonarchCardCompact } from '@/components/monarch-card';
import { type Monarch } from '@/types/family';

interface MonarchSelectorProps {
  /** All available monarchs to select from */
  allMonarchs: Monarch[];
  /** Timeline-valid monarch IDs for this family member */
  timelineValidMonarchIds: string[];
  /** Currently selected monarch IDs */
  selectedMonarchIds: string[];
  /** Callback when selection changes */
  onSelectionChange: (monarchIds: string[]) => void;
  /** Family member's birth year for display */
  memberBornYear?: number | null;
  /** Family member's death year for display */
  memberDiedYear?: number | null;
  /** Whether to show the auto-calculate button */
  showAutoCalculate?: boolean;
  /** Callback for auto-calculate action */
  onAutoCalculate?: () => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * MonarchSelector - Multi-select component for choosing monarchs with timeline validation
 * 
 * Features:
 * - Multi-select with autocomplete search
 * - Timeline validation (only show monarchs that overlap with member's lifetime)
 * - Visual selected monarchs as badges
 * - Auto-calculate functionality using existing API
 * - Compact monarch display in dropdown
 * - Keyboard navigation support
 */
export function MonarchSelector({
  allMonarchs,
  timelineValidMonarchIds,
  selectedMonarchIds,
  onSelectionChange,
  memberBornYear,
  memberDiedYear,
  showAutoCalculate = true,
  onAutoCalculate,
  disabled = false,
  placeholder = "Select monarchs...",
  className = ""
}: MonarchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isAutoCalculating, setIsAutoCalculating] = useState(false);
  const [showAllMonarchs, setShowAllMonarchs] = useState(true); // New state for filter toggle

  // Get selected monarchs objects
  const selectedMonarchs = useMemo(() => {
    return allMonarchs.filter(monarch => selectedMonarchIds.includes(monarch.id));
  }, [allMonarchs, selectedMonarchIds]);

  // Simple filtering logic: show all vs timeline-valid only
  const filteredMonarchs = useMemo(() => {
    if (!showAllMonarchs && memberBornYear) {
      // Show only timeline-valid monarchs
      return allMonarchs.filter(monarch => timelineValidMonarchIds.includes(monarch.id));
    }
    
    // Show all monarchs
    return allMonarchs;
  }, [allMonarchs, timelineValidMonarchIds, showAllMonarchs, memberBornYear]);

  // Filter monarchs based on search
  const searchFilteredMonarchs = useMemo(() => {
    if (!searchValue) return filteredMonarchs;
    
    const search = searchValue.toLowerCase();
    return filteredMonarchs.filter(monarch => 
      monarch.name.toLowerCase().includes(search) ||
      monarch.id.toLowerCase().includes(search)
    );
  }, [filteredMonarchs, searchValue]);

  const handleSelect = (monarch: Monarch) => {
    const isSelected = selectedMonarchIds.includes(monarch.id);
    
    if (isSelected) {
      // Remove from selection
      onSelectionChange(selectedMonarchIds.filter(id => id !== monarch.id));
    } else {
      // Add to selection
      onSelectionChange([...selectedMonarchIds, monarch.id]);
    }
  };

  const handleRemoveSelected = (monarchId: string) => {
    try {
      const updatedIds = selectedMonarchIds.filter(id => id !== monarchId);
      onSelectionChange(updatedIds);
    } catch (error) {
      console.error('Error removing monarch:', error);
      // Don't let the error propagate and potentially close the form
    }
  };

  const handleAutoCalculate = () => {
    if (onAutoCalculate) {
      setIsAutoCalculating(true);
      onAutoCalculate();
      // Don't close the dropdown - let user see the results and choose to save manually
      // setOpen(false); // Removed to improve UX
      
      // Keep dropdown open after auto-calculate
      setTimeout(() => {
        setIsAutoCalculating(false);
      }, 100);
    }
  };

  // Prevent dropdown from closing when selectedMonarchIds change due to auto-calculate
  useEffect(() => {
    if (isAutoCalculating) {
      // Ensure dropdown stays open during auto-calculate
      setOpen(true);
    }
  }, [selectedMonarchIds, isAutoCalculating]);

  const getTimelineStatusMessage = () => {
    if (!memberBornYear) {
      return "Birth year required for timeline validation";
    }

    const totalCount = allMonarchs.length;
    const timelineValidCount = timelineValidMonarchIds.length;

    if (showAllMonarchs) {
      return `Showing all ${totalCount} monarchs • ${timelineValidCount} reigned during lifetime (${memberBornYear} - ${memberDiedYear || 'present'})`;
    } else {
      return `Showing ${timelineValidCount} monarchs that reigned during lifetime (${memberBornYear} - ${memberDiedYear || 'present'})`;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Selected monarchs display */}
      {selectedMonarchs.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {selectedMonarchs.map((monarch) => (
              <Badge 
                key={monarch.id} 
                variant="secondary" 
                className="flex items-center gap-1 pr-1"
              >
                <Crown className="w-3 h-3" />
                {monarch.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveSelected(monarch.id)}
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Timeline status message */}
      {memberBornYear && (
        <Alert className="mb-3">
          <Crown className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {getTimelineStatusMessage()}
          </AlertDescription>
        </Alert>
      )}

      {/* Main selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              {selectedMonarchs.length > 0 
                ? `${selectedMonarchs.length} monarch${selectedMonarchs.length > 1 ? 's' : ''} selected`
                : placeholder
              }
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 max-h-[500px]" align="start">
          <div className="p-2">
            <input 
              type="text"
              placeholder="Search monarchs..." 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
            />
          </div>
          
          <div className="border-t">
            <div className="h-[400px] overflow-y-auto">
              {(() => {
                console.log(`🔍 UI Debug: Rendering ${searchFilteredMonarchs.length} monarchs out of ${allMonarchs.length} total`);
                console.log(`🔍 Filtered monarchs:`, searchFilteredMonarchs.map(m => m.name));
                return null;
              })()}
              
              {searchFilteredMonarchs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No monarchs found.</div>
              ) : (
                searchFilteredMonarchs.map((monarch) => {
                  const isSelected = selectedMonarchIds.includes(monarch.id);
                  const isTimelineValid = timelineValidMonarchIds.includes(monarch.id);
                  
                  return (
                    <div
                      key={monarch.id}
                      onClick={() => handleSelect(monarch)}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                    >
                      <MonarchCardCompact
                        monarch={monarch}
                        isSelected={isSelected}
                        onSelect={handleSelect}
                        className={cn(
                          "w-full",
                          !isTimelineValid && memberBornYear && "opacity-60"
                        )}
                      />
                      {memberBornYear && (
                        <div className={cn(
                          "text-xs ml-2 font-medium",
                          isTimelineValid 
                            ? "text-green-600 bg-green-50 px-2 py-1 rounded" 
                            : "text-gray-500"
                        )}>
                          {isTimelineValid ? "✅ Reigned during lifetime" : "⭕ Outside lifetime"}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

            {/* Footer with controls */}
            <div className="border-t p-2 flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                {selectedMonarchs.length} selected
              </div>
              
              <div className="flex gap-2">
                {/* Auto-calculate button integrated into the footer */}
                {showAutoCalculate && onAutoCalculate && memberBornYear && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoCalculate}
                    disabled={disabled}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Calculator className="w-3 h-3" />
                    Auto-calculate
                  </Button>
                )}
                
                {memberBornYear && (
                  <Button
                    variant={showAllMonarchs ? "outline" : "default"}
                    size="sm"
                    onClick={() => setShowAllMonarchs(!showAllMonarchs)}
                    className="text-xs"
                  >
                    <Search className="w-3 h-3 mr-1" />
                    {showAllMonarchs ? 'Filter by Timeline' : 'Show All'}
                  </Button>
                )}
              </div>
            </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Simple monarch selector for basic use cases without timeline validation
 */
export function SimpleMonarchSelector({
  allMonarchs,
  selectedMonarchIds,
  onSelectionChange,
  disabled = false,
  placeholder = "Select monarchs...",
  className = ""
}: Pick<MonarchSelectorProps, 'allMonarchs' | 'selectedMonarchIds' | 'onSelectionChange' | 'disabled' | 'placeholder' | 'className'>) {
  return (
    <MonarchSelector
      allMonarchs={allMonarchs}
      timelineValidMonarchIds={[]} // No timeline validation for simple selector
      selectedMonarchIds={selectedMonarchIds}
      onSelectionChange={onSelectionChange}
      showAutoCalculate={false}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
}