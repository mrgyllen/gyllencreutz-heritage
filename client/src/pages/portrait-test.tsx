import React from 'react';
import { getRoyalPortrait, RoyalPortraitAssets } from '../components/royal-portraits';
import { useLanguage } from '../contexts/language-context';

export default function PortraitTest() {
  const { t } = useLanguage();
  
  // All 23 Swedish monarchs with their exact names as used in the data
  const allMonarchs = [
    'Gustav Vasa (1523–1560)',
    'Erik XIV (1560–1568)', 
    'Johan III (1568–1592)',
    'Sigismund (1592–1599)',
    'Karl IX (1599–1611)',
    'Gustav II Adolf (1611–1632)',
    'Kristina (1632–1654)',
    'Karl X Gustav (1654–1660)',
    'Karl XI (1660–1697)',
    'Karl XII (1697–1718)',
    'Ulrika Eleonora (1718–1720)',
    'Fredrik I (1720–1751)',
    'Adolf Fredrik (1751–1771)',
    'Gustav III (1771–1792)',
    'Gustav IV Adolf (1792–1809)',
    'Karl XIII (1809–1818)',
    'Karl XIV Johan (1818–1844)',
    'Oscar I (1844–1859)',
    'Karl XV (1859–1872)',
    'Oscar II (1872–1907)',
    'Gustav V (1907–1950)',
    'Gustav VI Adolf (1950–1973)',
    'Carl XVI Gustaf (1973–present)'
  ];

  return (
    <div className="min-h-screen bg-parchment p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-cinzel font-bold text-deep-forest mb-8 text-center">
          Royal Portraits Test - All Swedish Monarchs
        </h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {allMonarchs.map((monarch, index) => {
            const cleanName = monarch.replace(/\s*\([^)]*\)/g, '').trim();
            return (
              <div key={index} className="text-center bg-white p-4 rounded-lg shadow-md">
                <div className="mb-3 flex justify-center">
                  {getRoyalPortrait(monarch, 'large')}
                </div>
                <div className="text-xs text-gray-800 font-medium mb-1">
                  {cleanName}
                </div>
                <div className="text-xs text-gray-600">
                  {monarch.match(/\([^)]*\)/)?.[0] || ''}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Index: {index + 1}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  Asset: {RoyalPortraitAssets[cleanName] ? '✓' : '✗'}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Diagnostic Information</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Total Monarchs:</strong> {allMonarchs.length}</p>
            <p><strong>Expected:</strong> All should show authentic historical portraits</p>
            <p><strong>Fallback:</strong> Crown icon if image fails to load</p>
            <p><strong>Current Issue:</strong> Some show abbreviated text instead of portraits</p>
          </div>
        </div>
      </div>
    </div>
  );
}