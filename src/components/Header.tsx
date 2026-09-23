import React from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Plus,
  ExternalLink,
  SlidersHorizontal,
  LogOut,
  Layers,
  FolderSync,
} from 'lucide-react';
import { SpreadsheetInfo } from '../types/sheets';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  spreadsheet: SpreadsheetInfo;
  activeSheetTitle: string;
  isSyncing: boolean;
  lastSyncTime?: Date | null;
  onSync: () => void;
  onOpenNewTask: () => void;
  onChangeSpreadsheet: () => void;
  onOpenColumnMapper: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  spreadsheet,
  activeSheetTitle,
  isSyncing,
  lastSyncTime,
  onSync,
  onOpenNewTask,
  onChangeSpreadsheet,
  onOpenColumnMapper,
  onLogout,
}) => {
  return (
    <header
      id="app-header"
      className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Spreadsheet Context */}
        <div className="flex items-center gap-3.5">
          <div
            id="brand-logo-container"
            className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner"
          >
            <Layers className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1
                id="app-main-title"
                className="text-base sm:text-lg font-bold text-slate-100 tracking-tight"
              >
                Painel de Tarefas CEEM CVEL
              </h1>
              <span
                id="ceem-badge"
                className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full"
              >
                Operacional
              </span>
            </div>

            {/* Active Connected Spreadsheet Pill */}
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-medium text-emerald-400 truncate max-w-xs sm:max-w-md">
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{spreadsheet.name}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[11px] font-mono">
                {activeSheetTitle}
              </span>
              <a
                id="open-in-sheets-link"
                href={spreadsheet.webViewLink}
                target="_blank"
                rel="noreferrer"
                title="Abrir no Google Sheets"
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Actions & User Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Change Spreadsheet button */}
          <button
            id="change-sheet-btn"
            onClick={onChangeSpreadsheet}
            className="bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Trocar a planilha ou aba selecionada"
          >
            <FolderSync className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Trocar Planilha</span>
            <span className="sm:hidden">Trocar</span>
          </button>

          {/* Column Mapping Config */}
          <button
            id="column-mapper-btn"
            onClick={onOpenColumnMapper}
            className="bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80 p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ajustar mapeamento de colunas da planilha"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Mapeamento</span>
          </button>

          {/* Refresh / Sync Button */}
          <button
            id="sync-sheet-btn"
            onClick={onSync}
            disabled={isSyncing}
            className="bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title={
              lastSyncTime
                ? `Última sincronização: ${lastSyncTime.toLocaleTimeString()}`
                : 'Sincronizar dados com o Google Sheets'
            }
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-emerald-400 ${
                isSyncing ? 'animate-spin' : ''
              }`}
            />
            <span className="hidden sm:inline">
              {isSyncing ? 'Sincronizando...' : 'Atualizar'}
            </span>
          </button>

          {/* New Task Button */}
          <button
            id="new-task-btn"
            onClick={onOpenNewTask}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>

          {/* User profile & Logout */}
          <div className="flex items-center pl-2 border-l border-slate-800 gap-2">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Usuário'}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full border border-slate-700"
                title={user.email || ''}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300"
                title={user?.email || ''}
              >
                {user?.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
              </div>
            )}

            <button
              id="logout-btn"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
              title="Desconectar conta Google"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
