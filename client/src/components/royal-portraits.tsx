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
        <>
          <img 
            src={portraitUrl} 
            alt={monarchName} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to crown icon if image fails to load
              console.log(`Failed to load portrait for: ${monarchName}`);
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.classList.remove('hidden');
                fallback.style.display = 'flex';
              }
            }}
          />
          <div className="hidden w-full h-full bg-blue-400 flex items-center justify-center">
            <Crown className="w-1/2 h-1/2 text-white" />
          </div>
        </>
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