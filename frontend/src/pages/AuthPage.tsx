import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthFormCard, FieldErrors } from './components/AuthFormCard';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 严格对齐 P0 契约字段
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});

  /* ===================== 校验逻辑 ===================== */
  const validateEmail = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) return 'Email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return 'Please enter a valid email address.';
    return undefined;
  };

  const validateUsername = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) return 'Username is required.';
    if (trimmed.length <= 2) return 'Username must be more than 2 characters (at least 3).';
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) return 'Password is required.';
    const hasLetter = /[A-Za-z]/.test(val);
    const hasNumber = /\d/.test(val);
    const isLongEnough = val.length >= 6;
    if (!isLongEnough || !hasLetter || !hasNumber) {
      return 'Password must be at least 6 characters and contain both letters and numbers.';
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

  /* ===================== 核心请求逻辑 ===================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);
    setSuccessMessage(null);

    if (!validateAll()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        // [Contract §1]: Login 仅使用 Email + Password
        // 后端会在响应中下发 Set-Cookie: jwt=...; HttpOnly; SameSite=Lax
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // 必须加：携带 & 接收 HttpOnly Cookie
          body: JSON.stringify({ email: email.trim(), password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Login failed. Invalid email or password.');
        }

        // [Contract §13]: 绝不使用 localStorage 存储 Token！
        // 登录成功直接跳转受保护页面，Cookie 由浏览器自动维系
        navigate('/home');
      } else {
        // [Contract §1]: Register 使用 Email + Username + Password
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: email.trim(),
            username: username.trim(),
            password,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Registration failed.');
        }

        // [Contract §2]: 注册不隐式建立会话！必须引导用户显式登录
        setSuccessMessage('Registration successful! Please sign in with your credentials.');
        setIsLogin(true); // 自动切回登录状态
        setPassword('');  // 清空密码以防残留
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBackendError(err.message);
      } else {
        setBackendError('An unexpected network error occurred.');
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