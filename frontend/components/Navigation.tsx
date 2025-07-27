'use client';

import Link from 'next/link';
import { useAuthContext } from './AuthProvider';

export const Navigation = () => {
  const { loading, isAuthenticated, isAdmin } = useAuthContext();

  if (loading) {
    return (
      <header style={{background:'#2196f3',color:'#fff',padding:'10px 0',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 2px 8px rgba(33,150,243,0.08)'}}>
        <div style={{fontSize:'2em',fontWeight:'bold',marginLeft:30,letterSpacing:2,textShadow:'1px 2px 4px #1976d2'}}>Game đầu tay</div>
        <nav>
          <span style={{color:'#fff',margin:'0 15px',fontSize:'1.1em'}}>Đang tải...</span>
        </nav>
      </header>
    );
  }

  if (isAuthenticated()) {
    return (
      <header style={{background:'#2196f3',color:'#fff',padding:'10px 0',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 2px 8px rgba(33,150,243,0.08)'}}>
        <div style={{fontSize:'2em',fontWeight:'bold',marginLeft:30,letterSpacing:2,textShadow:'1px 2px 4px #1976d2'}}>Excalibur</div>
        <nav style={{display:'flex',alignItems:'center'}}>
          <Link href="/" style={{color:'#fff',margin:'0 15px',fontWeight:'bold',fontSize:'1.1em'}}>Trang chủ</Link>
          <Link href="/news" style={{color:'#fff',margin:'0 15px',fontWeight:'bold',fontSize:'1.1em'}}>Tin tức</Link>
          {isAdmin() && (
            <Link href="/admin/dashboard" style={{color:'#fff',margin:'0 15px',fontWeight:'bold',fontSize:'1.1em'}}>Dashboard</Link>
          )}
        </nav>
      </header>
    );
  }

  return (
    <header style={{background:'#2196f3',color:'#fff',padding:'10px 0',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 2px 8px rgba(33,150,243,0.08)'}}>
      <div style={{fontSize:'2em',fontWeight:'bold',marginLeft:30,letterSpacing:2,textShadow:'1px 2px 4px #1976d2'}}>AOQI GAME</div>
      <nav>
        <Link href="/" style={{color:'#fff',margin:'0 15px',fontWeight:'bold',fontSize:'1.1em'}}>Trang chủ</Link>
        <Link href="/news" style={{color:'#fff',margin:'0 15px',fontWeight:'bold',fontSize:'1.1em'}}>Tin tức</Link>
      </nav>
    </header>
  );
}; 