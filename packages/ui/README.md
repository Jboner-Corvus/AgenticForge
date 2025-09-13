# UI Package - Responsive Frontend Updates

## Overview
This package contains the React-based frontend for the AI agent system, built with Vite, Tailwind CSS, and shadcn/ui components.

## Recent Changes for Responsiveness
To make the frontend responsive to different screen sizes (mobile, tablet, desktop):

1. **App.tsx Layout**:
   - Main layout now uses `flex-col lg:flex-row` to stack control panel and main content vertically on small screens.
   - Canvas and control panel widths are full-width on mobile (`w-full lg:flex-shrink-0`) with min/max widths only on large screens.
   - Resize divider hidden on mobile (`hidden lg:block`).
   - Updated resize handler to use smaller max widths on mobile (90% of screen).

2. **Global CSS (index.css)**:
   - Added media queries for mobile-first adjustments:
     - Smaller font sizes and padding on screens <640px.
     - Reduced spacing for typing indicators and scrollbars.
     - Thinner scrollbars on mobile.

3. **EnhancedChatInterface.tsx**:
   - Header padding: `p-2 sm:p-4`.
   - Icons and text scale down on mobile (e.g., `w-4 h-4 sm:w-5 sm:h-5`).
   - Metrics grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
   - Message bubbles: `max-w-[95%] sm:max-w-[80%]`, reduced padding (`p-2 sm:p-3`), smaller spacing.

4. **Header.tsx Navigation**:
   - Added hamburger menu (`<Menu />` icon) visible only on mobile (`lg:hidden`).
   - Desktop buttons hidden on mobile (`hidden lg:flex`), shown in a vertical dropdown menu when hamburger is clicked.
   - Reduced padding and icon sizes on mobile.

## Development
- Run `npm run dev` to start the server at http://localhost:3003.
- Test responsiveness by resizing the browser or using dev tools device emulation.

## Dependencies
- React, Tailwind CSS, framer-motion, lucide-react, etc. (see package.json).

For full project docs, see the root README.md.
