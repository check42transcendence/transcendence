import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LoginRequest, RegisterRequest } from '@project/shared';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. 界面与模式状态
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2. 表单字段
  const [loginField, setLoginField] = useState(''); // 用户名或邮箱
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  // 3. 错误信息标准化解析（兼容 NestJS 的 string 或 string[] 返回格式）
  const extractErrorMessage = (err: any): string => {
    if (err?.message && typeof err.message === 'string') {
      return err.message;
    }
    return 'An unexpected error occurred. Please try again.';
  };

  // 4. API 请求处理（支持无缝切换真实 API 与开发 Mock）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const payload: LoginRequest = {
          login: loginField.trim(),
          password,
        };

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message || 'Login failed';
          throw new Error(detail);
        }

        // 若采用 Token 传输方案，持久化 access_token（若为 HttpOnly Cookie 则无需此步）
        if (data.accessToken) {
          localStorage.setItem('access_token', data.accessToken);
        }
      } else {
        const payload: RegisterRequest = {
          email: email.trim(),
          username: username.trim(),
          password,
          displayName: displayName.trim() || undefined,
        };

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message || 'Registration failed';
          throw new Error(detail);
        }
      }

      // 验证成功，跳转首页
      navigate('/home');
    } catch (err: any) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isLogin ? 'Sign in to access your trips' : 'Start collaborating on your next journey'}
          </p>
        </div>

        {/* 错误提示框 */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start">
            <span className="font-semibold mr-1">Error:</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLogin ? (
            /* 登录字段 */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                required
                value={loginField}
                onChange={(e) => setLoginField(e.target.value)}
                placeholder="Enter email or username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            /* 注册专用字段 */
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="unique_username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* 密码字段 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 提交按钮与 Loading */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* 模式切换 */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMessage(null);
            }}
            className="text-blue-600 font-semibold hover:underline focus:outline-none"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};