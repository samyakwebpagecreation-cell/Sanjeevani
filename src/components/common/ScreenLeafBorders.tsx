import React from 'react';

export const ScreenLeafBorders: React.FC = () => {
  return (
    <>
      {/* Left Screen Flank: Botanical Vein Repeating Border */}
      <aside 
        className="fixed top-0 bottom-0 left-0 w-3 sm:w-6 md:w-10 lg:w-12 xl:w-14 z-30 pointer-events-none border-r border-amber-600/30 dark:border-amber-400/20 shadow-lg shadow-black/10 overflow-hidden select-none"
        aria-hidden="true"
        aria-label="Sanjeevani Botanical Left Border"
      >
        <div 
          className="w-full h-full opacity-95 hover:opacity-100 transition-opacity"
          style={{
            backgroundImage: "url('/leaf-border.jpg')",
            backgroundRepeat: 'repeat-y',
            backgroundPosition: 'center top',
            backgroundSize: '100% auto'
          }}
        />
        {/* Soft edge shade to blend harmoniously with light and dark canvas */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/20 pointer-events-none" />
      </aside>

      {/* Right Screen Flank: Botanical Vein Repeating Border (Mirrored) */}
      <aside 
        className="fixed top-0 bottom-0 right-0 w-3 sm:w-6 md:w-10 lg:w-12 xl:w-14 z-30 pointer-events-none border-l border-amber-600/30 dark:border-amber-400/20 shadow-lg shadow-black/10 overflow-hidden select-none"
        aria-hidden="true"
        aria-label="Sanjeevani Botanical Right Border"
      >
        <div 
          className="w-full h-full opacity-95 hover:opacity-100 transition-opacity"
          style={{
            backgroundImage: "url('/leaf-border.jpg')",
            backgroundRepeat: 'repeat-y',
            backgroundPosition: 'center top',
            backgroundSize: '100% auto',
            transform: 'scaleX(-1)' // Mirrored symmetry for classical botanical frame
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/10 via-transparent to-black/20 pointer-events-none" />
      </aside>
    </>
  );
};

