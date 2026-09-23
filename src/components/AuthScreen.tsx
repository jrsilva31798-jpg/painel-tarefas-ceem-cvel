import React from 'react';
import { LayoutDashboard, ShieldCheck, FileSpreadsheet } from 'lucide-react';

interface AuthScreenProps {
  onLogin: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  isLoading,
  error,
}) => {
  return (
    <div
      id="auth-screen-container"
      className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-12"
    >
      <div
        id="auth-card"
        className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm text-center"
      >
        {/* App Logo & Brand */}
        <div
          id="auth-brand-badge"
          className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-inner"
        >
          <LayoutDashboard className="w-8 h-8" />
        </div>

        <span
          id="auth-org-label"
          className="inline-block text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full mb-2"
        >
          CEEM CVEL • Operacional
        </span>

        <h1
          id="auth-title"
          className="text-2xl font-bold text-slate-50 tracking-tight mb-2"
        >
          Painel de Tarefas CEEM CVEL
        </h1>

        <p id="auth-subtitle" className="text-slate-400 text-sm mb-8 leading-relaxed">
          Gerenciamento e controle de atividades operacionais sincronizado em tempo real com a sua planilha do Google Sheets.
        </p>

        {error && (
          <div
            id="auth-error-box"
            className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left"
          >
            {error}
          </div>
        )}

        {/* Google Sign-in Official Styled Button */}
        <div id="auth-button-wrapper" className="flex justify-center mb-6">
          <button
            id="google-signin-btn"
            onClick={onLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-medium py-3 px-6 rounded-xl border border-slate-300 shadow-md transition-all duration-150 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
            ) : (
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="w-5 h-5 block"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                ></path>
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                ></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            )}
            <span className="text-sm font-semibold">Entrar com o Google</span>
          </button>
        </div>

        {/* Feature Highlights */}
        <div
          id="auth-features-list"
          className="pt-6 border-t border-slate-700/60 grid grid-cols-2 gap-3 text-left"
        >
          <div className="flex items-start gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-xs text-slate-300">
              Conexão direta com Google Sheets
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span className="text-xs text-slate-300">
              Acesso seguro às suas planilhas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
