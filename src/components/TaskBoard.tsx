import React from 'react';
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  Calendar,
  User,
  Truck,
  Edit2,
  ArrowRight,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { TaskItem } from '../types/sheets';

interface TaskBoardProps {
  tasks: TaskItem[];
  onEditTask: (task: TaskItem) => void;
  onUpdateStatus: (task: TaskItem, newStatus: string) => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onEditTask,
  onUpdateStatus,
}) => {
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

  const pendingTasks = tasks.filter((t) => isPending(t.status));
  const inProgressTasks = tasks.filter((t) => isInProgress(t.status));
  const doneTasks = tasks.filter((t) => isDone(t.status));
  const otherTasks = tasks.filter(
    (t) => !isPending(t.status) && !isInProgress(t.status) && !isDone(t.status)
  );

  const getPriorityBadge = (priority: string) => {
    const p = normalize(priority);
    if (p.includes('urgente') || p.includes('critica')) {
      return (
        <span className="bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          Urgente
        </span>
      );
    }
    if (p.includes('alta')) {
      return (
        <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          Alta
        </span>
      );
    }
    if (p.includes('baixa')) {
      return (
        <span className="bg-slate-700 text-slate-300 border border-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          Baixa
        </span>
      );
    }
    return (
      <span className="bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
        Média
      </span>
    );
  };

  const renderCard = (task: TaskItem) => {
    const pending = isPending(task.status);
    const inProgress = isInProgress(task.status);
    const done = isDone(task.status);

    return (
      <div
        key={task.id}
        id={`task-card-${task.rowNumber}`}
        className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between group"
      >
        <div>
          {/* Header row: Priority & Row number in sheets */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {getPriorityBadge(task.priority)}
            <span
              className="text-[10px] text-slate-500 font-mono"
              title={`Linha ${task.rowNumber} na planilha Google Sheets`}
            >
              Linha {task.rowNumber}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-slate-100 mb-2 line-clamp-2">
            {task.title}
          </h4>

          {/* Details */}
          <div className="space-y-1.5 text-xs text-slate-400 mb-3">
            {task.assignee && (
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{task.assignee}</span>
              </div>
            )}

            {task.sector && (
              <div className="flex items-center gap-1.5 truncate text-amber-400/90">
                <Truck className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span className="truncate">{task.sector}</span>
              </div>
            )}

            {task.dueDate && (
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{task.dueDate}</span>
              </div>
            )}

            {task.notes && task.notes !== task.title && (
              <p className="text-[11px] text-slate-400/80 bg-slate-950/40 p-2 rounded border border-slate-800/60 line-clamp-2 mt-1">
                {task.notes}
              </p>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <button
            onClick={() => onEditTask(task)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="Editar dados da tarefa no Google Sheets"
          >
            <Edit2 className="w-3 h-3" />
            <span>Editar</span>
          </button>

          {/* Quick status transition button */}
          {pending && (
            <button
              onClick={() => onUpdateStatus(task, 'Em Andamento')}
              className="bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Mudar status para Em Andamento no Google Sheets"
            >
              <span>Iniciar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {inProgress && (
            <button
              onClick={() => onUpdateStatus(task, 'Concluído')}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Mudar status para Concluído no Google Sheets"
            >
              <span>Concluir</span>
              <CheckCircle2 className="w-3 h-3" />
            </button>
          )}

          {done && (
            <button
              onClick={() => onUpdateStatus(task, 'Em Andamento')}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Reabrir tarefa no Google Sheets"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reabrir</span>
            </button>
          )}

          {!pending && !inProgress && !done && (
            <button
              onClick={() => onUpdateStatus(task, 'Concluído')}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Concluir</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      id="kanban-board-container"
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {/* Column 1: Pendentes */}
      <div
        id="kanban-col-pending"
        className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">Pendentes</h3>
          </div>
          <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold px-2 py-0.5 rounded-full">
            {pendingTasks.length}
          </span>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[650px] pr-1">
          {pendingTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhuma tarefa pendente
            </div>
          ) : (
            pendingTasks.map(renderCard)
          )}
        </div>
      </div>

      {/* Column 2: Em Andamento */}
      <div
        id="kanban-col-progress"
        className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-200">Em Execução</h3>
          </div>
          <span className="bg-sky-500/15 text-sky-400 border border-sky-500/30 text-xs font-semibold px-2 py-0.5 rounded-full">
            {inProgressTasks.length}
          </span>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[650px] pr-1">
          {inProgressTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhuma tarefa em andamento
            </div>
          ) : (
            inProgressTasks.map(renderCard)
          )}
        </div>
      </div>

      {/* Column 3: Concluídas */}
      <div
        id="kanban-col-done"
        className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">Concluídas</h3>
          </div>
          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2 py-0.5 rounded-full">
            {doneTasks.length}
          </span>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[650px] pr-1">
          {doneTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhuma tarefa concluída ainda
            </div>
          ) : (
            doneTasks.map(renderCard)
          )}
        </div>
      </div>

      {/* Optional 4th Column for other statuses if any */}
      {otherTasks.length > 0 && (
        <div
          id="kanban-col-other"
          className="col-span-1 md:col-span-3 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 mt-2"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-200">
                Outros Status na Planilha
              </h3>
            </div>
            <span className="bg-slate-800 text-slate-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              {otherTasks.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {otherTasks.map(renderCard)}
          </div>
        </div>
      )}
    </div>
  );
};
