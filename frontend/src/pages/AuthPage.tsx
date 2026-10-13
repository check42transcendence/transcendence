import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthFormCard, FieldErrors } from './components/AuthFormCard';

interface AuthResponse {
  accessToken?: string;
  [key: string]: any;
}

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // 表单受控输入字段
  const [loginInput, setLoginInput] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  // 错误信息集合
  const [errors, setErrors] = useState<FieldErrors>({});

  /* =========================================================================
     校验函数定义 (纯函数)
     ========================================================================= */

  const getEmailError = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) return 'Email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address.';
    }
    return undefined;
  };

  const getUsernameError = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (!trimmed) return 'Username is required.';
    if (trimmed.length <= 2) {
      return 'Username must be more than 2 characters (at least 3).';
    }
    return undefined;
  };

  const getDisplayNameError = (val: string): string | undefined => {
    const trimmed = val.trim();
    if (trimmed.length > 0 && trimmed.length <= 2) {
      return 'Display Name must be more than 2 characters (at least 3).';
    }
    return undefined;
  };

  const getPasswordError = (val: string): string | undefined => {
    if (!val) return 'Password is required.';
    const hasLetter = /[A-Za-z]/.test(val);
    const hasNumber = /\d/.test(val);
    const isLongEnough = val.length >= 6;

    if (!isLongEnough || !hasLetter || !hasNumber) {
      return 'Password must be at least 6 characters and contain both letters and numbers.';
    }
    return undefined;
  };

  const getLoginInputError = (val: string): string | undefined => {
    if (!val.trim()) return 'Username or Email is required.';
    return undefined;
  };

  /* =========================================================================
     输入监听：输入中如果已有报错，则实时清理/更新错误
     ========================================================================= */
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: getEmailError(val) }));
    }
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (errors.username) {
      setErrors((prev) => ({ ...prev, username: getUsernameError(val) }));
    }
  };

  const handleDisplayNameChange = (val: string) => {
    setDisplayName(val);
    if (errors.displayName) {
      setErrors((prev) => ({ ...prev, displayName: getDisplayNameError(val) }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: getPasswordError(val) }));
    }
  };

  const handleLoginInputChange = (val: string) => {
    setLoginInput(val);
    if (errors.loginInput) {
      setErrors((prev) => ({ ...prev, loginInput: getLoginInputError(val) }));
    }
  };

  /* =========================================================================
     失焦校验（用户移开焦点时触发）
     ========================================================================= */
  const handleBlurField = (field: keyof FieldErrors) => {
    if (isLogin) {
      if (field === 'loginInput') setErrors((p) => ({ ...p, loginInput: getLoginInputError(loginInput) }));
      if (field === 'password') setErrors((p) => ({ ...p, password: getPasswordError(password) }));
    } else {
      if (field === 'email') setErrors((p) => ({ ...p, email: getEmailError(email) }));
      if (field === 'username') setErrors((p) => ({ ...p, username: getUsernameError(username) }));
      if (field === 'displayName') setErrors((p) => ({ ...p, displayName: getDisplayNameError(displayName) }));
      if (field === 'password') setErrors((p) => ({ ...p, password: getPasswordError(password) }));
    }
  };

  /* =========================================================================
     点击提交时：全量校验
     ========================================================================= */
  const validateAll = (): boolean => {
    const newErrors: FieldErrors = {};

    newErrors.password = getPasswordError(password);

    if (isLogin) {
      newErrors.loginInput = getLoginInputError(loginInput);
    } else {
      newErrors.email = getEmailError(email);
      newErrors.username = getUsernameError(username);
      newErrors.displayName = getDisplayNameError(displayName);
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const submitAuth = async (): Promise<AuthResponse> => {
    const USE_MOCK: boolean = true;

    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 700));

      if (password === 'error') {
        throw new Error('Invalid username/email or password.');
      }

      if (!isLogin && username === 'admin') {
        throw new Error('Username is already taken.');
      }

      return { accessToken: 'mock-jwt-token' };
    }

    return {};
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);

    // 提交时校验全部字段
    const isValid = validateAll();
    if (!isValid) return;

    setIsLoading(true);
    try {
      const data = await submitAuth();
      if (data?.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
      }
      navigate('/home');
    } catch (err: any) {
      setBackendError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin((prev) => !prev);
    setBackendError(null);
    setErrors({});
  };

  return (
    <AuthFormCard
      isLogin={isLogin}
      isLoading={isLoading}
      backendError={backendError}
      loginInput={loginInput}
      email={email}
      username={username}
      displayName={displayName}
      password={password}
      errors={errors}
      onLoginInputChange={handleLoginInputChange}
      onEmailChange={handleEmailChange}
      onUsernameChange={handleUsernameChange}
      onDisplayNameChange={handleDisplayNameChange}
      onPasswordChange={handlePasswordChange}
      onBlurField={handleBlurField}
      onSubmit={handleSubmit}
      onToggleMode={handleToggleMode}
    />
  );
};

export default AuthPage;