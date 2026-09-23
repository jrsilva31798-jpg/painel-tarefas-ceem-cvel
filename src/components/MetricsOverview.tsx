import React from 'react';
import {
  ListTodo,
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { TaskItem } from '../types/sheets';

interface MetricsOverviewProps {
  tasks: TaskItem[];
  currentStatusFilter: string;
  onFilterByStatus: (status: string) => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  tasks,
  currentStatusFilter,
  onFilterByStatus,
}) => {
  const total = tasks.length;

  const normalize = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const isPending = (status: string) => {
    const n = normalize(status);
    return (
      n.includes('pendente') ||
      n.includes('a fazer') ||
      n.includes('aberto') ||
      n.includes('aguardando') ||
      n.includes('nao iniciado')
    );
  };

  const isInProgress = (status: string) => {
    const n = normalize(status);
    return (
      n.includes('andamento') ||
      n.includes('execucao') ||
      n.includes('desenvolvimento') ||
      n.includes('analise')
    );
  };

  const isDone = (status: string) => {
    const n = normalize(status);
    return (
      n.includes('concluid') ||
      n.includes('finalizad') ||
      n.includes('resolvid') ||
      n.includes('pronto') ||
      n.includes('fechad')
    );
  };

  const pendingCount = tasks.filter((t) => isPending(t.status)).length;
  const inProgressCount = tasks.filter((t) => isInProgress(t.status)).length;
  const doneCount = tasks.filter((t) => isDone(t.status)).length;

  const urgentCount = tasks.filter((t) => {
    const p = normalize(t.priority);
    return (
      (p.includes('urgente') || p.includes('alta') || p.includes('critica')) &&
      !isDone(t.status)
    );
  }).length;

  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div
      id="metrics-overview-container"
      className="grid grid-cols-2 md:grid-cols-5 gap-3"
    >
      {/* Total Card */}
      <div
        id="metric-card-total"
        onClick={() => onFilterByStatus('TODOS')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          currentStatusFilter === 'TODOS'
            ? 'bg-slate-800 border-slate-600 ring-1 ring-slate-500'
            : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Tarefas
          </span>
          <ListTodo className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-100">{total}</span>
          <span className="text-xs text-slate-500">no painel</span>
        </div>
      </div>

      {/* Pendentes Card */}
      <div
        id="metric-card-pending"
        onClick={() => onFilterByStatus('PENDENTE')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          currentStatusFilter === 'PENDENTE'
            ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500'
            : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
            Pendentes
          </span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-amber-300">
            {pendingCount}
          </span>
          <span className="text-xs text-slate-500">aguardando</span>
        </div>
      </div>

      {/* Em Andamento Card */}
      <div
        id="metric-card-progress"
        onClick={() => onFilterByStatus('EM_ANDAMENTO')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          currentStatusFilter === 'EM_ANDAMENTO'
            ? 'bg-sky-950/40 border-sky-500/60 ring-1 ring-sky-500'
            : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
            Em Execução
          </span>
          <PlayCircle className="w-4 h-4 text-sky-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-sky-300">
            {inProgressCount}
          </span>
          <span className="text-xs text-slate-500">em ação</span>
        </div>
      </div>

      {/* Concluídas Card */}
      <div
        id="metric-card-done"
        onClick={() => onFilterByStatus('CONCLUIDO')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          currentStatusFilter === 'CONCLUIDO'
            ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500'
            : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Concluídas
          </span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-300">
            {doneCount}
          </span>
          <span className="text-xs text-emerald-500/80 font-medium">
            {completionRate}% taxa
          </span>
        </div>
      </div>

      {/* Urgentes / Atenção Card */}
      <div
        id="metric-card-urgent"
        onClick={() => onFilterByStatus('URGENTE')}
        className={`p-4 rounded-xl border col-span-2 md:col-span-1 transition-all cursor-pointer ${
          currentStatusFilter === 'URGENTE'
            ? 'bg-rose-950/40 border-rose-500/60 ring-1 ring-rose-500'
            : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
            Alta / Urgente
          </span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-rose-300">
            {urgentCount}
          </span>
          <span className="text-xs text-slate-500">prioritárias</span>
        </div>
      </div>
    </div>
  );
};
