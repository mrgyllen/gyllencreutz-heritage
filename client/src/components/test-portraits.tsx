import React from 'react';
import { getRoyalPortrait } from './royal-portraits';

export function TestPortraits() {
  const testMonarchs = [
    'Kristina (1632–1654)',
    'Karl X Gustav (1654–1660)',
    'Karl XI (1660–1697)',
    'Karl XII (1697–1718)',
    'Ulrika Eleonora (1718–1720)',
    'Fredrik I (1720–1751)'
  ];

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Royal Portraits Test</h3>
      <div className="flex flex-wrap gap-4">
        {testMonarchs.map((monarch, index) => (
          <div key={index} className="text-center">
            <div className="mb-2">
              {getRoyalPortrait(monarch, 'medium')}
            </div>
            <div className="text-xs text-gray-600 max-w-20">
              {monarch}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}