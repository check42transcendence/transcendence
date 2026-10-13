import React from 'react';

export interface FieldErrors {
  email?: string;
  username?: string;
  password?: string;
}

export interface AuthFormCardProps {
  isLogin: boolean;
  isLoading: boolean;
  backendError: string | null;
  successMessage: string | null;
  // 受控输入：仅严格保留契约规定的 3 个字段
  email: string;
  username: string;
  password: string;
  // 即时错误
  errors: FieldErrors;
  // 变更处理
  onEmailChange: (val: string) => void;
  onUsernameChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleMode: () => void;
}

export const AuthFormCard: React.FC<AuthFormCardProps> = ({
  isLogin,
  isLoading,
  backendError,
  successMessage,
  email,
  username,
  password,
  errors,
  onEmailChange,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onToggleMode,
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-sky-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        
        {/* 卡片头部 */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isLogin
              ? 'Enter your email and password to continue'
              : 'Sign up with email, username and password'}
          </p>
        </div>

        {/* 注册成功反馈提示 */}
        {successMessage && (
          <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-800">
            {successMessage}
          </div>
        )}

        {/* 错误提示 */}
        {backendError && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-700 flex items-start gap-2">
            <span className="font-semibold shrink-0">Error:</span>
            <span>{backendError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* Email：登录和注册都需要 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              disabled={isLoading}
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="user@example.com"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none ${
                errors.email
                  ? 'border-red-500 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-gray-300 text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
              } disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.email}</p>
            )}
          </div>

          {/* Username：仅注册模式需要 (Email + Username + Password) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                disabled={isLoading}
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="At least 3 characters"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none ${
                  errors.username
                    ? 'border-red-500 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-gray-300 text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
              />
              {errors.username && (
                <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.username}</p>
              )}
            </div>
          )}

          {/* Password：登录和注册都需要 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              disabled={isLoading}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none ${
                errors.password
                  ? 'border-red-500 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-gray-300 text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
              } disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600 pt-2 border-t border-gray-100">
          <span>{isLogin ? "Don't have an account? " : 'Already have an account? '}</span>
          <button
            type="button"
            disabled={isLoading}
            onClick={onToggleMode}
            className="font-semibold text-indigo-600 hover:text-indigo-500 underline-offset-4 hover:underline focus:outline-none disabled:opacity-50"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};