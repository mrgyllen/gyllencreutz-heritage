import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Users, ChevronDown, ChevronRight, Minus, Plus, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildFamilyTree } from "@/data/family-data";
import { type FamilyMember, type FamilyTreeNode } from "@/types/family";
import { useLanguage } from "@/contexts/language-context";
import { getMonarchPortrait } from "@/components/monarch-portraits";

export function FamilyTree() {
  const { t } = useLanguage();
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["0"])); // Start with Lars Tygesson expanded

  const { data: familyMembers = [], isLoading, error } = useQuery<FamilyMember[]>({
    queryKey: ['/api/family-members'],
  });

  const { data: searchResults = [] } = useQuery<FamilyMember[]>({
    queryKey: ['/api/family-members/search', searchQuery],
    enabled: searchQuery.length >= 2,
  });

  const handleSearch = (member: FamilyMember) => {
    setSelectedMember(member);
    setSearchQuery("");
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set(familyMembers.map(m => m.externalId));
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set(["0"])); // Keep only root expanded
  };

  const getBranchColors = (nobleBranch: string | null) => {
    switch (nobleBranch) {
      case null:
      case '':
        return {
          bg: 'bg-deep-forest/10',
          border: 'border-deep-forest/30',
          line: 'bg-deep-forest/60',
          text: 'text-deep-forest'
        };
      case 'Elder line':
        return {
          bg: 'bg-antique-brass/10',
          border: 'border-antique-brass/30',
          line: 'bg-antique-brass/60',
          text: 'text-antique-brass'
        };
      case 'Younger line':
        return {
          bg: 'bg-warm-stone/20',
          border: 'border-warm-stone/40',
          line: 'bg-warm-stone/60',
          text: 'text-warm-stone'
        };
      default:
        return {
          bg: 'bg-deep-forest/10',
          border: 'border-deep-forest/30',
          line: 'bg-deep-forest/60',
          text: 'text-deep-forest'
        };
    }
  };

  const renderFamilyNode = (node: FamilyTreeNode, depth: number = 0, isLast: boolean = false): JSX.Element => {
    const isSelected = selectedMember?.externalId === node.externalId;
    const isExpanded = expandedNodes.has(node.externalId);
    const hasChildren = node.children && node.children.length > 0;
    const branchColors = getBranchColors(node.nobleBranch);
    
    return (
      <div key={node.externalId} className="relative">
        {/* Connecting lines */}
        {depth > 0 && (
          <>
            {/* Horizontal line to parent */}
            <div 
              className={`absolute left-[-20px] top-6 w-5 h-px ${branchColors.line}`}
              style={{ left: `${(depth - 1) * 24 - 20}px` }}
            />
            {/* Vertical line from parent */}
            {!isLast && (
              <div 
                className={`absolute top-12 h-full w-px ${branchColors.line}`}
                style={{ left: `${(depth - 1) * 24 - 20}px` }}
              />
            )}
          </>
        )}

        <div className="flex items-start">
          {/* Expand/Collapse Button */}
          <div className="flex items-center mr-2" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNode(node.externalId)}
                className="p-1 h-6 w-6 hover:bg-gray-200"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            {!hasChildren && <div className="w-6 h-6" />}
          </div>

          {/* Member Card */}
          <div 
            className={`
              flex-1 p-3 mb-2 rounded-lg border cursor-pointer transition-all
              ${isSelected ? 'border-antique-brass bg-antique-brass bg-opacity-20' : `${branchColors.border} hover:${branchColors.border} hover:bg-opacity-30`}
              ${branchColors.bg}
            `}
            onClick={() => setSelectedMember(node)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className={`h-4 w-4 mr-2 ${branchColors.text}`} />
                <div>
                  <h4 className="font-semibold text-sm">{node.name}</h4>
                  <div className="text-xs text-gray-600">
                    {node.born || '?'} - {node.died || '?'}
                  </div>
                  {/* Monarch portraits */}
                  {node.monarchDuringLife && node.monarchDuringLife.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Crown className="h-3 w-3 text-antique-brass" />
                      <div className="flex gap-1">
                        {node.monarchDuringLife.map((monarch, idx) => (
                          <div key={idx} className="flex items-center">
                            {getMonarchPortrait(monarch)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {node.isSuccessionSon && (
                  <Badge variant="secondary" className="bg-antique-brass text-white text-xs">
                    Succession Son
                  </Badge>
                )}
                {node.diedYoung && (
                  <Badge variant="destructive" className="text-xs">
                    Died Young
                  </Badge>
                )}
                {node.nobleBranch && (
                  <Badge variant="outline" className={`text-xs ${branchColors.bg} ${branchColors.text} ${branchColors.border}`}>
                    {node.nobleBranch}
                  </Badge>
                )}
                {hasChildren && (
                  <Badge variant="outline" className="text-xs">
                    {node.children.length} child{node.children.length !== 1 ? 'ren' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {node.children.map((child, index) => 
              renderFamilyNode(child, depth + 1, index === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-forest"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading family tree data</p>
      </div>
    );
  }

  const root = buildFamilyTree(familyMembers);

  return (
    <section id="tree" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-deep-forest mb-4">
            {t('tree.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('tree.subtitle')}
          </p>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 justify-center items-center mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder={t('tree.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-forest focus:border-transparent"
            />
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {searchResults.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleSearch(member)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-600">
                      {member.born || '?'} - {member.died || '?'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="flex items-center gap-2"
            >
              <Minus className="h-4 w-4" />
              Collapse All
            </Button>
          </div>
        </div>

        {/* Tree Legend */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-deep-forest/10 border border-deep-forest/30 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Main Branch</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-antique-brass/10 border border-antique-brass/30 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Elder Line</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-warm-stone/20 border border-warm-stone/40 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Younger Line</span>
          </div>
          <div className="flex items-center">
            <Badge variant="secondary" className="bg-antique-brass text-white text-xs">
              Succession Son
            </Badge>
          </div>
          <div className="flex items-center">
            <Badge variant="destructive" className="text-xs">
              Died Young
            </Badge>
          </div>
          <div className="flex items-center">
            <Crown className="h-4 w-4 text-antique-brass mr-2" />
            <span className="text-sm text-gray-600">Reigning Monarchs</span>
          </div>
        </div>

        {/* Family Tree in Confined Space */}
        <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto border">
          <div className="text-sm text-gray-600 mb-4">
            Starting with Lars Tygesson ({familyMembers.length} total members) - spanning from 1515 to 1980s
          </div>
          {root ? (
            <div className="font-mono text-sm">
              {renderFamilyNode(root)}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No family tree data available</p>
            </div>
          )}
        </div>

        {/* Family Member Info Panel */}
        {selectedMember && (
          <div className="mt-8">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-playfair font-bold text-deep-forest">
                    {selectedMember.name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedMember(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-semibold text-gray-700">{t('tree.member.born')}</span>
                    <span className="text-gray-600 ml-2">{selectedMember.born || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">{t('tree.member.died')}</span>
                    <span className="text-gray-600 ml-2">{selectedMember.died || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">{t('tree.member.age')}</span>
                    <span className="text-gray-600 ml-2">{selectedMember.ageAtDeath || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Branch:</span>
                    <span className="text-gray-600 ml-2">{selectedMember.nobleBranch || 'Main line'}</span>
                  </div>
                </div>
                
                {selectedMember.monarchDuringLife && selectedMember.monarchDuringLife.length > 0 && (
                  <div className="mb-4">
                    <span className="font-semibold text-gray-700">{t('tree.member.monarchs')}</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedMember.monarchDuringLife.map((monarch, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          {getMonarchPortrait(monarch)}
                          <span className="text-sm text-gray-700">{monarch}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedMember.notes && (
                  <div>
                    <span className="font-semibold text-gray-700">{t('tree.member.notes')}</span>
                    <p className="text-gray-600 mt-1">{selectedMember.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}