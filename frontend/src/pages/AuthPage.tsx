// frontend/src/pages/AuthPage.tsx

// 导入 React 基础库及核心 Hook：useState 用于管理组件内部响应式状态
import React, { useState } from 'react';
// 导入 React Router 的编程式导航 Hook，用于在验证成功后无刷新跳转页面
import { useNavigate } from 'react-router-dom';

/* =========================================================================
 * 1. 本地契约类型定义 (Payload Interface)
 * 作用：约束提交给后端的请求体结构；本地自包含可避免跨 Monorepo 模块引用导致的编译阻断。
 * ========================================================================= */

/** 登录接口请求体规范 */
interface LoginPayload {
  login: string;    // 用户名或注册邮箱（后端通常支持双重标识登录）
  password: string; // 用户密码明文（由 HTTPS 传输层保障安全）
}

/** 注册接口请求体规范 */
interface RegisterPayload {
  email: string;        // 用户唯一邮箱
  username: string;     // 用户唯一展示名/账号
  password: string;     // 初始密码
  displayName?: string; // 可选字段：个人昵称（允许为空）
}

/**
 * AuthPage: 登录/注册一体化认证组件
 */
export const AuthPage: React.FC = () => {
  // 获取路由跳转实例，后续在表单提交成功后驱动页面流转
  const navigate = useNavigate();

  /* =========================================================================
   * 2. 组件交互与业务状态管理 (State)
   * ========================================================================= */

  // 模式切换状态：true 代表当前是“登录”模式；false 代表“注册”模式
  const [isLogin, setIsLogin] = useState<boolean>(true);

  // 网络请求加载中标志：用于防止用户疯狂连击按钮（防重提交），并渲染 Loading 文本
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 错误信息容器：接收来自后端或 Mock 拦截返回的错误描述，用于在顶部渲染警示条
  const [backendError, setBackendError] = useState<string | null>(null);

  /* ---------- 表单输入受控字段 (Controlled Inputs) ---------- */
  const [loginInput, setLoginInput] = useState('');   // 登录模式下的输入（用户名或邮箱）
  const [email, setEmail] = useState('');             // 注册模式下的邮箱输入
  const [username, setUsername] = useState('');       // 注册模式下的用户名输入
  const [displayName, setDisplayName] = useState(''); // 注册模式下的可选昵称输入
  const [password, setPassword] = useState('');       // 两种模式通用的密码输入

  /* =========================================================================
   * 3. API 请求通信层 (支持 Mock 模拟与真实接口无缝切换)
   * ========================================================================= */
  const submitAuth = async () => {
    // 开关标志：在后端接口未就绪前保持 true；后端服务拉起后改为 false 走真实 fetch
    const USE_MOCK = true;

    if (USE_MOCK) {
      // 模拟真实的弱网/标准网络环境，人为制造 700ms 延迟以验证 Loading 状态渲染
      await new Promise((resolve) => setTimeout(resolve, 700));

      // [测试分支 A]：当密码输入 "error" 时，主动抛出异常，验证前端 Error Banner 是否正确渲染
      if (password === 'error') {
        throw new Error('Invalid username/email or password.');
      }

      // [测试分支 B]：注册模式下若用户名为 "admin"，模拟后端 409 Conflict 账号已被占用错误
      if (!isLogin && username === 'admin') {
        throw new Error('Username is already taken.');
      }

      // 默认走成功分支：返回模拟的 JWT 凭证
      return { accessToken: 'mock-jwt-token' };
    }

    /* ---------- 真实 API 请求逻辑 ---------- */
    // 根据当前模式动态决定调用哪一个后端 Endpoint
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    // 组装并清洗请求载荷（去除前后多余空格，将空字符串昵称转换为 undefined）
    const bodyData = isLogin
      ? ({ login: loginInput.trim(), password } as LoginPayload)
      : ({
          email: email.trim(),
          username: username.trim(),
          password,
          displayName: displayName.trim() || undefined,
        } as RegisterPayload);

    // 发起 HTTP POST 请求
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });

    // 尝试安全解析后端 JSON 响应（增加 catch 防御非 JSON 格式的 502/500 页面抛错）
    const resData = await res.json().catch(() => ({}));

    // 若 HTTP 状态码不属于 2xx（例如 400 Validation Error, 401 Unauthorized, 409 Conflict 等）
    if (!res.ok) {
      // 适配 NestJS/class-validator 多态错误格式：可能是 string，也可能是 string[]
      const msg = Array.isArray(resData?.message)
        ? resData.message.join(', ')
        : resData?.message || 'Authentication failed.';
      throw new Error(msg);
    }

    return resData;
  };

  /* =========================================================================
   * 4. 表单提交入口逻辑 (Submit Handler)
   * ========================================================================= */
  const handleSubmit = async (e: React.FormEvent) => {
    // 阻止浏览器默认的表单跳转刷新行为，转由 SPA 单页应用异步接管
    e.preventDefault();

    // 每次新提交前，先重置清空上一轮的报错提示
    setBackendError(null);

    // 开启加载锁：置灰输入框与提交按钮，防止重复并发提交
    setIsLoading(true);

    try {
      // 执行请求逻辑（Mock 或 真实 API）
      const data = await submitAuth();

      // 若响应体中携带 Access Token，暂存至本地缓存（如果使用 HttpOnly Cookie 则无需此步）
      if (data?.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
      }

      // 【任务核心验收指标】：身份认证通过后，无刷新跳转至主应用页面 /home
      navigate('/home');
    } catch (err: any) {
      // 【任务核心验收指标】：捕获异常并提取错误描述，激活页面红色错误信息条
      setBackendError(err.message || 'An unexpected error occurred.');
    } finally {
      // 无论请求成功还是失败，均关闭加载锁，恢复按钮与输入框交互能力
      setIsLoading(false);
    }
  };

  /* =========================================================================
   * 5. 视图渲染 (JSX)
   * ========================================================================= */
  return (
    <div style={styles.container}>
      {/* 居中白色卡片容器 */}
      <div style={styles.card}>
        {/* 卡片头部标题区：随登录/注册模式自适应 */}
        <h2 style={styles.title}>{isLogin ? 'Sign In' : 'Create Account'}</h2>
        <p style={styles.subtitle}>
          {isLogin
            ? 'Enter your credentials to continue'
            : 'Fill in the information to get started'}
        </p>

        {/* 【后端 Error 提示区】：当存在错误信息时条件渲染 */}
        {backendError && (
          <div style={styles.errorBanner}>
            <strong>Error: </strong>
            <span>{backendError}</span>
          </div>
        )}

        {/* 核心表单区域 */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {isLogin ? (
            /* ----- 模式 A：登录专用输入项 ----- */
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username or Email</label>
              <input
                type="text"
                required
                disabled={isLoading} // 加载中时禁用，提升用户体验
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Enter email or username"
                style={styles.input}
              />
            </div>
          ) : (
            /* ----- 模式 B：注册专用输入项组 ----- */
            <>
              {/* 邮箱输入框 */}
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

              {/* 用户名输入框 */}
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

              {/* 昵称输入框（非必填） */}
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

          {/* ----- 两种模式通用的密码输入项 ----- */}
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

          {/* ----- 提交动作按钮：加载中态联动 ----- */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.submitBtn,
              opacity: isLoading ? 0.7 : 1,               // 视觉淡化
              cursor: isLoading ? 'not-allowed' : 'pointer', // 改变鼠标指针为禁止状态
            }}
          >
            {/* Loading 状态下显示友好提示文案 */}
            {isLoading ? 'Submitting...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        {/* 底部模式切换操作栏 */}
        <div style={styles.switchRow}>
          <span>{isLogin ? "Don't have an account? " : 'Already have an account? '}</span>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              // 切换模式并顺带清空旧的错误信息
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

// 默认导出该组件，便于 App.tsx 路由解构引入
export default AuthPage;

/* =========================================================================
 * 6. 独立内联样式 (CSS-in-JS Style Dictionary)
 * 特点：完全解耦，不依赖外部 CSS 类名或 UI 框架即可保证开箱即用。
 * ========================================================================= */
const styles: Record<string, React.CSSProperties> = {
  // 全屏灰色底色容器，确保卡片垂直水平绝对居中
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  // 白色内容卡片
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
  // 红色错误提示条
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