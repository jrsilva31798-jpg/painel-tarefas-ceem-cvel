import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  Kanban,
  Table,
  Plus,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  BarChart3,
  ListTodo,
  Wallet,
  ArrowLeft,
} from 'lucide-react';

import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './lib/firebase';
import {
  SpreadsheetInfo,
  TaskItem,
  ColumnMapping,
  ResponsiblePerson,
} from './types/sheets';
import {
  getSpreadsheetMetadata,
  fetchSheetRows,
  appendTaskRow,
  updateTaskRow,
  updateSingleCell,
  clearRowValues,
  createDefaultTemplateSheet,
  fetchResponsibleDirectory,
  resolveTaskAssignees,
} from './services/googleSheets';

import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { SpreadsheetSelector } from './components/SpreadsheetSelector';
import { MetricsOverview } from './components/MetricsOverview';
import { TaskBoard } from './components/TaskBoard';
import { TaskTable } from './components/TaskTable';
import { TaskModal } from './components/TaskModal';
import { ColumnMapperModal } from './components/ColumnMapperModal';

const STORAGE_KEY_SPREADSHEET_ID = 'ceem_cvel_spreadsheet_id';
const STORAGE_KEY_SHEET_TITLE = 'ceem_cvel_sheet_title';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Spreadsheet Selection state
  const [selectedSpreadsheet, setSelectedSpreadsheet] =
    useState<SpreadsheetInfo | null>(null);
  const [activeSheetTitle, setActiveSheetTitle] = useState<string | null>(null);
  const [isChangingSpreadsheet, setIsChangingSpreadsheet] = useState(false);

  // Sheet Data state
  const [headers, setHeaders] = useState<string[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [responsibles, setResponsibles] = useState<ResponsiblePerson[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    title: '',
    status: '',
    priority: '',
    assignee: '',
    dueDate: '',
    notes: '',
    sector: '',
    allHeaders: [],
  });

  // UI state
  const [activeView, setActiveView] = useState<'kanban' | 'table'>('kanban');
  const [activeModule, setActiveModule] = useState<'home' | 'indicators' | 'tasks' | 'finance'>('home');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [isColumnMapperOpen, setIsColumnMapperOpen] = useState(false);

  // Show temporary toast feedback
  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // 1. Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Load saved spreadsheet if exists on sign-in
  useEffect(() => {
    if (!accessToken) return;

    const savedSheetId = localStorage.getItem(STORAGE_KEY_SPREADSHEET_ID);
    const savedSheetTitle = localStorage.getItem(STORAGE_KEY_SHEET_TITLE);

    if (savedSheetId && savedSheetTitle && !selectedSpreadsheet) {
      getSpreadsheetMetadata(accessToken, savedSheetId)
        .then((info) => {
          setSelectedSpreadsheet(info);
          setActiveSheetTitle(savedSheetTitle);
        })
        .catch((err) => {
          console.warn('Não foi possível restaurar planilha salva:', err);
          localStorage.removeItem(STORAGE_KEY_SPREADSHEET_ID);
          localStorage.removeItem(STORAGE_KEY_SHEET_TITLE);
        });
    }
  }, [accessToken, selectedSpreadsheet]);

  // 3. Fetch Tasks from active sheet
  const loadSheetData = useCallback(async () => {
    if (!accessToken || !selectedSpreadsheet || !activeSheetTitle) return;

    setIsLoadingData(true);
    setSyncError(null);
    try {
      const [data, directory] = await Promise.all([
        fetchSheetRows(accessToken, selectedSpreadsheet.id, activeSheetTitle),
        fetchResponsibleDirectory(
          accessToken,
          selectedSpreadsheet.id,
          activeSheetTitle
        ).catch((error) => {
          console.warn('Não foi possível carregar a lista de responsáveis:', error);
          return [] as ResponsiblePerson[];
        }),
      ]);
      setHeaders(data.headers);
      setResponsibles(directory);
      setTasks(resolveTaskAssignees(data.tasks, directory));
      setColumnMapping(data.mapping);
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error('Erro ao buscar dados da planilha:', err);
      setSyncError(err?.message || 'Falha ao sincronizar dados com o Google Sheets.');
    } finally {
      setIsLoadingData(false);
    }
  }, [accessToken, selectedSpreadsheet, activeSheetTitle]);

  useEffect(() => {
    if (selectedSpreadsheet && activeSheetTitle && accessToken) {
      loadSheetData();
    }
  }, [selectedSpreadsheet, activeSheetTitle, accessToken, loadSheetData]);

  // Auth Handlers
  const handleLogin = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: any) {
      console.error('Falha no login:', err);
      setAuthError(
        err?.message || 'Erro ao conectar com sua conta Google. Tente novamente.'
      );
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setSelectedSpreadsheet(null);
    setActiveSheetTitle(null);
    setTasks([]);
    setResponsibles([]);
    setActiveModule('home');
  };

  // Spreadsheet Selection Handler
  const handleSpreadsheetSelected = (
    info: SpreadsheetInfo,
    sheetTitle: string
  ) => {
    setSelectedSpreadsheet(info);
    setActiveSheetTitle(sheetTitle);
    setIsChangingSpreadsheet(false);
    setActiveModule('home');
    localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, info.id);
    localStorage.setItem(STORAGE_KEY_SHEET_TITLE, sheetTitle);
    showFeedback(`Planilha "${info.name}" vinculada com sucesso!`);
  };

  // Task Operations
  const handleSaveTask = async (taskData: {
    title: string;
    status: string;
    priority: string;
    assignee: string;
    dueDate: string;
    notes: string;
    sector: string;
    customFields?: Record<string, string>;
  }) => {
    const token = await getAccessToken();
    if (!token || !selectedSpreadsheet || !activeSheetTitle) {
      throw new Error('Sessão expirada ou planilha não selecionada.');
    }

    if (taskToEdit) {
      // Update existing row
      await updateTaskRow(
        token,
        selectedSpreadsheet.id,
        activeSheetTitle,
        taskToEdit.rowNumber,
        headers,
        columnMapping,
        {
          ...taskData,
          existingRaw: taskToEdit.rawValues,
        }
      );
      showFeedback('Tarefa atualizada no Google Sheets!');
    } else {
      // Append new row
      await appendTaskRow(
        token,
        selectedSpreadsheet.id,
        activeSheetTitle,
        headers,
        columnMapping,
        taskData
      );
      showFeedback('Nova tarefa registrada na planilha Google Sheets!');
    }

    await loadSheetData();
  };

  const handleQuickUpdateStatus = async (task: TaskItem, newStatus: string) => {
    const token = await getAccessToken();
    if (!token || !selectedSpreadsheet || !activeSheetTitle) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: newStatus } : t
      )
    );

    try {
      if (columnMapping.status && headers.includes(columnMapping.status)) {
        await updateSingleCell(
          token,
          selectedSpreadsheet.id,
          activeSheetTitle,
          task.rowNumber,
          columnMapping.status,
          headers,
          newStatus
        );
      } else {
        // Fallback to updating entire row if status column not specifically isolated
        await updateTaskRow(
          token,
          selectedSpreadsheet.id,
          activeSheetTitle,
          task.rowNumber,
          headers,
          columnMapping,
          {
            title: task.title,
            status: newStatus,
            priority: task.priority,
            assignee: task.assigneeId || task.assignee,
            dueDate: task.dueDate,
            notes: task.notes,
            sector: task.sector,
            existingRaw: task.rawValues,
          }
        );
      }
      showFeedback(`Status atualizado para "${newStatus}" no Sheets!`);
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      setSyncError('Falha ao salvar status na planilha. Recarregando...');
      await loadSheetData();
    }
  };

  const handleDeleteTask = async (task: TaskItem) => {
    const token = await getAccessToken();
    if (!token || !selectedSpreadsheet || !activeSheetTitle) return;

    const confirmClear = window.confirm(
      `Deseja realmente limpar a tarefa da linha ${task.rowNumber} (${task.title}) na planilha Google Sheets?`
    );
    if (!confirmClear) return;

    try {
      await clearRowValues(
        token,
        selectedSpreadsheet.id,
        activeSheetTitle,
        task.rowNumber,
        headers.length || 10
      );
      showFeedback(`Linha ${task.rowNumber} limpa na planilha.`);
      await loadSheetData();
    } catch (err: any) {
      console.error('Erro ao limpar tarefa:', err);
      setSyncError(err?.message || 'Falha ao limpar tarefa na planilha.');
    }
  };

  const handleInitializeTemplate = async () => {
    const token = await getAccessToken();
    if (!token || !selectedSpreadsheet || !activeSheetTitle) return;
    await createDefaultTemplateSheet(
      token,
      selectedSpreadsheet.id,
      activeSheetTitle
    );
    showFeedback('Cabeçalho padrão criado na planilha!');
    await loadSheetData();
  };

  // Filter tasks based on Metrics Overview selection
  const displayedTasks = tasks.filter((t) => {
    const normalize = (s: string) =>
      (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    if (statusFilter === 'TODOS') return true;

    const s = normalize(t.status);
    if (statusFilter === 'PENDENTE') {
      return (
        s.includes('pendente') ||
        s.includes('fazer') ||
        s.includes('aguardando') ||
        s.includes('nao iniciado')
      );
    }
    if (statusFilter === 'EM_ANDAMENTO') {
      return s.includes('andamento') || s.includes('execucao');
    }
    if (statusFilter === 'CONCLUIDO') {
      return s.includes('concluid') || s.includes('finalizad');
    }
    if (statusFilter === 'URGENTE') {
      const p = normalize(t.priority);
      return (
        (p.includes('urgente') || p.includes('alta')) &&
        !s.includes('concluid')
      );
    }
    return true;
  });

  // If not logged in
  if (!user || !accessToken) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        isLoading={isAuthLoading}
        error={authError}
      />
    );
  }

  // Critical requirement: "Antes de criar ou modificar qualquer coisa, permita que eu selecione a planilha do Google Sheets que será utilizada como fonte de dados."
  if (!selectedSpreadsheet || !activeSheetTitle || isChangingSpreadsheet) {
    return (
      <SpreadsheetSelector
        accessToken={accessToken}
        currentSpreadsheetId={selectedSpreadsheet?.id}
        currentSheetTitle={activeSheetTitle}
        onSelect={handleSpreadsheetSelected}
        onClose={
          selectedSpreadsheet
            ? () => setIsChangingSpreadsheet(false)
            : undefined
        }
        isModal={Boolean(selectedSpreadsheet && isChangingSpreadsheet)}
      />
    );
  }

  if (activeModule === 'home') {
    const modules = [
      {
        key: 'indicators' as const,
        title: 'Indicadores Executivos',
        subtitle: 'Resultados, responsáveis e próximos vencimentos',
        icon: BarChart3,
        color: 'from-blue-600 to-cyan-500',
      },
      {
        key: 'tasks' as const,
        title: 'Tarefas',
        subtitle: 'Quadro Kanban, tabela e gestão 5W2H',
        icon: ListTodo,
        color: 'from-indigo-600 to-blue-500',
      },
      {
        key: 'finance' as const,
        title: 'Financeiro por Setor',
        subtitle: 'Orçamentos, valores aprovados e efetividade',
        icon: Wallet,
        color: 'from-sky-600 to-blue-700',
      },
    ];

    return (
      <div className="min-h-screen bg-slate-950 text-white p-5 flex items-center justify-center">
        <main className="w-full max-w-5xl">
          <div className="grid gap-5 md:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.key}
                  onClick={() => setActiveModule(module.key)}
                  className={`group min-h-56 rounded-3xl bg-gradient-to-br ${module.color} p-7 text-left shadow-2xl border border-white/15 transition hover:-translate-y-1 hover:shadow-blue-950/60 focus:outline-none focus:ring-4 focus:ring-blue-300/40`}
                >
                  <Icon className="w-11 h-11 mb-10 text-white/95" />
                  <h2 className="text-2xl font-bold">{module.title}</h2>
                  <p className="mt-2 text-sm text-white/75 leading-relaxed">
                    {module.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      id="main-app-layout"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col"
    >
      {/* App Header */}
      <Header
        user={user}
        spreadsheet={selectedSpreadsheet}
        activeSheetTitle={activeSheetTitle}
        isSyncing={isLoadingData}
        lastSyncTime={lastSyncTime}
        onSync={loadSheetData}
        onOpenNewTask={() => {
          setTaskToEdit(null);
          setIsTaskModalOpen(true);
        }}
        onChangeSpreadsheet={() => setIsChangingSpreadsheet(true)}
        onOpenColumnMapper={() => setIsColumnMapperOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <button
          onClick={() => setActiveModule('home')}
          className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao menu principal
        </button>
        {/* Toast Feedback Notification */}
        {feedbackMessage && (
          <div
            id="toast-feedback"
            className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400/40 animate-fade-in"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Sync or API Error Alert */}
        {syncError && (
          <div
            id="sync-error-banner"
            className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{syncError}</span>
            </div>
            <button
              onClick={loadSheetData}
              className="text-xs text-rose-300 hover:text-white underline cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {activeModule === 'indicators' && (
          <>
            <MetricsOverview
              tasks={tasks}
              currentStatusFilter={statusFilter}
              onFilterByStatus={(filter) => setStatusFilter(filter)}
            />
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-bold mb-4">Desempenho por responsável</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from(new Set(tasks.map((task) => task.assignee))).sort().map((name) => {
                  const assigned = tasks.filter((task) => task.assignee === name);
                  const completed = assigned.filter((task) => /conclu|finaliz/i.test(task.status)).length;
                  return (
                    <div key={name} className="rounded-xl bg-slate-950 border border-slate-800 p-4">
                      <p className="font-semibold text-slate-100">{name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {assigned.length} tarefa(s) • {completed} concluída(s)
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activeModule === 'tasks' && (
          <>

        {/* View Switcher & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
              Visualização:
            </span>
            <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
              <button
                id="view-kanban-btn"
                onClick={() => setActiveView('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === 'kanban'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Quadro Kanban</span>
              </button>

              <button
                id="view-table-btn"
                onClick={() => setActiveView('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === 'table'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Tabela Detalhada</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {statusFilter !== 'TODOS' && (
              <button
                onClick={() => setStatusFilter('TODOS')}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Filtro ativo: {statusFilter} (Limpar)</span>
              </button>
            )}

            <button
              id="add-task-shortcut-btn"
              onClick={() => {
                setTaskToEdit(null);
                setIsTaskModalOpen(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Adicionar Tarefa</span>
            </button>
          </div>
        </div>

        {/* Active Content: Kanban or Table */}
        {isLoadingData && tasks.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <span>Carregando tarefas da planilha Google Sheets...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1">
              Nenhuma tarefa encontrada na aba "{activeSheetTitle}"
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
              Comece adicionando a primeira tarefa da equipe CEEM CVEL ou inicialize os cabeçalhos padrão na planilha.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeira Tarefa</span>
              </button>
              {headers.length === 0 && (
                <button
                  onClick={handleInitializeTemplate}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Inicializar Cabeçalhos Padrão
                </button>
              )}
            </div>
          </div>
        ) : activeView === 'kanban' ? (
          <TaskBoard
            tasks={displayedTasks}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onUpdateStatus={handleQuickUpdateStatus}
          />
        ) : (
          <TaskTable
            tasks={displayedTasks}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleQuickUpdateStatus}
          />
        )}
          </>
        )}

        {activeModule === 'finance' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3 mb-5">
              <Wallet className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-xl font-bold">Financeiro por Setor</h2>
                <p className="text-sm text-slate-400">
                  Valores lidos diretamente dos campos financeiros da planilha selecionada.
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {['Administrativo', 'Manutenção', 'Operacional'].map((sector) => {
                const sectorTasks = tasks.filter((task) =>
                  task.sector.toLowerCase().includes(sector.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ||
                  task.sector.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(
                    sector.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
                  )
                );
                return (
                  <div key={sector} className="rounded-xl bg-slate-950 border border-slate-800 p-5">
                    <p className="text-sm text-slate-400">{sector}</p>
                    <p className="text-2xl font-bold mt-2">{sectorTasks.length}</p>
                    <p className="text-xs text-slate-500">tarefas vinculadas</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Task Modal (Create / Edit) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        mapping={columnMapping}
        headers={headers}
        responsibles={responsibles}
      />

      {/* Column Mapper Modal */}
      <ColumnMapperModal
        isOpen={isColumnMapperOpen}
        onClose={() => setIsColumnMapperOpen(false)}
        headers={headers}
        mapping={columnMapping}
        onSaveMapping={(newMapping) => {
          setColumnMapping(newMapping);
          showFeedback('Mapeamento de colunas atualizado!');
          loadSheetData();
        }}
        onInitializeTemplate={handleInitializeTemplate}
        isSheetEmpty={headers.length === 0}
      />
    </div>
  );
}
