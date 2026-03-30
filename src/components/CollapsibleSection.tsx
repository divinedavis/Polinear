'use client';

import { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  level?: 'federal' | 'state' | 'local';
}

export default function CollapsibleSection({ title, children, defaultOpen = false, badge, level }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Level-based section headers (for the main page sections)
  if (level) {
    const dotColor = level === 'federal' ? 'bg-blue-500' : level === 'state' ? 'bg-purple-500' : 'bg-green-500';

    return (
      <div className="border border-gray-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between py-4 px-4 text-left bg-gray-800 hover:bg-gray-750 transition-colors"
          style={{ backgroundColor: isOpen ? 'rgba(31, 41, 55, 1)' : 'rgba(31, 41, 55, 0.8)' }}
        >
          <span className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 ${dotColor} rounded-full`}></span>
            <span className="text-lg font-semibold text-gray-200">{title}</span>
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && <div className="px-2 pb-3">{children}</div>}
      </div>
    );
  }

  // Default style (for within-card collapsibles)
  return (
    <div className="border-t border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-1 text-left text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="pb-3 px-1">{children}</div>}
    </div>
  );
}
