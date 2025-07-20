import React from 'react';
import { Shield } from 'lucide-react';
import coatOfArmsImage from '@assets/vapenskjöld_1752593493242.jpg';

interface FamilyCoatOfArmsProps {
  size?: 'small' | 'medium' | 'large';
  title?: string;
}

export const FamilyCoatOfArms: React.FC<FamilyCoatOfArmsProps> = ({ 
  size = 'small', 
  title = "Gyllencreutz Succession Son" 
}) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div 
      className={`${sizeClasses[size]} flex items-center justify-center bg-gradient-to-br from-amber-200 to-amber-300 border border-amber-500 rounded-sm shadow-sm overflow-hidden relative`}
      title={title}
    >
      <img 
        src={coatOfArmsImage} 
        alt="Gyllencreutz Family Coat of Arms" 
        className="w-full h-full object-cover object-center"
        onError={(e) => {
          // Fallback to shield icon if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement!.innerHTML = `
            <div class="w-full h-full bg-gradient-to-br from-amber-300 to-amber-400 flex items-center justify-center">
              <svg class="w-4 h-4 text-amber-800" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2 L18 5 L18 13 L12 22 L6 13 L6 5 Z" stroke="currentColor" stroke-width="1"/>
              </svg>
            </div>
          `;
        }}
      />
    </div>
  );
};

export const getSuccessionIcon = (size: 'small' | 'medium' | 'large' = 'small') => {
  return <FamilyCoatOfArms size={size} />;
};