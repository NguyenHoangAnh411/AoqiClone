'use client';

export default function GameContentArea() {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🎮 AOQI LEGEND</h1>
        
        <div className="grid gap-6">
        
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-600">
            <h2 className="text-xl font-bold text-white mb-4">🚧 Game Features Coming Soon</h2>
            <p className="text-slate-300">
              Các tính năng game sẽ được phát triển trong Phase 3. Hiện tại bạn có thể test các API UserStats ở trên.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 