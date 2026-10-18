import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export const AnnouncementBar = () => {
  const { settings } = useSettingsStore();

  if (settings?.announcementBar?.enabled === false) return null;

  const rawText = settings?.announcementBar?.text || '100% Authentic Wellness & Nutrition';
  // Strip out any free delivery text completely while preserving "100% Authentic Wellness & Nutrition"
  const cleanText = rawText
    .replace(/⚡\s*Free Nationwide Delivery (Across Nepal )?on Orders Over Rs\.?\s*3,?500\s*\|\s*/gi, '')
    .replace(/Free Nationwide Delivery (Across Nepal )?on Orders Over Rs\.?\s*3,?500\s*\|\s*/gi, '')
    .replace(/⚡\s*Free Nationwide Delivery[^|]*\|\s*/gi, '')
    .replace(/Free Nationwide Delivery[^|]*\|\s*/gi, '')
    .trim() || '100% Authentic Wellness & Nutrition';

  const link = settings?.announcementBar?.link || '/shop';

  return (
    <div className="bg-[#E5E7EB] text-black text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4 text-center font-medium tracking-wide flex items-center justify-center gap-1.5 sm:gap-2 border-b border-gray-300 flex-wrap">
      <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse shrink-0" />
      <span>{cleanText}</span>
      {link && (
        <Link to={link} className="underline font-bold text-orange-600 hover:text-orange-700 ml-0.5 sm:ml-1 transition shrink-0">
          Shop Now
        </Link>
      )}
    </div>
  );
};
