import React from 'react';
import { Crown } from 'lucide-react';

// Royal portrait URLs from Livrustkammaren (Swedish Royal Armory)
export const RoyalPortraitUrls = {
  'Gustav Vasa': 'https://livrustkammaren.se/wp-content/uploads/2021/05/gustav-vasa.jpg',
  'Erik XIV': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Erik_XIV_1561-300x300.jpg',
  'Johan III': 'https://livrustkammaren.se/wp-content/uploads/2021/05/joahn-III-300x300.jpg',
  'Sigismund': 'https://livrustkammaren.se/wp-content/uploads/2021/05/sigsmund-300x300.jpg',
  'Karl IX': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Karl_IX-300x300.jpg',
  'Gustav II Adolf': 'https://livrustkammaren.se/wp-content/uploads/2021/05/gustav-ii-adolf-portratt-eASe3SXlngtTAKeS7rfCmQ-1-300x300.jpg',
  'Kristina': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Kristina_1626-1689_drottning_av_Sverige_-_Nationalmuseum_-_15051.tif-300x300.jpg',
  'Karl X Gustav': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Karl_X_Gustav-300x300.jpg',
  'Karl XI': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Karl_XI-300x300.jpg',
  'Karl XII': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Karl_XII-300x300.jpg',
  'Ulrika Eleonora': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Ulrika_Eleonora-300x300.jpg',
  'Fredrik I': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Fredrik_I-300x300.jpg',
  'Adolf Fredrik': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Adolf_Fredrik-300x300.jpg',
  'Gustav III': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Gustav_III-300x300.jpg',
  'Gustav IV Adolf': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Gustav_IV_Adolf-300x300.jpg',
  'Karl XIII': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Karl_XIII-300x300.jpg',
  'Karl XIV Johan': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Karl_XIV_Johan-300x300.jpg',
  'Oscar I': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Oscar_I-300x300.jpg',
  'Karl XV': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Karl_XV-300x300.jpg',
  'Oscar II': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Oscar_II-300x300.jpg',
  'Gustav V': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Gustav_V-300x300.jpg',
  'Gustav VI Adolf': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Gustav_VI_Adolf-300x300.jpg',
  'Carl XVI Gustaf': 'https://livrustkammaren.se/wp-content/uploads/2021/05/Carl_XVI_Gustaf-300x300.jpg'
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

  const portraitUrl = RoyalPortraitUrls[monarchName as keyof typeof RoyalPortraitUrls];

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border border-blue-400 bg-blue-50 flex items-center justify-center`}>
      {portraitUrl ? (
        <img 
          src={portraitUrl} 
          alt={monarchName} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to crown icon if image fails to load
            const target = e.currentTarget;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = 'flex';
            }
          }}
        />
      ) : null}
      <div className="hidden w-full h-full bg-blue-400 flex items-center justify-center">
        <Crown className="w-1/2 h-1/2 text-white" />
      </div>
    </div>
  );
};

export const getRoyalPortrait = (monarchName: string, size: 'small' | 'medium' | 'large' = 'medium') => {
  // Remove years in parentheses and get clean name
  const cleanName = monarchName.replace(/\s*\([^)]*\)/g, '').trim();
  
  return <RoyalPortrait monarchName={cleanName} size={size} />;
};