# Frontend Optimization Structure

## Tổng quan

Cấu trúc frontend đã được tối ưu hóa để giảm trùng lặp code và cải thiện maintainability.

## Cấu trúc thư mục

```
frontend/
├── lib/
│   ├── api.ts (giữ nguyên)
│   ├── utils/
│   │   ├── index.ts (export tất cả utils)
│   │   ├── formatters.ts (formatNumber, formatCombatPower, etc.)
│   │   ├── colors.ts (getElementColor, getRarityColor)
│   │   ├── storage.ts (localStorage helpers)
│   │   └── validation.ts (validation functions)
│   └── hooks/
│       ├── index.ts (export tất cả hooks)
│       ├── useApi.ts (custom hook cho API calls)
│       ├── useLocalStorage.ts (localStorage hook)
│       └── useFormation.ts (formation specific logic)
├── components/
│   ├── common/
│   │   ├── index.ts (export tất cả common components)
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── PetCard.tsx (reusable pet display)
│   │   └── Modal.tsx (base modal component)
│   └── GameMain/
│       └── components/
│           └── Modals/
│               ├── FormationModal.tsx (cũ)
│               ├── FormationModalOptimized.tsx (mới, sử dụng hooks)
│               └── ...
```

## Utility Functions

### `lib/utils/formatters.ts`
- `formatNumber(num)`: Format số với locale
- `formatCombatPower(power)`: Format lực chiến với K/M suffixes
- `formatPercentage(value, total)`: Format phần trăm
- `formatTime(seconds)`: Format thời gian

### `lib/utils/colors.ts`
- `getElementColor(element)`: Lấy màu theo element
- `getRarityColor(rarity)`: Lấy màu theo rarity
- `getRarityBorderColor(rarity)`: Lấy màu border theo rarity
- `getStatusColor(status)`: Lấy màu theo status

### `lib/utils/storage.ts`
- `getAuthToken()`: Lấy token từ localStorage
- `storage.get/set/remove/clear/has`: Quản lý localStorage
- `userStorage`: Helpers cho user data

### `lib/utils/validation.ts`
- `validation.isValidEmail/Username/Password`: Validation functions
- `getValidationError(field, value)`: Lấy error message

## Custom Hooks

### `lib/hooks/useApi.ts`
```typescript
const api = useApi();
const result = await api.execute('/api/endpoint');
// Tự động handle loading, error states
```

### `lib/hooks/useLocalStorage.ts`
```typescript
const [value, setValue, removeValue] = useLocalStorage('key', defaultValue);
// Tự động sync với localStorage
```

### `lib/hooks/useFormation.ts`
```typescript
const {
  formations,
  selectedFormation,
  availablePets,
  loading,
  error,
  createFormation,
  deleteFormation,
  addPetToFormation,
  removePetFromFormation,
  // ... other functions
} = useFormation();
```

## Common Components

### `components/common/LoadingSpinner.tsx`
```typescript
<LoadingSpinner size="medium" text="Đang tải..." />
```

### `components/common/ErrorMessage.tsx`
```typescript
<ErrorMessage message="Lỗi xảy ra" onClose={clearError} />
```

### `components/common/PetCard.tsx`
```typescript
<PetCard
  pet={userPet}
  onClick={handlePetSelect}
  selected={isSelected}
  size="medium"
  showCombatPower={true}
/>
```

### `components/common/Modal.tsx`
```typescript
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  size="medium"
>
  {/* Modal content */}
</Modal>
```

## Sử dụng FormationModalOptimized

### Thay thế FormationModal cũ:
```typescript
// Thay vì import FormationModal
import { FormationModal } from './FormationModal';

// Sử dụng FormationModalOptimized
import { FormationModalOptimized } from './FormationModalOptimized';

// Sử dụng
<FormationModalOptimized isOpen={isOpen} onClose={onClose} />
```

### Lợi ích:
1. **Ít code hơn**: Logic API được tách ra thành hooks
2. **Tái sử dụng**: PetCard, LoadingSpinner, ErrorMessage có thể dùng ở nhiều nơi
3. **Dễ test**: Mỗi hook/component có thể test riêng
4. **Dễ maintain**: Code được tổ chức rõ ràng
5. **Consistent**: Sử dụng cùng format, colors, validation

## Migration Guide

### Bước 1: Import utilities
```typescript
import { formatCombatPower, getRarityColor } from '../../lib/utils';
```

### Bước 2: Sử dụng hooks
```typescript
import { useFormation } from '../../lib/hooks/useFormation';
const formation = useFormation();
```

### Bước 3: Sử dụng common components
```typescript
import { LoadingSpinner, ErrorMessage, PetCard } from '../../components/common';
```

### Bước 4: Thay thế FormationModal
```typescript
// Cũ
import { FormationModal } from './FormationModal';

// Mới
import { FormationModalOptimized } from './FormationModalOptimized';
```

## Next Steps

1. **Refactor StorageModal**: Sử dụng hooks và common components
2. **Refactor PetsModal**: Sử dụng hooks và common components
3. **Add more hooks**: useStorage, usePets, etc.
4. **Add more common components**: Button, Input, etc.
5. **Add tests**: Unit tests cho hooks và components

## Lưu ý

- FormationModal cũ vẫn được giữ lại để đảm bảo không break existing code
- FormationModalOptimized là phiên bản tối ưu hóa, sử dụng cấu trúc mới
- Có thể xóa FormationModal cũ sau khi đã test kỹ FormationModalOptimized 