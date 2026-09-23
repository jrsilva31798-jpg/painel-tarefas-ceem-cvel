import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
let isSigningIn = false;
let cachedAccessToken: string | null = null;
const TOKEN_KEY = 'ceem_cvel_google_access';
const TOKEN_LIFETIME_MS = 50 * 60 * 1000;

const rememberAccessToken = (token: string) => {
  cachedAccessToken = token;
  sessionStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({ token, expiresAt: Date.now() + TOKEN_LIFETIME_MS })
  );
};

const restoreAccessToken = (): string | null => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null');
    if (saved?.token && Number(saved.expiresAt) > Date.now()) {
      cachedAccessToken = String(saved.token);
      return cachedAccessToken;
    }
  } catch {
    // A sessão inválida é simplesmente descartada e um novo acesso será pedido.
  }
  sessionStorage.removeItem(TOKEN_KEY);
  cachedAccessToken = null;
  return null;
};

const friendlyAuthError = (error: any): Error => {
  const code = String(error?.code || '');
  if (code.includes('popup-blocked')) {
    return new Error('O navegador bloqueou a janela de acesso. Libere pop-ups para este aplicativo e tente novamente.');
  }
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
    return new Error('O acesso foi cancelado antes da conclusão. Tente novamente e finalize a autorização do Google.');
  }
  if (code.includes('unauthorized-domain')) {
    return new Error('Este endereço ainda não está autorizado no Firebase. O administrador precisa incluir o domínio do aplicativo.');
  }
  if (code.includes('network-request-failed')) {
    return new Error('Falha de conexão durante o acesso. Verifique a internet e tente novamente.');
  }
  if (code.includes('account-exists-with-different-credential')) {
    return new Error('Esta conta já está vinculada por outro método de acesso. Use a conta Google autorizada para o painel.');
  }
  return new Error('Não foi possível concluir o acesso com o Google. Tente novamente.');
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || restoreAccessToken();
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso da autenticação Google.');
    }

    rememberAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Erro ao autenticar com Google:', error);
    throw friendlyAuthError(error);
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || restoreAccessToken();
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  sessionStorage.removeItem(TOKEN_KEY);
};
