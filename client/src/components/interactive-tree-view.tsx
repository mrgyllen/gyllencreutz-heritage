import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import { type FamilyTreeNode } from "@/types/family";
import { getRoyalPortrait } from "@/components/royal-portraits";
import { getSuccessionIcon } from "@/components/family-coat-of-arms";

interface InteractiveTreeViewProps {
  root: FamilyTreeNode;
  onMemberSelect: (member: FamilyTreeNode) => void;
  selectedMember: FamilyTreeNode | null;
  highlightMember?: string; // External ID to highlight and center on
}

export const InteractiveTreeView: React.FC<InteractiveTreeViewProps> = ({
  root,
  onMemberSelect,
  selectedMember,
  highlightMember
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  
  const nodeWidth = 220;
  const nodeHeight = 100;
  const levelHeight = 140; // Increased for org chart style spacing

  useEffect(() => {
    if (!svgRef.current || !root) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const width = 1200;
    const height = 800;
    
    // Create hierarchy
    const hierarchy = d3.hierarchy(root);
    
    // Add gradient definitions for coat of arms background
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'amberGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', '#fbbf24') // amber-400
      .style('stop-opacity', 1);
      
    gradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', '#f59e0b') // amber-500
      .style('stop-opacity', 1);
    const treeLayout = d3.tree<FamilyTreeNode>()
      .size([width - 100, height - 100])
      .nodeSize([nodeWidth + 60, levelHeight + 40]); // More space for org chart connectors

    const treeData = treeLayout(hierarchy);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const { x, y, k } = event.transform;
        setTransform({ x, y, k });
        g.attr('transform', `translate(${x},${y}) scale(${k})`);
      });

    svg.call(zoom);

    // Define additional patterns for tree visualization if needed

    // Create main group
    const g = svg.append('g')
      .attr('class', 'tree-group')
      .attr('transform', `translate(${width/2},50)`);

    // Create organizational chart-style links (family connections)
    const links = g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('g')
      .attr('class', 'link-group');

    // Draw organizational chart connectors
    links.each(function(d) {
      const linkGroup = d3.select(this);
      const source = d.source;
      const target = d.target;
      
      // Vertical line from parent
      linkGroup.append('line')
        .attr('x1', source.x)
        .attr('y1', source.y + nodeHeight/2)
        .attr('x2', source.x)
        .attr('y2', source.y + nodeHeight/2 + 30)
        .style('stroke', '#8B7355')
        .style('stroke-width', '2px');
      
      // Horizontal connecting line to child
      linkGroup.append('line')
        .attr('x1', source.x)
        .attr('y1', source.y + nodeHeight/2 + 30)
        .attr('x2', target.x)
        .attr('y2', source.y + nodeHeight/2 + 30)
        .style('stroke', '#8B7355')
        .style('stroke-width', '2px');
      
      // Vertical line down to child
      linkGroup.append('line')
        .attr('x1', target.x)
        .attr('y1', source.y + nodeHeight/2 + 30)
        .attr('x2', target.x)
        .attr('y2', target.y - nodeHeight/2)
        .style('stroke', '#8B7355')
        .style('stroke-width', '2px');
    });

    // Add connection dots at joints for visual clarity
    links.each(function(d) {
      const linkGroup = d3.select(this);
      const source = d.source;
      const target = d.target;
      
      // Dot at the horizontal junction
      linkGroup.append('circle')
        .attr('cx', target.x)
        .attr('cy', source.y + nodeHeight/2 + 30)
        .attr('r', 3)
        .style('fill', '#8B7355');
    });

    // Create node groups
    const nodes = g.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d: d3.HierarchyPointNode<FamilyTreeNode>) => {
        event.stopPropagation();
        onMemberSelect(d.data);
      });

    // Add node backgrounds
    nodes.append('rect')
      .attr('x', -nodeWidth/2)
      .attr('y', -nodeHeight/2)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 8)
      .style('fill', (d: d3.HierarchyPointNode<FamilyTreeNode>) => {
        const isSelected = selectedMember && d.data.externalId === selectedMember.externalId;
        const isHighlighted = highlightMember && d.data.externalId === highlightMember;
        
        if (isSelected || isHighlighted) {
          return '#dbeafe'; // blue-100
        }
        switch (d.data.nobleBranch) {
          case 'Elder line': return '#fef3c7'; // yellow-100
          case 'Younger line': return '#fed7aa'; // orange-100
          default: return '#f0fdf4'; // green-50
        }
      })
      .style('stroke', (d: d3.HierarchyPointNode<FamilyTreeNode>) => {
        const isSelected = selectedMember && d.data.externalId === selectedMember.externalId;
        const isHighlighted = highlightMember && d.data.externalId === highlightMember;
        
        if (isSelected || isHighlighted) {
          return '#3b82f6'; // blue-500
        }
        switch (d.data.nobleBranch) {
          case 'Elder line': return '#f59e0b'; // yellow-500
          case 'Younger line': return '#f97316'; // orange-500
          default: return '#22c55e'; // green-500
        }
      })
      .style('stroke-width', (d: d3.HierarchyPointNode<FamilyTreeNode>) => {
        const isSelected = selectedMember && d.data.externalId === selectedMember.externalId;
        const isHighlighted = highlightMember && d.data.externalId === highlightMember;
        return (isSelected || isHighlighted) ? 3 : 2;
      });

    // Add member names
    nodes.append('text')
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .text((d: d3.HierarchyPointNode<FamilyTreeNode>) => d.data.name.length > 22 ? d.data.name.substring(0, 22) + '...' : d.data.name);

    // Add birth-death dates
    nodes.append('text')
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#6b7280')
      .text((d: d3.HierarchyPointNode<FamilyTreeNode>) => `${d.data.born || '?'} - ${d.data.died || '?'}`);

    // Add enhanced visual indicators
    nodes.each(function(this: SVGGElement, d: d3.HierarchyPointNode<FamilyTreeNode>) {
      const node = d3.select(this);
      let badgeY = 8;
      let leftX = -nodeWidth/2 + 8;
      let rightX = nodeWidth/2 - 8;
      
      // Children count (top-left)
      if (d.children && d.children.length > 0) {
        const childCount = d.children.length;
        
        // Background circle for children count
        node.append('circle')
          .attr('cx', leftX + 10)
          .attr('cy', badgeY)
          .attr('r', 8)
          .style('fill', '#e0f2fe')
          .style('stroke', '#0284c7');
        
        // Children count text
        node.append('text')
          .attr('x', leftX + 10)
          .attr('y', badgeY + 3)
          .attr('text-anchor', 'middle')
          .style('font-size', '8px')
          .style('font-weight', 'bold')
          .style('fill', '#0284c7')
          .text(childCount);
        
        leftX += 25;
      }
      
      // Gyllencreutz Coat of Arms for Succession Sons (lower right corner, inside box)
      if (d.data.isSuccessionSon) {
        const iconSize = 24;
        const markX = nodeWidth/2 - iconSize - 6; // 6px padding from right edge  
        const markY = nodeHeight/2 - iconSize - 6; // 6px padding from bottom edge
        
        // Create authentic Gyllencreutz coat of arms container
        const container = node.append('g')
          .attr('transform', `translate(${markX}, ${markY})`)
          .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.4))');
        
        // Amber gradient background border
        container.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', iconSize)
          .attr('height', iconSize)
          .attr('rx', 2)
          .style('fill', 'url(#amberGradient)')
          .style('stroke', '#d97706')
          .style('stroke-width', 1);
        
        // Inner silver field (shield)
        const shieldPath = `
          M ${iconSize/2} 2
          L 3 4
          L 3 ${iconSize-5}
          Q ${iconSize/2} ${iconSize-1} ${iconSize-3} ${iconSize-5}
          L ${iconSize-3} 4
          Z
        `;
        
        container.append('path')
          .attr('d', shieldPath)
          .style('fill', '#ffffff')
          .style('stroke', '#e5e7eb')
          .style('stroke-width', 0.5);
        
        // Three red crosses pattée (authentic Gyllencreutz pattern)
        const crossPositions = [
          { x: iconSize/2 - 4, y: 6 },    // Top left
          { x: iconSize/2 + 4, y: 6 },    // Top right  
          { x: iconSize/2, y: 13 }        // Bottom center
        ];
        
        crossPositions.forEach(pos => {
          const crossGroup = container.append('g')
            .attr('transform', `translate(${pos.x}, ${pos.y})`);
          
          // Create authentic cross pattée with flared ends
          const crossPath = `
            M 0 -2
            L -0.6 -1.4
            L -0.3 -1.4
            L -0.3 1.4
            L -0.6 1.4
            L 0 2
            L 0.6 1.4
            L 0.3 1.4
            L 0.3 -1.4
            L 0.6 -1.4
            Z
            M -2 0
            L -1.4 -0.6
            L -1.4 -0.3
            L 1.4 -0.3
            L 1.4 -0.6
            L 2 0
            L 1.4 0.6
            L 1.4 0.3
            L -1.4 0.3
            L -1.4 0.6
            Z
          `;
          
          crossGroup.append('path')
            .attr('d', crossPath)
            .style('fill', '#dc2626')
            .style('stroke', '#b91c1c')
            .style('stroke-width', 0.1);
        });
      }
      
      // Died Young indicator (bottom area)
      if (d.data.diedYoung) {
        node.append('rect')
          .attr('x', -25)
          .attr('y', 25)
          .attr('width', 50)
          .attr('height', 12)
          .attr('rx', 3)
          .style('fill', '#fef2f2')
          .style('stroke', '#fca5a5')
          .style('stroke-width', 1);
        
        node.append('text')
          .attr('x', 0)
          .attr('y', 33)
          .attr('text-anchor', 'middle')
          .style('font-size', '8px')
          .style('font-weight', 'bold')
          .style('fill', '#dc2626')
          .text('Died Young');
      }
      
      // Noble branch indicator (bottom-right, small text)
      if (d.data.nobleBranch && d.data.nobleBranch !== 'Main branch') {
        const branchText = d.data.nobleBranch === 'Elder line' ? 'Elder' : 'Younger';
        const branchColor = d.data.nobleBranch === 'Elder line' ? '#f59e0b' : '#f97316';
        
        node.append('text')
          .attr('x', nodeWidth/2 - 5)
          .attr('y', nodeHeight/2 - 5)
          .attr('text-anchor', 'end')
          .style('font-size', '7px')
          .style('font-weight', 'bold')
          .style('fill', branchColor)
          .text(branchText);
      }
    });

    // Store zoom instance for external controls
    (svg.node() as any).__zoom__ = zoom;

    // Auto-center on highlighted member
    if (highlightMember) {
      const highlightedNode = treeData.descendants().find(d => d.data.externalId === highlightMember);
      if (highlightedNode) {
        const scale = 1.2;
        const x = width / 2 - highlightedNode.x * scale;
        const y = height / 2 - highlightedNode.y * scale;
        
        svg.transition()
          .duration(1000)
          .call(
            zoom.transform,
            d3.zoomIdentity.translate(x, y).scale(scale)
          );
      }
    }

  }, [root, selectedMember, onMemberSelect, highlightMember]);

  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        (svg.node() as any).__zoom__.scaleBy, 1.5
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        (svg.node() as any).__zoom__.scaleBy, 1 / 1.5
      );
    }
  };

  const handleReset = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().call(
        (svg.node() as any).__zoom__.transform,
        d3.zoomIdentity.translate(600, 50)
      );
    }
  };

  const handleFitToScreen = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const treeGroup = svg.select('.tree-group').node() as SVGGElement | null;
      const bounds = treeGroup?.getBBox();
      if (bounds) {
        const fullWidth = 1200;
        const fullHeight = 800;
        const width = bounds.width;
        const height = bounds.height;
        const midX = bounds.x + width / 2;
        const midY = bounds.y + height / 2;
        const scale = Math.min(fullWidth / width, fullHeight / height) * 0.8;
        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
        
        svg.transition().call(
          (svg.node() as any).__zoom__.transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
      }
    }
  };

  return (
    <div className="relative bg-white border rounded-lg overflow-hidden">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleZoomIn}
          className="bg-white/90 backdrop-blur"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleZoomOut}
          className="bg-white/90 backdrop-blur"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReset}
          className="bg-white/90 backdrop-blur"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleFitToScreen}
          className="bg-white/90 backdrop-blur"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Transform Info */}
      <div className="absolute top-4 left-4 z-10 text-xs text-gray-600 bg-white/90 backdrop-blur rounded px-2 py-1">
        Zoom: {(transform.k * 100).toFixed(0)}%
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width="100%"
        height="600px"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
};