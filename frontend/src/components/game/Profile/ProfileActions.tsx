'use client';

interface ProfileActionsProps {
  onLogout: () => void;
}

export default function ProfileActions({ onLogout }: ProfileActionsProps) {
  return (
    <div className="space-y-3">
      <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold">
        ✏️ Chỉnh Sửa Hồ Sơ
      </button>
      <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold">
        🔧 Cài Đặt
      </button>
      <button 
        onClick={onLogout}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold"
      >
        🚪 Đăng Xuất
      </button>
    </div>
  );
} 