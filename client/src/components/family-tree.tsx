import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Users, ChevronDown, ChevronRight, Minus, Plus, Crown, TreePine, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildFamilyTree } from "@/data/family-data";
import { type FamilyMember, type FamilyTreeNode } from "@/types/family";
import { useLanguage } from "@/contexts/language-context";
import { getRoyalPortrait } from "@/components/royal-portraits";
import { getSuccessionIcon } from "@/components/family-coat-of-arms";
import { InteractiveTreeView } from "@/components/interactive-tree-view";
import { GenerationTimeline } from "@/components/generation-timeline";
import { addGenerationData, calculateGenerationStats, filterMembersByBranch } from "@/utils/generation-calculator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FamilyTree() {
  const { t } = useLanguage();
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["0"])); // Start with Lars Tygesson expanded
  const [viewMode, setViewMode] = useState<'detail' | 'tree' | 'generations'>('detail'); // Toggle between detail list, tree view, and generations view
  const [selectedGeneration, setSelectedGeneration] = useState<number | undefined>(undefined);
  const [branchFilter, setBranchFilter] = useState<'all' | 'main' | 'elder' | 'younger'>('all');

  const { data: rawFamilyMembers = [], isLoading, error } = useQuery<FamilyMember[]>({
    queryKey: ['/api/family-members'],
  });

  // Add generation data to family members
  const familyMembers = addGenerationData(rawFamilyMembers);
  const generationStats = calculateGenerationStats(familyMembers, branchFilter);

  const { data: searchResults = [] } = useQuery<FamilyMember[]>({
    queryKey: ['/api/family-members/search', searchQuery],
    enabled: searchQuery.length >= 2,
  });

  const handleSearch = (member: FamilyMember) => {
    setSelectedMember(member);
    setSearchQuery("");
    // Switch to tree view and expand path to the selected member
    setViewMode('tree');
    expandPathToMember(member.externalId);
  };

  const expandPathToMember = (externalId: string) => {
    const newExpanded = new Set(expandedNodes);
    
    // Find the member and all their ancestors
    const member = familyMembers.find(m => m.externalId === externalId);
    if (!member) return;
    
    // Add the member itself
    newExpanded.add(externalId);
    
    // Expand all ancestors by working up the family tree
    const expandAncestors = (memberId: string) => {
      const currentMember = familyMembers.find(m => m.externalId === memberId);
      if (!currentMember) return;
      
      newExpanded.add(memberId);
      
      // Find parent and expand them too
      if (currentMember.father) {
        const parent = familyMembers.find(m => m.name === currentMember.father);
        if (parent) {
          expandAncestors(parent.externalId);
        }
      }
    };
    
    expandAncestors(externalId);
    setExpandedNodes(newExpanded);
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

  // Only filter for generation view, other views should see all members
  let filteredMembers = familyMembers;
  
  if (viewMode === 'generations') {
    // Apply branch filter first for generation view
    filteredMembers = filterMembersByBranch(familyMembers, branchFilter);
    
    // Then filter by selected generation if any
    if (selectedGeneration) {
      filteredMembers = filteredMembers.filter(m => m.generation === selectedGeneration);
    }
  }

  const getBranchColors = (nobleBranch: string | null) => {
    switch (nobleBranch) {
      case null:
      case '':
        return {
          bg: 'bg-green-50 border-green-200',
          border: 'border-green-400',
          line: 'bg-green-600',
          text: 'text-green-800'
        };
      case 'Elder line':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          border: 'border-yellow-500',
          line: 'bg-yellow-600',
          text: 'text-yellow-900'
        };
      case 'Younger line':
        return {
          bg: 'bg-orange-50 border-orange-200',
          border: 'border-orange-400',
          line: 'bg-orange-600',
          text: 'text-orange-800'
        };
      default:
        return {
          bg: 'bg-green-50 border-green-200',
          border: 'border-green-400',
          line: 'bg-green-600',
          text: 'text-green-800'
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
              ${isSelected ? 'border-blue-500 bg-blue-100 shadow-md' : `${branchColors.border} hover:${branchColors.border} hover:bg-opacity-30`}
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

                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {node.isSuccessionSon && getSuccessionIcon('small')}
                {node.diedYoung && (
                  <Badge variant="outline" className="text-xs text-red-600 border-red-300 bg-red-50">
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

  // Create family tree from filtered data  
  const root = filteredMembers.length > 0 ? buildFamilyTree(filteredMembers) : null;

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
            {/* View Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'detail' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('detail')}
                className="flex items-center gap-2 rounded-r-none border-r-0"
              >
                <List className="h-4 w-4" />
                Detail View
              </Button>
              <Button
                variant={viewMode === 'tree' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="flex items-center gap-2 rounded-none border-r-0"
              >
                <TreePine className="h-4 w-4" />
                Tree View
              </Button>
              <Button
                variant={viewMode === 'generations' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('generations')}
                className="flex items-center gap-2 rounded-l-none"
              >
                <Users className="h-4 w-4" />
                Generations
              </Button>
            </div>
            
            {/* Detail View Controls */}
            {(viewMode === 'detail' || viewMode === 'generations') && (
              <>
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
              </>
            )}
          </div>
        </div>



        {/* Tree Legend */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-50 border border-green-400 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Main Branch</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-50 border border-yellow-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Elder Line</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-50 border border-orange-400 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Younger Line</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 flex items-center justify-center relative">
              <svg width="16" height="16" viewBox="0 0 16 16" className="drop-shadow-sm">
                {/* Concept 3: Interlocking Heritage Rings */}
                <circle cx="8" cy="8" r="7" fill="#fef3c7" stroke="#d97706" strokeWidth="1"/>
                <circle cx="6" cy="7" r="3" fill="none" stroke="#b45309" strokeWidth="1.5"/>
                <circle cx="10" cy="9" r="3" fill="none" stroke="#d97706" strokeWidth="1.5"/>
              </svg>
            </div>
            <span className="text-sm text-gray-600">Succession Son</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-sky-100 border border-sky-400 rounded-full mr-2 flex items-center justify-center">
              <span className="text-xs font-bold text-sky-700">3</span>
            </div>
            <span className="text-sm text-gray-600">Children Count</span>
          </div>
          <div className="flex items-center">
            <Badge variant="outline" className="text-xs text-red-600 border-red-300 bg-red-50">
              Died Young
            </Badge>
          </div>
        </div>

        {/* Family Tree Display */}
        {viewMode === 'detail' ? (
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
        ) : viewMode === 'tree' ? (
          <div>
            <div className="text-sm text-gray-600 mb-4 text-center">
              Interactive Family Tree - Use mouse to pan and zoom. Click members for details.
            </div>
            {root ? (
              <InteractiveTreeView 
                root={root}
                onMemberSelect={(member: FamilyTreeNode) => setSelectedMember(member)}
                selectedMember={selectedMember as FamilyTreeNode | null}
                highlightMember={selectedMember?.externalId}
              />
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border">
                <p className="text-gray-600">No family tree data available</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Branch Filter for Generation View */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">View Branch:</label>
                <Select value={branchFilter} onValueChange={(value: 'all' | 'main' | 'elder' | 'younger') => setBranchFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    <SelectItem value="main">Main Line Only</SelectItem>
                    <SelectItem value="elder">Elder Line</SelectItem>
                    <SelectItem value="younger">Younger Line</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Generation Timeline */}
            <GenerationTimeline
              generationStats={generationStats}
              selectedGeneration={selectedGeneration}
              onGenerationSelect={(gen) => setSelectedGeneration(gen === selectedGeneration ? undefined : gen)}
            />
            
            {/* Generation Tree Display */}
            {selectedGeneration && (
              <div className="mt-4">
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border">
                  <div className="text-sm text-gray-600 mb-4">
                    Generation {selectedGeneration} - {filteredMembers.length} members
                  </div>
                  
                  {filteredMembers.length > 0 ? (
                    <div className="font-mono text-sm">
                      {filteredMembers.map((member, index) => (
                        <div key={member.externalId} className="mb-4 p-3 bg-white rounded border">
                          <div 
                            className="cursor-pointer hover:bg-warm-stone/20 p-2 rounded transition-colors"
                            onClick={() => setSelectedMember(member)}
                          >
                            <div className="flex items-center gap-2">
                              {member.isSuccessionSon && (
                                <div className="flex-shrink-0">
                                  {getSuccessionIcon()}
                                </div>
                              )}
                              <span className="font-semibold text-deep-forest">
                                {member.name}
                              </span>
                              <span className="text-sm text-gray-600">
                                ({member.born || '?'} - {member.died || '?'})
                              </span>
                              {member.ageAtDeath && (
                                <span className="text-sm text-gray-500">
                                  Age {member.ageAtDeath}
                                </span>
                              )}
                            </div>
                            {member.notes && (
                              <div className="text-sm text-gray-600 mt-1 pl-6">
                                {member.notes}
                              </div>
                            )}
                            {member.nobleBranch && (
                              <Badge variant="outline" className="mt-1 ml-6 text-xs">
                                {member.nobleBranch}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No family members found for this generation</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!selectedGeneration && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Generation</h3>
                <p className="text-gray-500">Click on any generation card above to view family members from that time period</p>
              </div>
            )}
          </div>
        )}

        {/* Family Member Info Panel */}
        {selectedMember && (
          <div className="mt-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Main info card */}
              <div className="md:col-span-2">
                <Card>
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
                    
                    {selectedMember.notes && (
                      <div>
                        <span className="font-semibold text-gray-700">{t('tree.member.notes')}</span>
                        <p className="text-gray-600 mt-1">{selectedMember.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Monarch timeline card */}
              {selectedMember.monarchDuringLife && selectedMember.monarchDuringLife.length > 0 && (
                <div className="md:col-span-1">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-700 text-sm mb-3">{t('tree.member.monarchs')}</h4>
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-blue-300"></div>
                        
                        {/* Timeline points */}
                        <div className="space-y-3">
                          {selectedMember.monarchDuringLife.map((monarch, index) => (
                            <div key={index} className="flex items-center gap-3 relative">
                              {/* Royal portrait */}
                              <div className="relative z-10">
                                {getRoyalPortrait(monarch, 'small')}
                              </div>
                              
                              {/* Monarch info */}
                              <div className="bg-blue-50 px-3 py-2 rounded-lg text-xs text-blue-800 border border-blue-200 flex-1">
                                <span>{monarch}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}