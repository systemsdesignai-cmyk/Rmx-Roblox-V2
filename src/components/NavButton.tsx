import React from 'react';
import { usePlatform } from '../context/PlatformContext';

interface NavButtonProps {
  active: boolean;
  icon: React.ReactElement;
  label: string;
  onClick: () => void;
  id?: string;
}

export default function NavButton({ active, icon, label, onClick, id }: NavButtonProps) {
  const { isAndroid } = usePlatform();

  // Android Material Design 3 Navigation Item
  if (isAndroid) {
    return (
      <button 
        id={id}
        onClick={onClick}
        className="flex flex-col items-center justify-center flex-1 h-16 py-1 transition-all duration-200 relative focus:outline-none select-none group cursor-pointer active:scale-95 min-h-[48px]"
        aria-label={label}
        aria-selected={active}
      >
        {/* M3 Active Tonal Pill Indicator */}
        <div 
          className={`w-14 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            active 
              ? 'bg-indigo-500/25 text-indigo-300 shadow-sm' 
              : 'text-neutral-400 group-hover:text-neutral-200 group-hover:bg-neutral-800/40'
          }`}
        >
          {React.cloneElement(icon, { 
            className: `w-5 h-5 transition-transform duration-200 ${active ? 'stroke-[2.4] scale-105 text-indigo-300' : 'stroke-[1.8]'}` 
          })}
        </div>
        
        {/* M3 Label */}
        <span 
          className={`text-[11px] font-medium tracking-normal text-center w-full truncate transition-colors leading-tight mt-1 ${
            active ? 'font-bold text-indigo-200' : 'text-neutral-400 group-hover:text-neutral-300'
          }`}
        >
          {label}
        </span>
      </button>
    );
  }

  // Apple HIG iOS Tab Bar Item
  return (
    <button 
      id={id}
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 h-12 py-0.5 transition-all duration-150 relative focus:outline-none select-none group cursor-pointer active:scale-95 min-h-[44px] ${
        active ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
      }`}
      aria-label={label}
      aria-selected={active}
    >
      <div className={`p-1 rounded-xl transition-all duration-150 ${
        active 
          ? 'text-indigo-400 scale-105' 
          : 'text-neutral-400 group-hover:text-neutral-200'
      }`}>
        {React.cloneElement(icon, { 
          className: `w-4.5 h-4.5 transition-all ${active ? 'stroke-[2.4] text-indigo-400' : 'stroke-[1.8]'}` 
        })}
      </div>
      <span className={`text-[10px] tracking-tight text-center w-full truncate transition-colors leading-none mt-0.5 ${
        active ? 'font-semibold text-indigo-300' : 'font-medium text-neutral-500 group-hover:text-neutral-400'
      }`}>
        {label}
      </span>
    </button>
  );
}
