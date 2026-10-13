// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const resources = {
    en: {
        translation: {
            auth: {
                signIn: 'Sign In',
                createAccount: 'Create Account',
                signInSubtitle: 'Enter your email and password to continue',
                createAccountSubtitle: 'Sign up with email, username and password',
                emailLabel: 'Email',
                usernameLabel: 'Username',
                passwordLabel: 'Password',
                emailPlaceholder: 'user@example.com',
                usernamePlaceholder: 'At least 3 characters',
                passwordPlaceholder: '••••••••',
                processing: 'Processing...',
                submitSignIn: 'Sign In',
                submitRegister: 'Register',
                noAccount: "Don't have an account?",
                haveAccount: 'Already have an account?',
                signUpLink: 'Sign up',
                signInLink: 'Sign in',
                regSuccess: 'Account created successfully! Please sign in with your credentials.',
            },
            errors: {
                emailRequired: 'Email is required.',
                emailInvalid: 'Please enter a valid email address.',
                usernameRequired: 'Username is required.',
                usernameTooShort: 'Username must be more than 2 characters.',
                passwordRequired: 'Password is required.',
                passwordTooWeak: 'Password must be at least 6 characters and contain letters and numbers.',
                invalidCredentials: 'Invalid email or password.',
                unexpected: 'An unexpected error occurred.',
            },
        },
    },
    zh: {
        translation: {
            auth: {
                signIn: '登录',
                createAccount: '创建账号',
                signInSubtitle: '请输入您的邮箱和密码以继续',
                createAccountSubtitle: '使用邮箱、用户名和密码注册',
                emailLabel: '电子邮箱',
                usernameLabel: '用户名',
                passwordLabel: '密码',
                emailPlaceholder: 'user@example.com',
                usernamePlaceholder: '至少 3 个字符',
                passwordPlaceholder: '••••••••',
                processing: '处理中...',
                submitSignIn: '登 录',
                submitRegister: '注 册',
                noAccount: '还没有账号？',
                haveAccount: '已有账号？',
                signUpLink: '立即注册',
                signInLink: '返回登录',
                regSuccess: '账号创建成功！请使用账号密码登录。',
            },
            errors: {
                emailRequired: '请输入电子邮箱。',
                emailInvalid: '请输入有效的邮箱地址。',
                usernameRequired: '请输入用户名。',
                usernameTooShort: '用户名必须大于 2 个字符（至少 3 位）。',
                passwordRequired: '请输入密码。',
                passwordTooWeak: '密码必须大于等于 6 位且同时包含字母和数字。',
                invalidCredentials: '邮箱或密码错误。',
                unexpected: '发生未知错误，请重试。',
            },
        },
    },
    fr: {
        translation: {
            auth: {
                signIn: 'Connexion',
                createAccount: 'Créer un compte',
                signInSubtitle: 'Entrez votre email et mot de passe pour continuer',
                createAccountSubtitle: 'Inscrivez-vous avec un email, nom d’utilisateur et mot de passe',
                emailLabel: 'Adresse e-mail',
                usernameLabel: "Nom d'utilisateur",
                passwordLabel: 'Mot de passe',
                emailPlaceholder: 'user@example.com',
                usernamePlaceholder: 'Au moins 3 caractères',
                passwordPlaceholder: '••••••••',
                processing: 'En cours...',
                submitSignIn: 'Se connecter',
                submitRegister: "S'inscrire",
                noAccount: "Vous n'avez pas de compte ?",
                haveAccount: 'Vous avez déjà un compte ?',
                signUpLink: "S'inscrire",
                signInLink: 'Se connecter',
                regSuccess: 'Compte créé avec succès ! Veuillez vous connecter.',
            },
            errors: {
                emailRequired: 'L’e-mail est requis.',
                emailInvalid: 'Veuillez saisir une adresse e-mail valide.',
                usernameRequired: "Le nom d'utilisateur est requis.",
                usernameTooShort: "Le nom d'utilisateur doit contenir plus de 2 caractères.",
                passwordRequired: 'Le mot de passe est requis.',
                passwordTooWeak: 'Le mot de passe doit comporter au moins 6 caractères avec lettres et chiffres.',
                invalidCredentials: 'Email ou mot de passe incorrect.',
                unexpected: 'Une erreur inattendue est survenue.',
            },
        },
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en', // 默认备用语言
        interpolation: {
            escapeValue: false, // React 默认防范 XSS
        },
        react: {
            useSuspense: false, // 👈 关键！禁止 Suspense 导致的白屏挂起
        }
    });

export default i18n;