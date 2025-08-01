'use client';
import { User } from '@/lib/types';

interface UserStatsProps {
  user: User | null;
}

export default function UserStats({ user }: UserStatsProps) {
  const stats = user?.stats;
  
  return (
    <div className="space-y-4">
      {/* Score và Rank */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{stats?.score || 0}</div>
          <div className="text-slate-300 text-sm">Điểm</div>
        </div>
        <div className="bg-slate-700/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{stats?.rank || 0}</div>
          <div className="text-slate-300 text-sm">Hạng</div>
        </div>
      </div>
      
      {/* Currency */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-yellow-600/20 p-3 rounded-lg border border-yellow-500/30">
          <div className="text-lg font-bold text-yellow-400">{stats?.golds || 0}</div>
          <div className="text-yellow-300 text-xs">Golds</div>
        </div>
        <div className="bg-blue-600/20 p-3 rounded-lg border border-blue-500/30">
          <div className="text-lg font-bold text-blue-400">{stats?.diamonds || 0}</div>
          <div className="text-blue-300 text-xs">Diamonds</div>
        </div>
      </div>
      
      {/* Fate */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-600/20 p-3 rounded-lg border border-purple-500/30">
          <div className="text-lg font-bold text-purple-400">{stats?.standardFate || 0}</div>
          <div className="text-purple-300 text-xs">Standard Fate</div>
        </div>
        <div className="bg-pink-600/20 p-3 rounded-lg border border-pink-500/30">
          <div className="text-lg font-bold text-pink-400">{stats?.specialFate || 0}</div>
          <div className="text-pink-300 text-xs">Special Fate</div>
        </div>
      </div>
      
      {/* Starglitter & Stardust */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-cyan-600/20 p-3 rounded-lg border border-cyan-500/30">
          <div className="text-lg font-bold text-cyan-400">{stats?.MasterlessStarglitter || 0}</div>
          <div className="text-cyan-300 text-xs">Starglitter</div>
        </div>
        <div className="bg-indigo-600/20 p-3 rounded-lg border border-indigo-500/30">
          <div className="text-lg font-bold text-indigo-400">{stats?.MasterlessStardust || 0}</div>
          <div className="text-indigo-300 text-xs">Stardust</div>
        </div>
      </div>
    </div>
  );
} 