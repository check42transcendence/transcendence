import React from 'react';

export interface FieldErrors {
  loginInput?: string;
  email?: string;
  username?: string;
  displayName?: string;
  password?: string;
}

export interface AuthFormCardProps {
  isLogin: boolean;
  isLoading: boolean;
  backendError: string | null;
  // 受控输入值
  loginInput: string;
  email: string;
  username: string;
  displayName: string;
  password: string;
  // 错误信息
  errors: FieldErrors;
  // 输入与失焦事件
  onLoginInputChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onUsernameChange: (val: string) => void;
  onDisplayNameChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onBlurField: (field: keyof FieldErrors) => void;
  // 行为
  onSubmit: (e: React.FormEvent) => void;
  onToggleMode: () => void;
}

export const AuthFormCard: React.FC<AuthFormCardProps> = ({
  isLogin,
  isLoading,
  backendError,
  loginInput,
  email,
  username,
  displayName,
  password,
  errors,
  onLoginInputChange,
  onEmailChange,
  onUsernameChange,
  onDisplayNameChange,
  onPasswordChange,
  onBlurField,
  onSubmit,
  onToggleMode,
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        
        {/* 卡片头部标题区 */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isLogin
              ? 'Enter your credentials to continue'
              : 'Fill in the information to get started'}
          </p>
        </div>

        {/* 顶部后端 Error 提示区 */}
        {backendError && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-700 flex items-start gap-2">
            <span className="font-semibold shrink-0">Error:</span>
            <span>{backendError}</span>
          </div>
        )}

        {/* 核心表单区域：加上 noValidate 禁止浏览器原生弹泡阻断 */}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {isLogin ? (
            /* 登录模式输入项 */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username or Email
              </label>
              <input
                type="text"
                disabled={isLoading}
                value={loginInput}
                onChange={(e) => onLoginInputChange(e.target.value)}
                onBlur={() => onBlurField('loginInput')}
                placeholder="Enter email or username"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none ${
                  errors.loginInput
                    ? 'border-red-500 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-gray-300 text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
              />
              {errors.loginInput && (
                <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.loginInput}</p>
              )}
            </div>
          ) : (
            /* 注册模式输入项组 */
            <>
              {/* Email 输入框 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  onBlur={() => onBlurField('email')}
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

              {/* Username 输入框（大于2个字符） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  disabled={isLoading}
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  onBlur={() => onBlurField('username')}
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

              {/* Display Name 输入框（选填，若填须大于2个字符） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name (Optional)
                </label>
                <input
                  type="text"
                  disabled={isLoading}
                  value={displayName}
                  onChange={(e) => onDisplayNameChange(e.target.value)}
                  onBlur={() => onBlurField('displayName')}
                  placeholder="At least 3 characters (optional)"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none ${
                    errors.displayName
                      ? 'border-red-500 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-gray-300 text-gray-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                  } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                />
                {errors.displayName && (
                  <p className="mt-1.5 text-xs text-red-600 font-semibold">{errors.displayName}</p>
                )}
              </div>
            </>
          )}

          {/* Password 输入项 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              disabled={isLoading}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onBlur={() => onBlurField('password')}
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

          {/* 提交动作按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Submitting...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        {/* 底部模式切换操作栏 */}
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