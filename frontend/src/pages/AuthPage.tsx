import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthFormCard, FieldErrors } from './components/AuthFormCard';

// 💡 开发开关：后端接口做好前设为 true；后端上线联调时直接改成 false
const USE_MOCK = true;

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

  /* ================= 格式校验 ================= */
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

  /* ================= 提交处理 (支持 Mock 与 Real API) ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);
    setSuccessMessage(null);

    if (!validateAll()) return;

    setIsLoading(true);

    try {
      // ----------------------------------------------------
      // 1. 本地 MOCK 逻辑 (完全按照后端 P0 契约模拟)
      // ----------------------------------------------------
      if (USE_MOCK) {
        // 模拟 600ms 网络延迟
        await new Promise((resolve) => setTimeout(resolve, 600));

        if (isLogin) {
          // 模拟登录：如果你输入的密码包含 "error" 或不是对应账号，抛出契约规范的 401
          if (password === 'error123') {
            throw new Error('Invalid email or password.');
          }

          // 契约 §1: 登录成功时，后端在浏览器中植入 HttpOnly Cookie
          // 前端不需要也不应该存 localStorage，直接路由跳转
          navigate('/home');
        } else {
          // 模拟注册：如果用户名是 admin 模拟冲突报错
          if (username === 'admin') {
            throw new Error('Username is already taken.');
          }

          // 契约 §2: 注册成功不建立登录态，提示并切回登录页
          setSuccessMessage('Account created successfully! Please sign in with your email and password.');
          setIsLogin(true);
          setPassword('');
        }
        return;
      }

      // ----------------------------------------------------
      // 2. 真实后端接口请求逻辑 (USE_MOCK 设为 false 时自动启用)
      // ----------------------------------------------------
      if (isLogin) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: email.trim(), password }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Invalid email or password.');
          }
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Login failed. Please try again.');
        }

        navigate('/home');
      } else {
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

        setSuccessMessage('Account created successfully! Please sign in with your email and password.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBackendError(err.message);
      } else {
        setBackendError('An unexpected error occurred.');
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