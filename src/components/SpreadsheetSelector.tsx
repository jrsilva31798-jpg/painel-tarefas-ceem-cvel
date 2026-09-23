import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  RefreshCw,
  Link as LinkIcon,
  CheckCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  X,
  Clock,
} from 'lucide-react';
import { DriveFile, SpreadsheetInfo, SheetTab } from '../types/sheets';
import { listSpreadsheets, extractSpreadsheetId } from '../services/googleDrive';
import { getSpreadsheetMetadata } from '../services/googleSheets';

interface SpreadsheetSelectorProps {
  accessToken: string;
  currentSpreadsheetId?: string | null;
  currentSheetTitle?: string | null;
  onSelect: (info: SpreadsheetInfo, selectedSheetTitle: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const SpreadsheetSelector: React.FC<SpreadsheetSelectorProps> = ({
  accessToken,
  currentSpreadsheetId,
  currentSheetTitle,
  onSelect,
  onClose,
  isModal = false,
}) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Selected spreadsheet and tab preview
  const [inspectingSpreadsheet, setInspectingSpreadsheet] =
    useState<SpreadsheetInfo | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  const fetchFiles = async (query?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const driveFiles = await listSpreadsheets(accessToken, query);
      setFiles(driveFiles);
    } catch (err: any) {
      console.error('Erro ao listar planilhas:', err);
      setError(err?.message || 'Falha ao carregar planilhas do Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [accessToken]);

  const handleInspectSpreadsheet = async (sheetId: string) => {
    setIsLoadingMetadata(true);
    setError(null);
    try {
      const metadata = await getSpreadsheetMetadata(accessToken, sheetId);
      setInspectingSpreadsheet(metadata);
      if (metadata.sheets.length > 0) {
        // Prefer tab matching currentSheetTitle, or "Tarefas", or first tab
        const matchingCurrent = metadata.sheets.find(
          (s) => s.title === currentSheetTitle
        );
        const matchingTarefas = metadata.sheets.find((s) =>
          /tarefa|ceem|operacional|atividade/i.test(s.title)
        );
        const initialTab =
          matchingCurrent?.title ||
          matchingTarefas?.title ||
          metadata.sheets[0].title;
        setSelectedTab(initialTab);
      }
    } catch (err: any) {
      console.error('Erro ao carregar detalhes da planilha:', err);
      setError(
        err?.message || 'Não foi possível ler as páginas desta planilha.'
      );
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractSpreadsheetId(manualInput);
    if (!id) {
      setError('Por favor, informe uma URL ou ID de planilha válido.');
      return;
    }
    handleInspectSpreadsheet(id);
  };

  const handleConfirmSelection = () => {
    if (inspectingSpreadsheet && selectedTab) {
      onSelect(inspectingSpreadsheet, selectedTab);
    }
  };

  const content = (
    <div
      id="spreadsheet-selector-wrapper"
      className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      {/* Header */}
      <div
        id="selector-header"
        className="px-6 py-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="selector-title"
              className="text-lg font-bold text-slate-100 flex items-center gap-2"
            >
              Selecionar Planilha Google Sheets
            </h2>
            <p className="text-xs text-slate-400">
              Escolha a planilha que contém os dados do Painel de Tarefas CEEM
              CVEL
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            id="selector-close-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div
          id="selector-error"
          className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs"
        >
          {error}
        </div>
      )}

      {/* Main Body with 2 columns on larger screens */}
      <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drive Search & List (col-7) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Planilhas em seu Google Drive
            </span>
            <button
              id="refresh-drive-files-btn"
              onClick={() => fetchFiles(searchQuery)}
              disabled={isLoading}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
              Atualizar lista
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-spreadsheets-input"
              type="text"
              placeholder="Buscar planilha por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchFiles(searchQuery);
              }}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Drive Files List */}
          <div
            id="drive-files-list"
            className="border border-slate-800 rounded-xl bg-slate-950/40 divide-y divide-slate-800/60 max-h-72 overflow-y-auto"
          >
            {isLoading && files.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Buscando planilhas no Google Drive...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nenhuma planilha encontrada no Google Drive.
                <p className="text-xs text-slate-500 mt-1">
                  Você pode colar o link direto da planilha no campo abaixo.
                </p>
              </div>
            ) : (
              files.map((file) => {
                const isSelected = inspectingSpreadsheet?.id === file.id;
                const isCurrent = currentSpreadsheetId === file.id;
                return (
                  <div
                    key={file.id}
                    id={`sheet-item-${file.id}`}
                    onClick={() => handleInspectSpreadsheet(file.id)}
                    className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/10 border-l-4 border-emerald-500'
                        : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-200 truncate">
                            {file.name}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] bg-slate-800 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                              Atual
                            </span>
                          )}
                        </div>
                        {file.modifiedTime && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            Modificado em{' '}
                            {new Date(file.modifiedTime).toLocaleDateString(
                              'pt-BR'
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Selecionada
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 hover:text-slate-200">
                          Escolher &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Paste Link or ID option */}
          <div className="pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Ou informe o link ou ID da planilha:
            </span>
            <form
              onSubmit={handleManualSubmit}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="manual-sheet-input"
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/... ou ID"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim() || isLoadingMetadata}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors shrink-0 disabled:opacity-50"
              >
                Carregar
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Spreadsheet Preview & Sheet Tab Selector (col-5) */}
        <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Configuração da Fonte de Dados
              </span>
            </div>

            {isLoadingMetadata ? (
              <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Carregando abas e estrutura da planilha...</span>
              </div>
            ) : inspectingSpreadsheet ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                    Planilha Selecionada
                  </span>
                  <p className="text-sm font-semibold text-slate-100 break-words">
                    {inspectingSpreadsheet.name}
                  </p>
                  <a
                    href={inspectingSpreadsheet.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline mt-1.5"
                  >
                    <span>Abrir no Google Sheets</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Tab selector */}
                <div>
                  <label
                    htmlFor="sheet-tab-selector"
                    className="block text-xs font-medium text-slate-300 mb-2"
                  >
                    Selecione a Página / Aba com as Tarefas:
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {inspectingSpreadsheet.sheets.map((sheet: SheetTab) => {
                      const isTabActive = selectedTab === sheet.title;
                      return (
                        <div
                          key={sheet.sheetId}
                          onClick={() => setSelectedTab(sheet.title)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                            isTabActive
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="font-medium">{sheet.title}</span>
                          {isTabActive && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs leading-relaxed">
                Selecione uma planilha da lista ao lado ou digite o link para visualizar as abas disponíveis e confirmar a fonte de dados do Painel CEEM CVEL.
              </div>
            )}
          </div>

          {/* Confirm button */}
          <div className="pt-6 border-t border-slate-800 mt-6">
            <button
              id="confirm-sheet-btn"
              onClick={handleConfirmSelection}
              disabled={!inspectingSpreadsheet || !selectedTab || isLoadingMetadata}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Usar esta Planilha no Painel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              Todas as tarefas lidas e criadas serão sincronizadas com esta aba.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        id="spreadsheet-modal-overlay"
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div className="w-full max-w-4xl">{content}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 py-10">
      <div className="w-full max-w-4xl">{content}</div>
    </div>
  );
};
