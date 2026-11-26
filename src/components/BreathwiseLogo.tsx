import React from 'react';

interface BreathwiseLogoProps {
  className?: string;
}

export const BreathwiseLogo: React.FC<BreathwiseLogoProps> = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${className}`}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Leaf + wind curl shaped like a lowercase 'b' */}
        <path
          d="M9 4.5V20.5C9 21.8807 10.1193 23 11.5 23H15.5C19.6421 23 23 19.6421 23 15.5C23 11.3579 19.6421 8 15.5 8C12.7 8 10.3 9.5 9 11.8"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#0E6B5C] dark:text-[#6EE7B7]"
        />
        <path
          d="M12.5 16.2C14.2 13.8 17.5 13.2 19.6 14.8C17.8 17.8 14.8 18.6 12.5 16.2Z"
          fill="#F2A33A"
        />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight text-[#0F2A24] dark:text-[#E8F1ED]">
        Breathwise
      </span>
    </span>
  );
};
