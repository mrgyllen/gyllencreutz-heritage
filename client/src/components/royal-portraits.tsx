import React from 'react';
import { Crown } from 'lucide-react';

// Try using import.meta.glob to load all portraits dynamically
const portraitModules = import.meta.glob('/src/assets/royal-portraits/*.jpg', { eager: true });

// Create a mapping of clean names to file paths
const portraitPaths: Record<string, string> = {};
Object.entries(portraitModules).forEach(([path, module]) => {
  const filename = path.split('/').pop()?.replace('.jpg', '');
  if (filename && module && typeof module === 'object' && 'default' in module) {
    portraitPaths[filename] = (module as any).default;
  }
});

// Royal portrait mappings using the dynamic imports
export const RoyalPortraitAssets = {
  'Gustav Vasa': portraitPaths['gustav-vasa'],
  'Erik XIV': portraitPaths['erik-xiv'],
  'Johan III': portraitPaths['johan-iii'],
  'Sigismund': portraitPaths['sigismund'],
  'Karl IX': portraitPaths['karl-ix'],
  'Gustav II Adolf': portraitPaths['gustav-ii-adolf'],
  'Kristina': portraitPaths['kristina'],
  'Karl X Gustav': portraitPaths['karl-x-gustav'],
  'Karl XI': portraitPaths['karl-xi'],
  'Karl XII': portraitPaths['karl-xii'],
  'Ulrika Eleonora': portraitPaths['ulrika-eleonora'],
  'Fredrik I': portraitPaths['fredrik-i'],
  'Adolf Fredrik': portraitPaths['adolf-fredrik'],
  'Gustav III': portraitPaths['gustav-iii'],
  'Gustav IV Adolf': portraitPaths['gustav-iv-adolf'],
  'Karl XIII': portraitPaths['karl-xiii'],
  'Karl XIV Johan': portraitPaths['karl-xiv-johan'],
  'Oscar I': portraitPaths['oscar-i'],
  'Karl XV': portraitPaths['karl-xv'],
  'Oscar II': portraitPaths['oscar-ii'],
  'Gustav V': portraitPaths['gustav-v'],
  'Gustav VI Adolf': portraitPaths['gustav-vi-adolf'],
  'Carl XVI Gustaf': portraitPaths['carl-xvi-gustav']
};

interface RoyalPortraitProps {
  monarchName: string;
  size?: 'small' | 'medium' | 'large';
}

export const RoyalPortrait: React.FC<RoyalPortraitProps> = ({ monarchName, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const portraitAsset = RoyalPortraitAssets[monarchName as keyof typeof RoyalPortraitAssets];
  
  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-blue-400 bg-blue-50 relative`}>
      {portraitAsset ? (
        <img 
          src={portraitAsset} 
          alt={monarchName} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-blue-400 flex items-center justify-center">
          <Crown className="w-1/2 h-1/2 text-white" />
        </div>
      )}
    </div>
  );
};

export const getRoyalPortrait = (monarchName: string, size: 'small' | 'medium' | 'large' = 'medium') => {
  // Remove years in parentheses and get clean name
  const cleanName = monarchName.replace(/\s*\([^)]*\)/g, '').trim();
  
  return <RoyalPortrait monarchName={cleanName} size={size} />;
};