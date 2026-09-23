import React, { useState } from 'react';
import {
  Search,
  ArrowUpDown,
  Edit2,
  Trash2,
  Calendar,
  User,
  Truck,
  Filter,
} from 'lucide-react';
import { TaskItem } from '../types/sheets';

interface TaskTableProps {
  tasks: TaskItem[];
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (task: TaskItem) => void;
  onUpdateStatus: (task: TaskItem, newStatus: string) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'title' | 'priority' | 'status' | 'rowNumber'>('rowNumber');
  const [sortAsc, setSortAsc] = useState(true);

  const normalize = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Search
    const q = normalize(searchTerm);
    if (q) {
      const matchTitle = normalize(t.title).includes(q);
      const matchAssignee = normalize(t.assignee).includes(q);
      const matchSector = normalize(t.sector).includes(q);
      const matchNotes = normalize(t.notes).includes(q);
      const matchStatus = normalize(t.status).includes(q);
      if (!matchTitle && !matchAssignee && !matchSector && !matchNotes && !matchStatus) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      const normStatus = normalize(t.status);
      if (statusFilter === 'PENDENTE') {
        if (!normStatus.includes('pendente') && !normStatus.includes('fazer') && !normStatus.includes('aguardando')) {
          return false;
        }
      } else if (statusFilter === 'ANDAMENTO') {
        if (!normStatus.includes('andamento') && !normStatus.includes('execucao')) {
          return false;
        }
      } else if (statusFilter === 'CONCLUIDO') {
        if (!normStatus.includes('concluid') && !normStatus.includes('finalizad')) {
          return false;
        }
      }
    }

    // Priority filter
    if (priorityFilter !== 'ALL') {
      const normPri = normalize(t.priority);
      if (priorityFilter === 'URGENTE' && !normPri.includes('urgente') && !normPri.includes('alta')) {
        return false;
      }
      if (priorityFilter === 'MEDIA' && !normPri.includes('media')) {
        return false;
      }
      if (priorityFilter === 'BAIXA' && !normPri.includes('baixa')) {
        return false;
      }
    }

    return true;
  });

  // Sort
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'title') {
      cmp = a.title.localeCompare(b.title);
    } else if (sortField === 'status') {
      cmp = a.status.localeCompare(b.status);
    } else if (sortField === 'priority') {
      cmp = a.priority.localeCompare(b.priority);
    } else {
      cmp = a.rowNumber - b.rowNumber;
    }
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

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

  return (
    <div
      id="task-table-container"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col"
    >
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="table-search-input"
            type="text"
            placeholder="Buscar por tarefa, responsável, setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            id="table-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDO">Concluídos</option>
          </select>

          <select
            id="table-priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Todas as Prioridades</option>
            <option value="URGENTE">Alta / Urgente</option>
            <option value="MEDIA">Média</option>
            <option value="BAIXA">Baixa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table id="tasks-data-table" className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th
                onClick={() => toggleSort('rowNumber')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 w-16"
              >
                <div className="flex items-center gap-1">
                  <span>Linha</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              <th
                onClick={() => toggleSort('title')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 min-w-[200px]"
              >
                <div className="flex items-center gap-1">
                  <span>Tarefa / Descrição</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              <th
                onClick={() => toggleSort('status')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 w-36"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              <th
                onClick={() => toggleSort('priority')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 w-28"
              >
                <div className="flex items-center gap-1">
                  <span>Prioridade</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              <th className="py-3 px-4 w-36">Responsável</th>
              <th className="py-3 px-4 w-32">Setor / Prefixo</th>
              <th className="py-3 px-4 w-28">Prazo</th>
              <th className="py-3 px-4 text-right w-24">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  Nenhuma tarefa encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => (
                <tr
                  key={task.id}
                  id={`table-row-${task.rowNumber}`}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-3 px-4 font-mono text-slate-500">
                    #{task.rowNumber}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-100 line-clamp-1">
                      {task.title}
                    </p>
                    {task.notes && task.notes !== task.title && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {task.notes}
                      </p>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={task.status}
                      onChange={(e) => onUpdateStatus(task, e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded-md px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer w-full"
                    >
                      <option value={task.status}>{task.status}</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Concluído">Concluído</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </td>

                  <td className="py-3 px-4">
                    {getPriorityBadge(task.priority)}
                  </td>

                  <td className="py-3 px-4 text-slate-300">
                    {task.assignee ? (
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{task.assignee}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-300">
                    {task.sector ? (
                      <div className="flex items-center gap-1.5 text-amber-400/90 truncate">
                        <Truck className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{task.sector}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-300">
                    {task.dueDate ? (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{task.dueDate}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEditTask(task)}
                        className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Editar tarefa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        title="Limpar tarefa da planilha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/40 text-slate-500 text-xs flex items-center justify-between">
        <span>
          Mostrando {sortedTasks.length} de {tasks.length} tarefas
        </span>
        <span className="text-[11px] font-mono">Sincronizado com Google Sheets</span>
      </div>
    </div>
  );
};
