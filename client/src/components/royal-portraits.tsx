import React, { useState } from 'react';
import { Crown } from 'lucide-react';

// Import all authentic royal portraits provided by the user
import gustavVasaPortrait from '@assets/gustav-vasa_1752701617325.jpg';
import erikXIVPortrait from '@assets/Erik_XIV_1561-300x300_1752701617325.jpg';
import johanIIIPortrait from '@assets/joahn-III-300x300_1752701617325.jpg';
import sigismundPortrait from '@assets/sigsmund-300x300_1752701586398.jpg';
import karlIXPortrait from '@assets/Karl_IX-300x300_1752701586398.jpg';
import gustavIIAdolfPortrait from '@assets/gustav-ii-adolf-portratt-300x300_1752701586398.jpg';
import kristinaPortrait from '@assets/drottning-kristina-300x300_1752701586398.jpg';
import karlXGustavPortrait from '@assets/Karl_X_Gustav-300x300_1752701586398.jpg';
import karlXIPortrait from '@assets/Karl-XI-300x300_1752701586398.jpg';
import karlXIIPortrait from '@assets/Karl-XII-NY-300x300_1752701586398.jpg';
import ulrikaEleonoraPortrait from '@assets/Ulrika-Eleonora-d.-y.-241x300_1752701586398.jpg';
import fredrikIPortrait from '@assets/Fredrik-I-kopia-300x300_1752701586398.jpg';
import adolfFredrikPortrait from '@assets/adolf-fredrik-1_1752701586398.jpg';
import gustavIIIPortrait from '@assets/gustav-III-2-300x300_1752701586398.jpg';
import gustavIVAdolfPortrait from '@assets/Gustav-IV-Adolf.-kopiajpg-300x300_1752701586398.jpg';
import karlXIIIPortrait from '@assets/Karl-XIII-1-300x300_1752701586398.jpg';
import karlXIVJohanPortrait from '@assets/Karl_XIV_Johan-300x300_1752701586398.jpg';
import oscarIPortrait from '@assets/oscar-I-kopia-300x300_1752701586398.jpg';
import karlXVPortrait from '@assets/Karl-XV-nationalmuseum-300x300_1752701586398.jpg';
import oscarIIPortrait from '@assets/Oscar-II-av-Sverige-300x300_1752701586398.jpg';
import gustavVPortrait from '@assets/Gustav_V-300x300_1752701586397.jpg';
import gustavVIAdolfPortrait from '@assets/Gustaf-VI-Adolf-2-300x300_1752701586397.jpg';
import carlXVIGustavPortrait from '@assets/carl-gustaf-16-300x300_1752701586397.jpg';

// Royal portrait mappings with all authentic portraits
export const RoyalPortraitAssets = {
  'Gustav Vasa': gustavVasaPortrait,
  'Gustav I Vasa': gustavVasaPortrait,
  'Erik XIV': erikXIVPortrait,
  'Johan III': johanIIIPortrait,
  'Sigismund': sigismundPortrait,
  'Karl IX': karlIXPortrait,
  'Gustav II Adolf': gustavIIAdolfPortrait,
  'Kristina': kristinaPortrait,
  'Karl X Gustav': karlXGustavPortrait,
  'Karl XI': karlXIPortrait,
  'Karl XII': karlXIIPortrait,
  'Ulrika Eleonora': ulrikaEleonoraPortrait,
  'Fredrik I': fredrikIPortrait,
  'Adolf Fredrik': adolfFredrikPortrait,
  'Gustav III': gustavIIIPortrait,
  'Gustav IV Adolf': gustavIVAdolfPortrait,
  'Karl XIII': karlXIIIPortrait,
  'Karl XIV Johan': karlXIVJohanPortrait,
  'Oscar I': oscarIPortrait,
  'Karl XV': karlXVPortrait,
  'Oscar II': oscarIIPortrait,
  'Gustav V': gustavVPortrait,
  'Gustaf V': gustavVPortrait,
  'Gustav VI Adolf': gustavVIAdolfPortrait,
  'Gustaf VI Adolf': gustavVIAdolfPortrait,
  'Carl XVI Gustaf': carlXVIGustavPortrait
};

interface RoyalPortraitProps {
  monarchName: string;
  size?: 'small' | 'medium' | 'large';
}

export const RoyalPortrait: React.FC<RoyalPortraitProps> = ({ monarchName, size = 'medium' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const portraitAsset = RoyalPortraitAssets[monarchName as keyof typeof RoyalPortraitAssets];
  const shouldShowImage = portraitAsset && !imageError;
  
  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-blue-400 bg-blue-50 relative`}>
      {shouldShowImage ? (
        <img 
          src={portraitAsset} 
          alt={monarchName} 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
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