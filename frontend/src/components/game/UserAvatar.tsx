'use client';
import { User } from '@/lib/types';

interface UserAvatarProps {
  user: User | null;
  onAvatarClick: () => void;
}

export default function UserAvatar({ user, onAvatarClick }: UserAvatarProps) {
  return (
    <div className="relative z-10 p-6">
      <button
        onClick={onAvatarClick}
        className="group relative"
      >
        {/* Avatar Circle */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-4 border-white/20 shadow-2xl flex items-center justify-center text-white text-2xl font-bold hover:scale-110 transition-transform duration-200">
          {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
        </div>
        
        {/* Hover Tooltip */}
        <div className="absolute left-0 top-full mt-2 bg-slate-800/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
          <div className="font-semibold">{user?.displayName || "Unknown"}</div>
        </div>
      </button>
    </div>
  );
} 