'use client';

export default function GameBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-green-800 via-green-700 to-blue-800">
      {/* Grid pattern to simulate map */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* Decorative map elements */}
      <div className="absolute top-20 left-20 w-16 h-16 bg-yellow-400/30 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-32 w-12 h-12 bg-blue-400/30 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-32 left-40 w-20 h-20 bg-green-400/30 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-20 right-20 w-14 h-14 bg-purple-400/30 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
    </div>
  );
} 