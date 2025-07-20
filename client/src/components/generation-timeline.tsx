import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, Crown, Calendar, TreePine, Sparkles } from "lucide-react";
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
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <TreePine className="h-6 w-6 text-deep-forest" />
          <h3 className="text-xl font-playfair font-bold text-deep-forest">
            Generation Timeline
          </h3>
          <TreePine className="h-6 w-6 text-deep-forest" />
        </div>
        <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
          Explore {generationStats.length} generations spanning over 450 years of noble Swedish history
        </p>
        <div className="flex justify-center">
          <Badge variant="outline" className="bg-parchment border-antique-brass text-deep-forest px-4 py-2">
            <Calendar className="h-4 w-4 mr-2" />
            {generationStats.length} {t('tree.generations.total')}
          </Badge>
        </div>
      </div>
      
      {/* Timeline with Visual Enhancements */}
      <div className="relative">
        {/* Timeline Background Line */}
        <div className="absolute top-8 left-4 right-4 h-0.5 bg-gradient-to-r from-warm-stone via-antique-brass to-warm-stone opacity-30 rounded-full"></div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 relative z-10">
          {generationStats.map((stats) => (
            <div
              key={stats.generation}
              className={`relative p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                selectedGeneration === stats.generation
                  ? 'bg-gradient-to-br from-antique-brass/20 to-antique-brass/10 border-antique-brass shadow-lg ring-2 ring-antique-brass/50'
                  : 'bg-gradient-to-br from-parchment to-white hover:from-warm-stone/20 hover:to-parchment border-warm-stone/40 hover:border-antique-brass/60 shadow-md hover:shadow-lg'
              }`}
              onClick={() => onGenerationSelect?.(stats.generation)}
            >
              {/* Generation Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    selectedGeneration === stats.generation ? 'bg-antique-brass' : 'bg-deep-forest'
                  }`}></div>
                  <span className="font-bold text-deep-forest text-sm font-playfair">
                    Gen {stats.generation}
                  </span>
                </div>
                {stats.successionSons > 0 && (
                  <div className="relative">
                    <Crown className="h-4 w-4 text-antique-brass drop-shadow-sm" />
                    {stats.successionSons > 1 && (
                      <Sparkles className="h-2 w-2 text-antique-brass absolute -top-1 -right-1" />
                    )}
                  </div>
                )}
              </div>
              
              {/* Statistics */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-deep-forest font-medium">
                    <Users className="h-3 w-3" />
                    <span>{stats.count} members</span>
                  </div>
                </div>
                
                {stats.timeSpan.earliest && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span className="truncate font-mono text-xs">
                      {stats.timeSpan.earliest}
                      {stats.timeSpan.latest && stats.timeSpan.latest !== stats.timeSpan.earliest 
                        ? `-${stats.timeSpan.latest}` 
                        : ''}
                    </span>
                  </div>
                )}
                
                {stats.avgLifespan && (
                  <div className="text-gray-500 text-center bg-gray-50 rounded px-2 py-1">
                    <span className="font-medium">~{stats.avgLifespan}</span> years
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};