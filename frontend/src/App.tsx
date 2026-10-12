import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 访问根路径自动重定向到 /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 关键：确保这里的 path 完全匹配 /login */}
        <Route path="/login" element={<AuthPage />} />
        
        {/* 登录成功后的主页 */}
        <Route path="/home" element={<div style={{ padding: 24 }}>Home Page</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
