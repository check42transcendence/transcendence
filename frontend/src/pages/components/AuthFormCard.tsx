// src/components/AuthFormCard.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

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
  email: string;
  username: string;
  password: string;
  errors: FieldErrors;
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
  const { t, i18n } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-sky-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl border border-gray-100 relative">
        
        {/* 右上角语言切换器 */}
        <div className="absolute top-4 right-4">
          <select
            value={i18n.language.split('-')[0]} // 兼容 zh-CN 等情况
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="text-xs border border-gray-200 rounded-md py-1 px-2 bg-gray-50 text-gray-700 outline-none hover:border-indigo-400 cursor-pointer"
          >
            <option value="en">English (EN)</option>
            <option value="zh">中文 (ZH)</option>
            <option value="fr">Français (FR)</option>
          </select>
        </div>

        {/* 头部标题区 */}
        <div className="text-center pt-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {isLogin ? t('auth.signIn') : t('auth.createAccount')}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isLogin ? t('auth.signInSubtitle') : t('auth.createAccountSubtitle')}
          </p>
        </div>

        {/* 成功与失败横幅 */}
        {successMessage && (
          <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-800">
            {successMessage}
          </div>
        )}

        {backendError && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-700 flex items-start gap-2">
            <span className="font-semibold shrink-0">Error:</span>
            <span>{backendError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.emailLabel')}
            </label>
            <input
              type="email"
              disabled={isLoading}
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
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

          {/* Username (仅注册可见) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.usernameLabel')}
              </label>
              <input
                type="text"
                disabled={isLoading}
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder={t('auth.usernamePlaceholder')}
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

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.passwordLabel')}
            </label>
            <input
              type="password"
              disabled={isLoading}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
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

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading
              ? t('auth.processing')
              : isLogin
              ? t('auth.submitSignIn')
              : t('auth.submitRegister')}
          </button>
        </form>

        {/* 模式切换 */}
        <div className="text-center text-sm text-gray-600 pt-2 border-t border-gray-100">
          <span>{isLogin ? t('auth.noAccount') : t('auth.haveAccount')} </span>
          <button
            type="button"
            disabled={isLoading}
            onClick={onToggleMode}
            className="font-semibold text-indigo-600 hover:text-indigo-500 underline-offset-4 hover:underline focus:outline-none disabled:opacity-50"
          >
            {isLogin ? t('auth.signUpLink') : t('auth.signInLink')}
          </button>
        </div>
      </div>
    </div>
  );
};