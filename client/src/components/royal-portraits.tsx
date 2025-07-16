import React from 'react';
import { Crown } from 'lucide-react';

// Import royal portraits from local assets
import gustavVasaPortrait from '/src/assets/royal-portraits/gustav-vasa.jpg';
import erikXIVPortrait from '/src/assets/royal-portraits/erik-xiv.jpg';
import johanIIIPortrait from '/src/assets/royal-portraits/johan-iii.jpg';
import sigismundPortrait from '/src/assets/royal-portraits/sigismund.jpg';
import karlIXPortrait from '/src/assets/royal-portraits/karl-ix.jpg';
import gustavIIAdolfPortrait from '/src/assets/royal-portraits/gustav-ii-adolf.jpg';
import kristinaPortrait from '/src/assets/royal-portraits/kristina.jpg';
import karlXGustavPortrait from '/src/assets/royal-portraits/karl-x-gustav.jpg';
import karlXIPortrait from '/src/assets/royal-portraits/karl-xi.jpg';
import karlXIIPortrait from '/src/assets/royal-portraits/karl-xii.jpg';
import ulrikaEleonoraPortrait from '/src/assets/royal-portraits/ulrika-eleonora.jpg';
import fredrikIPortrait from '/src/assets/royal-portraits/fredrik-i.jpg';
import adolfFredrikPortrait from '/src/assets/royal-portraits/adolf-fredrik.jpg';
import gustavIIIPortrait from '/src/assets/royal-portraits/gustav-iii.jpg';
import gustavIVAdolfPortrait from '/src/assets/royal-portraits/gustav-iv-adolf.jpg';
import karlXIIIPortrait from '/src/assets/royal-portraits/karl-xiii.jpg';
import karlXIVJohanPortrait from '/src/assets/royal-portraits/karl-xiv-johan.jpg';
import oscarIPortrait from '/src/assets/royal-portraits/oscar-i.jpg';
import karlXVPortrait from '/src/assets/royal-portraits/karl-xv.jpg';
import oscarIIPortrait from '/src/assets/royal-portraits/oscar-ii.jpg';
import gustavVPortrait from '/src/assets/royal-portraits/gustav-v.jpg';
import gustavVIAdolfPortrait from '/src/assets/royal-portraits/gustav-vi-adolf.jpg';
import carlXVIGustafPortrait from '/src/assets/royal-portraits/carl-xvi-gustav.jpg';

// Royal portrait mappings using local assets
export const RoyalPortraitAssets = {
  'Gustav Vasa': gustavVasaPortrait,
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
  'Gustav VI Adolf': gustavVIAdolfPortrait,
  'Carl XVI Gustaf': carlXVIGustafPortrait
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