'use client';
import { User } from '@/lib/types';
import UserStats from './UserStats';
import ProfileActions from './ProfileActions';

interface ProfileModalProps {
  user: User | null;
  onClose: () => void;
  onLogout: () => void;
}

export default function ProfileModal({ user, onClose, onLogout }: ProfileModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-600 w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">👤 Hồ Sơ Người Chơi</h2>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300 text-2xl"
            >
              ×
            </button>
          </div>

          {/* User Info */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{user?.displayName || "Unknown"}</h3>
                <p className="text-slate-300">{user?.email}</p>
                <p className="text-slate-200">{user?.bio || "Set your Bio"}</p>
              </div>
            </div>

            {/* Stats */}
            <UserStats user={user} />
          </div>

          {/* Actions */}
          <ProfileActions onLogout={onLogout} />
        </div>
      </div>
    </div>
  );
} 