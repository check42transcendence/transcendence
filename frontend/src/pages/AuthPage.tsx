// src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthFormCard, FieldErrors } from './components/AuthFormCard';

const USE_MOCK = true;

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});

  /* ================= 多语言即时校验 ================= */
  const validateEmail = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) return t('errors.emailRequired');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return t('errors.emailInvalid');
    return undefined;
  };

  const validateUsername = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) return t('errors.usernameRequired');
    if (trimmed.length <= 2) return t('errors.usernameTooShort');
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) return t('errors.passwordRequired');
    const hasLetter = /[A-Za-z]/.test(val);
    const hasNumber = /\d/.test(val);
    const isLongEnough = val.length >= 6;
    if (!isLongEnough || !hasLetter || !hasNumber) {
      return t('errors.passwordTooWeak');
    }
    return undefined;
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setErrors((prev) => ({ ...prev, email: validateEmail(val) }));
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    setErrors((prev) => ({ ...prev, username: validateUsername(val) }));
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setErrors((prev) => ({ ...prev, password: validatePassword(val) }));
  };

  const validateAll = (): boolean => {
    const currentErrors: FieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };

    if (!isLogin) {
      currentErrors.username = validateUsername(username);
    }

    setErrors(currentErrors);
    return !Object.values(currentErrors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);
    setSuccessMessage(null);

    if (!validateAll()) return;

    setIsLoading(true);

    try {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 600));

        if (isLogin) {
          if (password === 'error123') {
            throw new Error(t('errors.invalidCredentials'));
          }
          navigate('/home');
        } else {
          setSuccessMessage(t('auth.regSuccess'));
          setIsLogin(true);
          setPassword('');
        }
        return;
      }

      // 真实后端请求对接
      if (isLogin) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: email.trim(), password }),
        });

        if (!res.ok) {
          if (res.status === 401) throw new Error(t('errors.invalidCredentials'));
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || t('errors.unexpected'));
        }

        navigate('/home');
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: email.trim(), username: username.trim(), password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || t('errors.unexpected'));
        }

        setSuccessMessage(t('auth.regSuccess'));
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBackendError(err.message);
      } else {
        setBackendError(t('errors.unexpected'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin((prev) => !prev);
    setBackendError(null);
    setSuccessMessage(null);
    setErrors({});
  };

  return (
    <AuthFormCard
      isLogin={isLogin}
      isLoading={isLoading}
      backendError={backendError}
      successMessage={successMessage}
      email={email}
      username={username}
      password={password}
      errors={errors}
      onEmailChange={handleEmailChange}
      onUsernameChange={handleUsernameChange}
      onPasswordChange={handlePasswordChange}
      onSubmit={handleSubmit}
      onToggleMode={handleToggleMode}
    />
  );
};

export default AuthPage;