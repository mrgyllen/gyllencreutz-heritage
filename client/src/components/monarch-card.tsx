import React from 'react';
import { Crown, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Monarch } from '@/types/family';
import { getRoyalPortrait } from '@/components/royal-portraits';

interface MonarchCardProps {
  monarch: Monarch;
  isSelected?: boolean;
  onSelect?: (monarch: Monarch) => void;
  showSelectButton?: boolean;
  className?: string;
}

/**
 * MonarchCard component for displaying monarch information in a visually appealing card format
 * 
 * Features:
 * - Visual monarch representation with reign period
 * - Portrait display (placeholder if not available)
 * - Interactive selection state
 * - Hover effects and animations
 * - Responsive design
 */
export function MonarchCard({ 
  monarch, 
  isSelected = false, 
  onSelect, 
  showSelectButton = false,
  className = "" 
}: MonarchCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.getFullYear().toString();
    } catch {
      return dateString;
    }
  };

  const getReignPeriod = () => {
    const fromYear = formatDate(monarch.reignFrom);
    const toYear = formatDate(monarch.reignTo);
    return `${fromYear} - ${toYear}`;
  };

  const getLifePeriod = () => {
    const bornYear = formatDate(monarch.born);
    const diedYear = formatDate(monarch.died);
    return `${bornYear} - ${diedYear}`;
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(monarch);
    }
  };

  return (
    <Card 
      className={`
        transition-all duration-200 hover:shadow-md 
        ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''} 
        ${onSelect ? 'cursor-pointer hover:bg-accent/50' : ''} 
        ${className}
      `}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-semibold text-lg leading-tight">{monarch.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="w-3 h-3" />
                <span>Reigned {getReignPeriod()}</span>
              </div>
            </div>
          </div>
          {isSelected && (
            <Badge variant="default" className="bg-blue-500">
              Selected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Life period */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-3 h-3" />
            <span>Lived {getLifePeriod()}</span>
          </div>

          {/* Portrait or fallback */}
          {monarch.portraitFileName ? (
            <div className="w-16 h-20 flex items-center justify-center">
              {getRoyalPortrait(monarch.name, 'large')}
            </div>
          ) : (
            <div className="w-16 h-20 bg-muted rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <Crown className="w-6 h-6 text-muted-foreground/50" />
            </div>
          )}

          {/* Quote or about text */}
          {monarch.quote && (
            <blockquote className="text-sm italic text-muted-foreground border-l-2 border-muted pl-3">
              "{monarch.quote}"
            </blockquote>
          )}

          {monarch.about && !monarch.quote && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {monarch.about}
            </p>
          )}

          {/* Reign period badge */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {getReignPeriod()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version of MonarchCard for use in selection lists and multi-select components
 */
export function MonarchCardCompact({ 
  monarch, 
  isSelected = false, 
  onSelect, 
  className = "" 
}: MonarchCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.getFullYear().toString();
    } catch {
      return dateString;
    }
  };

  const getReignPeriod = () => {
    const fromYear = formatDate(monarch.reignFrom);
    const toYear = formatDate(monarch.reignTo);
    return `${fromYear}-${toYear}`;
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(monarch);
    }
  };

  return (
    <div 
      className={`
        flex items-center justify-between p-3 rounded-lg border transition-all duration-200
        ${isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-background hover:bg-accent/50'} 
        ${onSelect ? 'cursor-pointer' : ''} 
        ${className}
      `}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <Crown className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <div>
          <div className="font-medium text-sm">{monarch.name}</div>
          <div className="text-xs text-muted-foreground">{getReignPeriod()}</div>
        </div>
      </div>
      {isSelected && (
        <Badge variant="default" className="bg-blue-500 text-xs">
          ✓
        </Badge>
      )}
    </div>
  );
}