import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, Crown } from "lucide-react";
import { type GenerationStats } from "@/utils/generation-calculator";
import { useLanguage } from "@/contexts/language-context";

interface GenerationTimelineProps {
  generationStats: GenerationStats[];
  selectedGeneration?: number;
  onGenerationSelect?: (generation: number) => void;
}

export const GenerationTimeline: React.FC<GenerationTimelineProps> = ({
  generationStats,
  selectedGeneration,
  onGenerationSelect
}) => {
  const { t } = useLanguage();

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-deep-forest">
            {t('tree.generations.timeline')}
          </h3>
          <Badge variant="outline" className="bg-warm-stone text-deep-forest">
            {generationStats.length} {t('tree.generations.total')}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {generationStats.map((stats) => (
            <div
              key={stats.generation}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                selectedGeneration === stats.generation
                  ? 'bg-antique-brass/20 border-antique-brass ring-1 ring-antique-brass'
                  : 'bg-parchment hover:bg-warm-stone/30 border-warm-stone/50'
              }`}
              onClick={() => onGenerationSelect?.(stats.generation)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-deep-forest">
                  Gen {stats.generation}
                </span>
                {stats.successionSons > 0 && (
                  <Crown className="h-4 w-4 text-antique-brass" />
                )}
              </div>
              
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{stats.count} members</span>
                </div>
                
                {stats.timeSpan.earliest && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {stats.timeSpan.earliest}
                      {stats.timeSpan.latest && stats.timeSpan.latest !== stats.timeSpan.earliest 
                        ? `-${stats.timeSpan.latest}` 
                        : ''}
                    </span>
                  </div>
                )}
                
                {stats.avgLifespan && (
                  <div className="text-gray-500">
                    Avg: {stats.avgLifespan} years
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};