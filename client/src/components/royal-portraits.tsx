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

// List of known working portrait files (actual JPG images)
const workingPortraits = [
  'erik-xiv', 'gustav-ii-adolf', 'gustav-vasa', 'gustav-v', 
  'johan-iii', 'karl-ix', 'karl-x-gustav', 'karl-xiv-johan', 'sigismund'
];

// Royal portrait mappings - null values will use Crown fallback
export const RoyalPortraitAssets = {
  'Gustav Vasa': portraitPaths['gustav-vasa'],
  'Erik XIV': portraitPaths['erik-xiv'],
  'Johan III': portraitPaths['johan-iii'],
  'Sigismund': portraitPaths['sigismund'],
  'Karl IX': portraitPaths['karl-ix'],
  'Gustav II Adolf': portraitPaths['gustav-ii-adolf'],
  'Kristina': null, // Corrupted file - use Crown fallback
  'Karl X Gustav': portraitPaths['karl-x-gustav'],
  'Karl XI': null, // Corrupted file - use Crown fallback
  'Karl XII': null, // Corrupted file - use Crown fallback
  'Ulrika Eleonora': null, // Corrupted file - use Crown fallback
  'Fredrik I': null, // Corrupted file - use Crown fallback
  'Adolf Fredrik': null, // Corrupted file - use Crown fallback
  'Gustav III': null, // Corrupted file - use Crown fallback
  'Gustav IV Adolf': null, // Corrupted file - use Crown fallback
  'Karl XIII': null, // Corrupted file - use Crown fallback
  'Karl XIV Johan': portraitPaths['karl-xiv-johan'],
  'Oscar I': null, // Corrupted file - use Crown fallback
  'Karl XV': null, // Corrupted file - use Crown fallback
  'Oscar II': null, // Corrupted file - use Crown fallback
  'Gustav V': portraitPaths['gustav-v'],
  'Gustav VI Adolf': null, // Corrupted file - use Crown fallback
  'Carl XVI Gustaf': null // Corrupted file - use Crown fallback
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