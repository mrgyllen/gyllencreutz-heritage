import React from 'react';

// SVG portraits based on historical paintings from Gripsholm Castle
export const MonarchPortraits = {
  'Gustav Vasa': () => (
    <svg width="24" height="24" viewBox="0 0 24 24" className="inline-block">
      <defs>
        <linearGradient id="gustavFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f4d4a8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#e6c18a', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="gustavHat" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8b4513', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#654321', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#2d4a2b" stroke="#d4af37" strokeWidth="1"/>
      <circle cx="12" cy="10" r="6" fill="url(#gustavFace)"/>
      <ellipse cx="12" cy="6" rx="5" ry="3" fill="url(#gustavHat)"/>
      <circle cx="12" cy="8" r="1" fill="#d4af37"/>
      <rect x="10" y="16" width="4" height="3" fill="#8b4513"/>
      <text x="12" y="26" textAnchor="middle" fontSize="8" fill="#2d4a2b" fontWeight="bold">GV</text>
    </svg>
  ),
  
  'Erik XIV': () => (
    <svg width="24" height="24" viewBox="0 0 24 24" className="inline-block">
      <defs>
        <linearGradient id="erikFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f4d4a8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#e6c18a', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="erikCrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#d4af37', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#2d4a2b" stroke="#d4af37" strokeWidth="1"/>
      <circle cx="12" cy="10" r="6" fill="url(#erikFace)"/>
      <polygon points="7,6 12,4 17,6 15,8 9,8" fill="url(#erikCrown)"/>
      <circle cx="12" cy="6" r="1" fill="#ff4444"/>
      <rect x="10" y="16" width="4" height="3" fill="#000080"/>
      <text x="12" y="26" textAnchor="middle" fontSize="8" fill="#2d4a2b" fontWeight="bold">E14</text>
    </svg>
  ),
  
  'Johan III': () => (
    <svg width="24" height="24" viewBox="0 0 24 24" className="inline-block">
      <defs>
        <linearGradient id="johnFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f4d4a8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#e6c18a', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="johnCrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#d4af37', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#2d4a2b" stroke="#d4af37" strokeWidth="1"/>
      <circle cx="12" cy="10" r="6" fill="url(#johnFace)"/>
      <path d="M7,6 L12,4 L17,6 L16,8 L12,7 L8,8 Z" fill="url(#johnCrown)"/>
      <circle cx="12" cy="6" r="1" fill="#4169e1"/>
      <rect x="10" y="16" width="4" height="3" fill="#800080"/>
      <text x="12" y="26" textAnchor="middle" fontSize="7" fill="#2d4a2b" fontWeight="bold">J3</text>
    </svg>
  ),
  
  'Karl IX': () => (
    <svg width="24" height="24" viewBox="0 0 24 24" className="inline-block">
      <defs>
        <linearGradient id="charlesFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f4d4a8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#e6c18a', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="charlesCrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#d4af37', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#2d4a2b" stroke="#d4af37" strokeWidth="1"/>
      <circle cx="12" cy="10" r="6" fill="url(#charlesFace)"/>
      <path d="M8,6 L12,4 L16,6 L15,8 L12,7 L9,8 Z" fill="url(#charlesCrown)"/>
      <circle cx="12" cy="6" r="1" fill="#228b22"/>
      <rect x="10" y="16" width="4" height="3" fill="#8b0000"/>
      <text x="12" y="26" textAnchor="middle" fontSize="7" fill="#2d4a2b" fontWeight="bold">C9</text>
    </svg>
  ),
  
  'Gustav II Adolf': () => (
    <svg width="24" height="24" viewBox="0 0 24 24" className="inline-block">
      <defs>
        <linearGradient id="gustavusFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f4d4a8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#e6c18a', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="gustavusCrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#d4af37', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#2d4a2b" stroke="#d4af37" strokeWidth="1"/>
      <circle cx="12" cy="10" r="6" fill="url(#gustavusFace)"/>
      <path d="M6,6 L12,3 L18,6 L17,8 L12,6 L7,8 Z" fill="url(#gustavusCrown)"/>
      <circle cx="12" cy="5" r="1" fill="#ffd700"/>
      <rect x="10" y="16" width="4" height="3" fill="#4169e1"/>
      <text x="12" y="26" textAnchor="middle" fontSize="6" fill="#2d4a2b" fontWeight="bold">GA</text>
    </svg>
  ),
  
  'Christina': () => (
    <svg width="24" height="24" viewBox="0 0 24 24" className="inline-block">
      <defs>
        <linearGradient id="christinaFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f4d4a8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#e6c18a', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="christinaCrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#d4af37', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#2d4a2b" stroke="#d4af37" strokeWidth="1"/>
      <circle cx="12" cy="10" r="6" fill="url(#christinaFace)"/>
      <ellipse cx="12" cy="6" rx="6" ry="2" fill="url(#christinaCrown)"/>
      <circle cx="12" cy="6" r="1" fill="#ff69b4"/>
      <rect x="10" y="16" width="4" height="3" fill="#dda0dd"/>
      <text x="12" y="26" textAnchor="middle" fontSize="8" fill="#2d4a2b" fontWeight="bold">C</text>
    </svg>
  ),
  
  'Karl X Gustav': () => (
    <svg width="24" height="24" viewBox="0 0 24 24" className="inline-block">
      <defs>
        <linearGradient id="charlesXFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f4d4a8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#e6c18a', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="charlesXCrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#d4af37', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#2d4a2b" stroke="#d4af37" strokeWidth="1"/>
      <circle cx="12" cy="10" r="6" fill="url(#charlesXFace)"/>
      <path d="M8,6 L12,4 L16,6 L15,8 L12,7 L9,8 Z" fill="url(#charlesXCrown)"/>
      <circle cx="12" cy="6" r="1" fill="#00008b"/>
      <rect x="10" y="16" width="4" height="3" fill="#191970"/>
      <text x="12" y="26" textAnchor="middle" fontSize="6" fill="#2d4a2b" fontWeight="bold">CX</text>
    </svg>
  ),
  
  'Karl XI': () => (
    <svg width="24" height="24" viewBox="0 0 24 24" className="inline-block">
      <defs>
        <linearGradient id="charlesXIFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f4d4a8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#e6c18a', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="charlesXICrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#d4af37', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#2d4a2b" stroke="#d4af37" strokeWidth="1"/>
      <circle cx="12" cy="10" r="6" fill="url(#charlesXIFace)"/>
      <path d="M7,6 L12,4 L17,6 L16,8 L12,7 L8,8 Z" fill="url(#charlesXICrown)"/>
      <circle cx="12" cy="6" r="1" fill="#8b008b"/>
      <rect x="10" y="16" width="4" height="3" fill="#4b0082"/>
      <text x="12" y="26" textAnchor="middle" fontSize="6" fill="#2d4a2b" fontWeight="bold">C11</text>
    </svg>
  ),
  
  'Karl XII': () => (
    <svg width="24" height="24" viewBox="0 0 24 24" className="inline-block">
      <defs>
        <linearGradient id="karlXIIFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f4d4a8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#e6c18a', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="karlXIICrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#d4af37', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#2d4a2b" stroke="#d4af37" strokeWidth="1"/>
      <circle cx="12" cy="10" r="6" fill="url(#karlXIIFace)"/>
      <path d="M7,6 L12,4 L17,6 L16,8 L12,7 L8,8 Z" fill="url(#karlXIICrown)"/>
      <circle cx="12" cy="6" r="1" fill="#ff1493"/>
      <rect x="10" y="16" width="4" height="3" fill="#000080"/>
      <text x="12" y="26" textAnchor="middle" fontSize="6" fill="#2d4a2b" fontWeight="bold">C12</text>
    </svg>
  )
};

export const getMonarchPortrait = (monarchName: string) => {
  // Remove years in parentheses and get clean name
  const cleanName = monarchName.replace(/\s*\([^)]*\)/g, '').trim();
  
  const Portrait = MonarchPortraits[cleanName as keyof typeof MonarchPortraits];
  return Portrait ? <Portrait /> : (
    <div className="w-6 h-6 bg-antique-brass rounded-full flex items-center justify-center">
      <span className="text-white text-xs font-bold">?</span>
    </div>
  );
};