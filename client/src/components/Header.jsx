import React from 'react';

// A reusable, sticky header for all pages
export default function Header({ title = 'GhostCloud', leftIcon = null, right = null, className = '' }) {
  return (
    <header className={`sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {leftIcon ? (
            leftIcon
          ) : (
            <img src="/ghost.svg" alt="GhostCloud logo" className="w-8 h-8 rounded-md" aria-hidden />
          )}
          <h1 className="text-xl font-semibold text-gray-900 inter-tight-title">{title}</h1>
        </div>
        {right ? (
          <div className="flex items-center gap-4">{right}</div>
        ) : null}
      </div>
    </header>
  );
}
