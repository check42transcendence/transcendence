// src/api/auth.ts

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  [key: string]: any;
}

/**
 * 获取当前登录用户信息 (Contract: Protected. Returns current User)
 * 通常用于 App 启动时的鉴权初始化或路由守卫
 */
export async function getMe(): Promise<CurrentUser | null> {
  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include', // 携带 HttpOnly Cookie
    });

    if (res.status === 401) {
      return null; // 未登录或凭证过期
    }

    if (!res.ok) {
      throw new Error('Failed to fetch user session.');
    }

    return await res.json();
  } catch {
    return null;
  }
}

/**
 * 退出登录 (Contract: POST /api/auth/logout -> 204 Clears auth cookie)
 */
export async function logout(): Promise<void> {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok && res.status !== 204) {
    throw new Error('Logout failed.');
  }
}