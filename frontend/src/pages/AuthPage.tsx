// frontend/src/pages/AuthPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. 本地定义请求 Payload 类型（避免跨模块路径报错）
interface LoginPayload {
  login: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();

  // 2. 状态管理：模式切换、加载状态、后端错误提示
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // 表单字段
  const [loginInput, setLoginInput] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  // 3. API 请求（支持真实接口与临时 Mock）
  const submitAuth = async () => {
    // 提示：后端就绪后把 USE_MOCK 改为 false 即可
    const USE_MOCK = true;

    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 700));

      // 模拟测试错误分支：密码输 'error' 触发后端报错
      if (password === 'error') {
        throw new Error('Invalid username/email or password.');
      }
      // 模拟测试注册重名错误
      if (!isLogin && username === 'admin') {
        throw new Error('Username is already taken.');
      }

      return { accessToken: 'mock-jwt-token' };
    }

    // 真实 API 逻辑
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const bodyData = isLogin
      ? ({ login: loginInput.trim(), password } as LoginPayload)
      : ({
          email: email.trim(),
          username: username.trim(),
          password,
          displayName: displayName.trim() || undefined,
        } as RegisterPayload);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });

    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = Array.isArray(resData?.message)
        ? resData.message.join(', ')
        : resData?.message || 'Authentication failed.';
      throw new Error(msg);
    }

    return resData;
  };

  // 4. 表单提交处理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);
    setIsLoading(true);

    try {
      const data = await submitAuth();
      if (data?.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
      }
      // 任务核心：成功后进入 /home
      navigate('/home');
    } catch (err: any) {
      // 任务核心：显示后端 error
      setBackendError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isLogin ? 'Sign In' : 'Create Account'}</h2>
        <p style={styles.subtitle}>
          {isLogin
            ? 'Enter your credentials to continue'
            : 'Fill in the information to get started'}
        </p>

        {/* 后端 Error 消息提示条 */}
        {backendError && (
          <div style={styles.errorBanner}>
            <strong>Error: </strong>
            <span>{backendError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {isLogin ? (
            /* 登录字段 */
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username or Email</label>
              <input
                type="text"
                required
                disabled={isLoading}
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Enter email or username"
                style={styles.input}
              />
            </div>
          ) : (
            /* 注册专用字段 */
            <>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="unique_username"
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Display Name (Optional)</label>
                <input
                  type="text"
                  disabled={isLoading}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  style={styles.input}
                />
              </div>
            </>
          )}

          {/* 密码字段 */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
          </div>

          {/* 提交按钮 & Loading */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.submitBtn,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Submitting...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        {/* 模式切换 */}
        <div style={styles.switchRow}>
          <span>{isLogin ? "Don't have an account? " : 'Already have an account? '}</span>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setIsLogin(!isLogin);
              setBackendError(null);
            }}
            style={styles.switchLink}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    padding: '36px 32px',
    boxSizing: 'border-box',
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    margin: '0 0 20px 0',
    fontSize: '14px',
    color: '#64748b',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
  },
  submitBtn: {
    marginTop: '6px',
    padding: '11px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'background-color 0.15s ease',
  },
  switchRow: {
    marginTop: '18px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#64748b',
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },
};