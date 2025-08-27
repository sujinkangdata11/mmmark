
import React from 'react';

export const UpvoteIcon = ({ className }: { className?: string }): React.ReactNode => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4L4 12H9V20H15V12H20L12 4Z" />
  </svg>
);

export const CommentIcon = ({ className }: { className?: string }): React.ReactNode => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H18L22 22V4C22 2.9 21.1 2 20 2ZM20 16H4V4H20V16Z" />
  </svg>
);

export const LinkIcon = ({ className }: { className?: string }): React.ReactNode => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 7H13V9H17C18.1 9 19 9.9 19 11C19 12.1 18.1 13 17 13H13V15H17C19.21 15 21 13.21 21 11C21 8.79 19.21 7 17 7M7 11C7 8.79 8.79 7 11 7H12V9H11C9.9 9 9 9.9 9 11C9 12.1 9.9 13 11 13H12V15H11C8.79 15 7 13.21 7 11M10 11H14V13H10V11Z" />
    </svg>
);
