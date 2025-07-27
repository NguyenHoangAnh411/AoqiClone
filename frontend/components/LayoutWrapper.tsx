'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export const LayoutWrapper = ({ children }: LayoutWrapperProps) => {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}; 