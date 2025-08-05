import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Crown, Calculator, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MonarchCardCompact } from '@/components/monarch-card';
import { type Monarch } from '@/types/family';

interface MonarchSelectorProps {
  /** Available monarchs to select from */
  monarchs: Monarch[];
  /** Currently selected monarch IDs */
  selectedMonarchIds: string[];
  /** Callback when selection changes */
  onSelectionChange: (monarchIds: string[]) => void;
  /** Family member's birth year for timeline validation */
  memberBornYear?: number | null;
  /** Family member's death year for timeline validation */
  memberDiedYear?: number | null;
  /** Whether to show only timeline-valid monarchs */
  showOnlyTimelineValid?: boolean;
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
  monarchs,
  selectedMonarchIds,
  onSelectionChange,
  memberBornYear,
  memberDiedYear,
  showOnlyTimelineValid = false,
  showAutoCalculate = true,
  onAutoCalculate,
  disabled = false,
  placeholder = "Select monarchs...",
  className = ""
}: MonarchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Get selected monarchs objects
  const selectedMonarchs = useMemo(() => {
    return monarchs.filter(monarch => selectedMonarchIds.includes(monarch.id));
  }, [monarchs, selectedMonarchIds]);

  // Filter monarchs based on timeline validation
  const filteredMonarchs = useMemo(() => {
    if (!showOnlyTimelineValid || !memberBornYear) {
      return monarchs;
    }

    return monarchs.filter(monarch => {
      const bornDate = new Date(`${memberBornYear}-01-01`);
      const diedDate = memberDiedYear && memberDiedYear !== 9999 
        ? new Date(`${memberDiedYear}-12-31`) 
        : new Date(); // If still alive, use current date

      const reignFromDate = new Date(monarch.reignFrom);
      const reignToDate = new Date(monarch.reignTo);

      // Check if reign overlaps with lifetime
      return reignFromDate <= diedDate && reignToDate >= bornDate;
    });
  }, [monarchs, memberBornYear, memberDiedYear, showOnlyTimelineValid]);

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
    onSelectionChange(selectedMonarchIds.filter(id => id !== monarchId));
  };

  const handleAutoCalculate = () => {
    if (onAutoCalculate) {
      onAutoCalculate();
      setOpen(false);
    }
  };

  const getTimelineStatusMessage = () => {
    if (!memberBornYear) {
      return "Birth year required for timeline validation";
    }

    const timelineValidCount = filteredMonarchs.length;
    const totalCount = monarchs.length;

    if (showOnlyTimelineValid) {
      return `Showing ${timelineValidCount} monarchs that reigned during lifetime (${memberBornYear} - ${memberDiedYear || 'present'})`;
    } else {
      return `${timelineValidCount} of ${totalCount} monarchs reigned during lifetime (${memberBornYear} - ${memberDiedYear || 'present'})`;
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

      <div className="flex gap-2">
        {/* Main selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
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
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search monarchs..." 
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandEmpty>No monarchs found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[300px]">
                  {searchFilteredMonarchs.map((monarch) => {
                    const isSelected = selectedMonarchIds.includes(monarch.id);
                    const isTimelineValid = filteredMonarchs.includes(monarch);
                    
                    return (
                      <CommandItem
                        key={monarch.id}
                        value={monarch.id}
                        onSelect={() => handleSelect(monarch)}
                        className="p-0"
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
                        {!isTimelineValid && memberBornYear && (
                          <div className="text-xs text-muted-foreground ml-2">
                            Outside lifetime
                          </div>
                        )}
                      </CommandItem>
                    );
                  })}
                </ScrollArea>
              </CommandGroup>

              {/* Footer with controls */}
              <div className="border-t p-2 flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  {selectedMonarchs.length} selected
                </div>
                
                <div className="flex gap-2">
                  {memberBornYear && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Toggle timeline filter
                        // This could be handled by parent component
                      }}
                      className="text-xs"
                    >
                      <Search className="w-3 h-3 mr-1" />
                      {showOnlyTimelineValid ? 'Show All' : 'Filter by Timeline'}
                    </Button>
                  )}
                </div>
              </div>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Auto-calculate button */}
        {showAutoCalculate && onAutoCalculate && memberBornYear && (
          <Button
            variant="outline"
            onClick={handleAutoCalculate}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Auto-calculate
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Simple monarch selector for basic use cases without timeline validation
 */
export function SimpleMonarchSelector({
  monarchs,
  selectedMonarchIds,
  onSelectionChange,
  disabled = false,
  placeholder = "Select monarchs...",
  className = ""
}: Pick<MonarchSelectorProps, 'monarchs' | 'selectedMonarchIds' | 'onSelectionChange' | 'disabled' | 'placeholder' | 'className'>) {
  return (
    <MonarchSelector
      monarchs={monarchs}
      selectedMonarchIds={selectedMonarchIds}
      onSelectionChange={onSelectionChange}
      showOnlyTimelineValid={false}
      showAutoCalculate={false}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
}