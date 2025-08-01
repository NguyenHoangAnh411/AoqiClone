'use client';
import { useState } from 'react';
import { useAuth } from '@/lib';
import { 
  UserAvatar, 
  GameBackground, 
  GameContentArea, 
  ProfileModal 
} from './game';

export default function MainContent() {
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfileModal(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Game Background */}
      <GameBackground />

      {/* User Avatar - Top Left */}
      <UserAvatar 
        user={user} 
        onAvatarClick={() => setShowProfileModal(true)} 
      />

      {/* Main Content Area */}
      <GameContentArea />

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          user={user}
          onClose={() => setShowProfileModal(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
} 