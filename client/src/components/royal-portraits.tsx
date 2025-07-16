import React from 'react';
import { Crown } from 'lucide-react';

// Create distinctive royal icons for each monarch instead of relying on external images
const createRoyalIcon = (initial: string, color: string, bgColor: string) => (
  <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs relative">
    <div className={`w-full h-full ${bgColor} rounded-full flex items-center justify-center border-2 ${color}`}>
      <span className="text-white font-bold text-xs">{initial}</span>
      <div className="absolute -top-1 -right-1 w-3 h-3">
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <path d="M12 2 L15 8 L22 8 L17 13 L19 20 L12 16 L5 20 L7 13 L2 8 L9 8 Z" fill="#ffd700" stroke="#d4af37" strokeWidth="1"/>
        </svg>
      </div>
    </div>
  </div>
);

// Royal icons mapping with distinctive colors for each monarch
export const RoyalIcons = {
  'Gustav Vasa': () => createRoyalIcon('GV', 'border-red-600', 'bg-red-500'),
  'Erik XIV': () => createRoyalIcon('E14', 'border-blue-600', 'bg-blue-500'),
  'Johan III': () => createRoyalIcon('J3', 'border-purple-600', 'bg-purple-500'),
  'Sigismund': () => createRoyalIcon('S', 'border-green-600', 'bg-green-500'),
  'Karl IX': () => createRoyalIcon('K9', 'border-orange-600', 'bg-orange-500'),
  'Gustav II Adolf': () => createRoyalIcon('GA', 'border-red-700', 'bg-red-600'),
  'Kristina': () => createRoyalIcon('K', 'border-pink-600', 'bg-pink-500'),
  'Karl X Gustav': () => createRoyalIcon('K10', 'border-teal-600', 'bg-teal-500'),
  'Karl XI': () => createRoyalIcon('K11', 'border-indigo-600', 'bg-indigo-500'),
  'Karl XII': () => createRoyalIcon('K12', 'border-violet-600', 'bg-violet-500'),
  'Ulrika Eleonora': () => createRoyalIcon('UE', 'border-rose-600', 'bg-rose-500'),
  'Fredrik I': () => createRoyalIcon('F1', 'border-cyan-600', 'bg-cyan-500'),
  'Adolf Fredrik': () => createRoyalIcon('AF', 'border-amber-600', 'bg-amber-500'),
  'Gustav III': () => createRoyalIcon('G3', 'border-lime-600', 'bg-lime-500'),
  'Gustav IV Adolf': () => createRoyalIcon('G4', 'border-emerald-600', 'bg-emerald-500'),
  'Karl XIII': () => createRoyalIcon('K13', 'border-sky-600', 'bg-sky-500'),
  'Karl XIV Johan': () => createRoyalIcon('K14', 'border-blue-700', 'bg-blue-600'),
  'Oscar I': () => createRoyalIcon('O1', 'border-purple-700', 'bg-purple-600'),
  'Karl XV': () => createRoyalIcon('K15', 'border-pink-700', 'bg-pink-600'),
  'Oscar II': () => createRoyalIcon('O2', 'border-red-800', 'bg-red-700'),
  'Gustav V': () => createRoyalIcon('G5', 'border-green-700', 'bg-green-600'),
  'Gustav VI Adolf': () => createRoyalIcon('G6', 'border-blue-800', 'bg-blue-700'),
  'Carl XVI Gustaf': () => createRoyalIcon('CG', 'border-yellow-600', 'bg-yellow-500')
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

  const RoyalIcon = RoyalIcons[monarchName as keyof typeof RoyalIcons];

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden relative`}>
      {RoyalIcon ? (
        <RoyalIcon />
      ) : (
        <div className="w-full h-full bg-blue-400 flex items-center justify-center border-2 border-blue-600 rounded-full">
          <Crown className="w-1/2 h-1/2 text-white" />
        </div>
      )}
    </div>
  );
};

export const getRoyalPortrait = (monarchName: string, size: 'small' | 'medium' | 'large' = 'medium') => {
  // Remove years in parentheses and get clean name
  let cleanName = monarchName.replace(/\s*\([^)]*\)/g, '').trim();
  
  // Handle common name variations
  const nameMapping: { [key: string]: string } = {
    'Kristina (1632–1654)': 'Kristina',
    'Kristina (1626–1689)': 'Kristina',
    'Karl X Gustav (1654–1660)': 'Karl X Gustav',
    'Karl XI (1660–1697)': 'Karl XI',
    'Karl XII (1697–1718)': 'Karl XII',
    'Ulrika Eleonora (1718–1720)': 'Ulrika Eleonora',
    'Fredrik I (1720–1751)': 'Fredrik I',
    'Adolf Fredrik (1751–1771)': 'Adolf Fredrik',
    'Gustav III (1771–1792)': 'Gustav III',
    'Gustav IV Adolf (1792–1809)': 'Gustav IV Adolf',
    'Karl XIII (1809–1818)': 'Karl XIII',
    'Karl XIV Johan (1818–1844)': 'Karl XIV Johan',
    'Oscar I (1844–1859)': 'Oscar I',
    'Karl XV (1859–1872)': 'Karl XV',
    'Oscar II (1872–1907)': 'Oscar II',
    'Gustav V (1907–1950)': 'Gustav V',
    'Gustav VI Adolf (1950–1973)': 'Gustav VI Adolf',
    'Carl XVI Gustaf (1973–)': 'Carl XVI Gustaf'
  };
  
  // Check if we have a direct mapping first
  if (nameMapping[monarchName]) {
    cleanName = nameMapping[monarchName];
  }
  
  return <RoyalPortrait monarchName={cleanName} size={size} />;
};