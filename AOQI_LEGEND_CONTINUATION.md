# AOQI LEGEND GAME - HƯỚNG DẪN TIẾP TỤC DỰ ÁN

## 📋 TỔNG QUAN DỰ ÁN

**AOQI LEGEND** (Huyền Thoại AOQI) là một game thu thập và chiến đấu thú cưng được phát triển bằng tiếng Việt, tương tự như Pokemon. Dự án sử dụng kiến trúc full-stack với backend Node.js và frontend Next.js.

### 🎯 Mục Tiêu
- Xây dựng game mobile-friendly với giao diện đẹp
- Hệ thống thu thập và nuôi thú cưng
- Chiến đấu turn-based với đội hình
- Shop và inventory system
- Hệ thống level up và evolution

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### Backend (Node.js/Express/MongoDB)
```
server/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── gameDataController.js
│   ├── userController.js
│   ├── petController.js
│   └── userPetController.js
├── models/ (20+ models)
│   ├── User.js
│   ├── Pet.js
│   ├── UserPet.js
│   ├── Skill.js
│   ├── Effect.js
│   └── ...
├── routes/
│   ├── auth.js
│   ├── user.js
│   ├── pet.js
│   └── userPet.js
└── server.js
```

### Frontend (Next.js/TypeScript)
```
frontend/src/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AuthForm.tsx
│   ├── MainContent.tsx
│   └── ProtectedRoute.tsx
├── lib/
│   ├── auth-context.tsx
│   ├── api.ts
│   ├── types.ts
│   ├── auth-utils.ts
│   ├── api-utils.ts
│   └── common-utils.ts
└── globals.css
```

---

## ✅ TÍNH NĂNG ĐÃ HOÀN THÀNH

### 🔐 Backend APIs

#### Authentication System
- ✅ **POST** `/api/auth/login` - Đăng nhập
- ✅ **POST** `/api/auth/register` - Đăng ký
- ✅ **POST** `/api/auth/logout` - Đăng xuất
- ✅ **GET** `/api/auth/profile` - Lấy thông tin user
- ✅ **PUT** `/api/auth/profile` - Cập nhật profile
- ✅ **PUT** `/api/auth/password` - Đổi mật khẩu

#### User Management
- ✅ **GET** `/api/users` - Danh sách users (admin)
- ✅ **GET** `/api/users/:id` - Chi tiết user
- ✅ **PUT** `/api/users/:id` - Cập nhật user
- ✅ **DELETE** `/api/users/:id` - Xóa user

#### Game Data APIs
- ✅ **GET** `/api/gamedata/elements` - Danh sách elements
- ✅ **GET** `/api/gamedata/rarities` - Danh sách rarities
- ✅ **GET** `/api/gamedata/effects` - Danh sách effects

#### Admin Pet Management
- ✅ **GET** `/api/pets` - Danh sách pet templates
- ✅ **POST** `/api/pets` - Tạo pet mới (với skill tích hợp)
- ✅ **PUT** `/api/pets/:id` - Cập nhật pet
- ✅ **DELETE** `/api/pets/:id` - Xóa pet
- ✅ **GET** `/api/pets/elements` - Elements có sẵn
- ✅ **GET** `/api/pets/rarities` - Rarities có sẵn

#### User Pet Management
- ✅ **GET** `/api/userpets` - Danh sách thú cưng của user
- ✅ **GET** `/api/userpets/:id` - Chi tiết thú cưng
- ✅ **POST** `/api/userpets` - Tạo thú cưng mới
- ✅ **PUT** `/api/userpets/:id/move` - Di chuyển thú cưng
- ✅ **PUT** `/api/userpets/:id/levelup` - Level up thú cưng
- ✅ **PUT** `/api/userpets/:id/evolve` - Evolution thú cưng
- ✅ **PUT** `/api/userpets/:id/skills` - Quản lý skill

### 🎨 Frontend Components

#### Authentication
- ✅ **AuthForm.tsx** - Modal đăng nhập/đăng ký với tabs
- ✅ **auth-context.tsx** - React Context quản lý authentication
- ✅ **ProtectedRoute.tsx** - Component bảo vệ routes

#### Main Interface
- ✅ **MainContent.tsx** - Dashboard chính với map background
- ✅ **User Avatar** - Avatar ở góc trên bên trái với profile modal
- ✅ **Game-style UI** - Dark theme với gradients và animations

#### Styling
- ✅ **Tailwind CSS v3** - Utility-first CSS framework
- ✅ **Game-style Design** - Dark theme, gradients, glassmorphism
- ✅ **Responsive Design** - Mobile-friendly
- ✅ **Vietnamese Language** - Tất cả text bằng tiếng Việt

---

## 🎯 TRẠNG THÁI HIỆN TẠI

### ✅ Đã Hoàn Thành
1. **Backend Foundation** - Tất cả APIs cơ bản đã hoạt động
2. **Authentication System** - Login/Register/Logout hoàn chỉnh
3. **Database Models** - 20+ models với relationships
4. **Admin Pet Management** - CRUD operations với skill integration
5. **User Pet System** - Quản lý thú cưng của user
6. **Frontend Authentication** - AuthForm với tabs
7. **Main Dashboard** - Game-style interface với map background
8. **User Profile Modal** - Avatar click để xem profile

### 🔄 Logic Hiện Tại
```typescript
// page.tsx - Logic đã đơn giản hóa
{!user && <AuthForm />}  // Hiển thị form đăng nhập khi chưa đăng nhập
{user && <MainContent />} // Hiển thị dashboard khi đã đăng nhập
```

---

## 🚀 CÁC BƯỚC TIẾP THEO

### 📋 Priority 1: Hoàn Thiện Core Features

#### 1. Pet Management UI
**Mục tiêu:** Tạo giao diện quản lý thú cưng của user

**Cần xây dựng:**
- [ ] **PetList Component** - Danh sách thú cưng với grid layout
- [ ] **PetCard Component** - Card hiển thị thông tin thú cưng
- [ ] **PetDetail Modal** - Modal xem chi tiết thú cưng
- [ ] **PetStats Display** - Hiển thị stats (HP, Attack, Defense, etc.)
- [ ] **Skill Management UI** - Quản lý skills của thú cưng

**API sẵn có:**
- `GET /api/userpets` - Lấy danh sách
- `GET /api/userpets/:id` - Lấy chi tiết
- `PUT /api/userpets/:id/skills` - Quản lý skill

#### 2. Battle System UI
**Mục tiêu:** Tạo giao diện chiến đấu

**Cần xây dựng:**
- [ ] **Formation UI** - Tạo đội hình chiến đấu
- [ ] **Battle Interface** - Giao diện chiến đấu
- [ ] **Turn-based Combat** - Hệ thống lượt đánh
- [ ] **Battle Results** - Hiển thị kết quả và rewards

**API cần thêm:**
- `POST /api/battles` - Tạo battle mới
- `PUT /api/battles/:id/action` - Thực hiện action
- `GET /api/battles/:id` - Lấy thông tin battle

#### 3. Shop & Inventory System
**Mục tiêu:** Hệ thống mua bán và quản lý items

**Cần xây dựng:**
- [ ] **Shop Interface** - Giao diện cửa hàng
- [ ] **Item Catalog** - Danh mục items
- [ ] **Purchase System** - Hệ thống mua hàng
- [ ] **Inventory Management** - Quản lý inventory
- [ ] **Equipment System** - Trang bị cho thú cưng

**API cần thêm:**
- `GET /api/shop/items` - Danh sách items
- `POST /api/shop/purchase` - Mua item
- `GET /api/inventory` - Inventory của user
- `PUT /api/userpets/:id/equipment` - Trang bị equipment

### 📋 Priority 2: Enhancement Features

#### 4. Game Features Integration
**Mục tiêu:** Kết nối các nút trong MainContent với tính năng thực tế

**Cần làm:**
- [ ] **Thú Cưng Button** → Navigate to Pet Management
- [ ] **Chiến Đấu Button** → Navigate to Battle System
- [ ] **Phiêu Lưu Button** → Navigate to Adventure/Quest
- [ ] **Cửa Hàng Button** → Navigate to Shop
- [ ] **Đội Hình Button** → Navigate to Formation
- [ ] **Xếp Hạng Button** → Navigate to Leaderboard

#### 5. User Experience Improvements
**Mục tiêu:** Cải thiện trải nghiệm người dùng

**Cần làm:**
- [ ] **Loading States** - Hiển thị loading khi gọi API
- [ ] **Error Handling** - Xử lý lỗi tốt hơn
- [ ] **Notifications** - Thông báo thành công/thất bại
- [ ] **Animations** - Thêm animations cho interactions
- [ ] **Sound Effects** - Âm thanh cho game actions

---

## 🛠️ HƯỚNG DẪN PHÁT TRIỂN

### 🔧 Setup Development Environment

#### Backend
```bash
cd server
npm install
npm start
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### 📝 Development Guidelines

#### Code Style
- **TypeScript** - Sử dụng strict mode
- **ESLint** - Tuân thủ coding standards
- **Prettier** - Format code tự động
- **Vietnamese Comments** - Comment bằng tiếng Việt

#### Component Structure
```typescript
// Template cho component mới
'use client';
import { useState } from 'react';
import { useAuth } from '@/lib';

interface ComponentProps {
  // Props definition
}

export default function ComponentName({ ...props }: ComponentProps) {
  const { user } = useAuth();
  const [state, setState] = useState();

  // Component logic

  return (
    <div className="game-style-classes">
      {/* Component JSX */}
    </div>
  );
}
```

#### API Integration Pattern
```typescript
// Template cho API calls
const handleAction = async () => {
  try {
    setLoading(true);
    const response = await apiClient.someAction(data);
    if (response.success) {
      // Handle success
    } else {
      setError(response.message);
    }
  } catch (error) {
    setError('Có lỗi xảy ra');
  } finally {
    setLoading(false);
  }
};
```

### 🎨 UI/UX Guidelines

#### Color Scheme
- **Primary:** Blue gradients (`from-blue-500 to-blue-600`)
- **Secondary:** Purple gradients (`from-purple-500 to-purple-600`)
- **Success:** Green gradients (`from-green-500 to-green-600`)
- **Warning:** Yellow gradients (`from-yellow-500 to-yellow-600`)
- **Danger:** Red gradients (`from-red-500 to-red-600`)

#### Typography
- **Headings:** `font-bold text-white`
- **Body Text:** `text-slate-300`
- **Muted Text:** `text-slate-400`
- **Accent Text:** `text-blue-400`

#### Component Styling
```css
/* Game-style button */
.game-btn {
  @apply bg-gradient-to-r from-blue-600 to-blue-700 
         text-white px-4 py-2 rounded-lg 
         hover:from-blue-700 hover:to-blue-800 
         transition-all shadow-lg font-semibold;
}

/* Glassmorphism card */
.game-card {
  @apply bg-white/10 backdrop-blur-sm 
         rounded-2xl shadow-xl 
         border border-white/20;
}
```

---

## 📊 DATABASE SCHEMA

### Core Models

#### User
```javascript
{
  username: String,
  email: String,
  displayName: String,
  password: String (hashed),
  golds: Number,
  diamonds: Number,
  level: Number,
  experience: Number
}
```

#### Pet (Template)
```javascript
{
  name: String,
  element: ObjectId (ref: Element),
  rarity: ObjectId (ref: Rarity),
  baseStats: {
    hp: Number,
    attack: Number,
    defense: Number,
    speed: Number
  },
  skills: [{
    normal: ObjectId (ref: Skill),
    ultimate: ObjectId (ref: Skill),
    passive: ObjectId (ref: Skill)
  }]
}
```

#### UserPet (Instance)
```javascript
{
  user: ObjectId (ref: User),
  pet: ObjectId (ref: Pet),
  level: Number,
  experience: Number,
  stats: {
    hp: Number,
    attack: Number,
    defense: Number,
    speed: Number
  },
  location: String, // 'bag', 'storage', 'formation'
  skills: [ObjectId (ref: Skill)]
}
```

---

## 🧪 TESTING

### API Testing
- Sử dụng scripts trong `server/scripts/`
- Test tất cả endpoints trước khi deploy
- Verify error handling

### Frontend Testing
- Test responsive design trên mobile
- Verify authentication flow
- Test error states

---

## 📚 RESOURCES

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Documentation](https://expressjs.com/)

### Design References
- [aoqi.100bt.com](https://aoqi.100bt.com) - Game style reference
- [Glassmorphism Design](https://glassmorphism.com/) - UI effect reference

---

## 🎯 MILESTONES

### Phase 1: Foundation ✅
- [x] Backend setup
- [x] Authentication system
- [x] Basic models
- [x] Core APIs

### Phase 2: Core Pet System ✅
- [x] Pet management APIs
- [x] User pet system
- [x] Skill and effect system
- [x] Basic frontend

### Phase 3: Game Features 🚧
- [ ] Pet management UI
- [ ] Battle system
- [ ] Shop and inventory
- [ ] Formation system

### Phase 4: Polish & Launch
- [ ] Performance optimization
- [ ] Mobile optimization
- [ ] Final testing
- [ ] Deployment

---

**Hãy tiếp tục từ Phase 3, tập trung vào việc xây dựng các tính năng game và giao diện người dùng!** 