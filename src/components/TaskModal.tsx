import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, FileText, AlertCircle } from 'lucide-react';
import { TaskItem, ColumnMapping, ResponsiblePerson } from '../types/sheets';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    status: string;
    priority: string;
    assignee: string;
    dueDate: string;
    notes: string;
    sector: string;
    customFields?: Record<string, string>;
  }) => Promise<void>;
  taskToEdit?: TaskItem | null;
  mapping: ColumnMapping;
  headers: string[];
  responsibles: ResponsiblePerson[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  mapping,
  headers,
  responsibles,
}) => {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('Pendente');
  const [priority, setPriority] = useState('Média');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [sector, setSector] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setStatus(taskToEdit.status || 'Pendente');
      setPriority(taskToEdit.priority || 'Média');
      setAssignee(taskToEdit.assigneeId || taskToEdit.assignee || '');
      setDueDate(taskToEdit.dueDate || '');
      setNotes(taskToEdit.notes || '');
      setSector(taskToEdit.sector || '');

      // Identify extra custom fields not in primary mapping
      const mappedHeaders = [
        mapping.title,
        mapping.status,
        mapping.priority,
        mapping.assignee,
        mapping.dueDate,
        mapping.notes,
        mapping.sector,
      ].filter(Boolean);

      const extras: Record<string, string> = {};
      headers.forEach((h) => {
        if (!mappedHeaders.includes(h) && taskToEdit.rawValues[h] !== undefined) {
          extras[h] = taskToEdit.rawValues[h];
        }
      });
      setCustomFields(extras);
    } else {
      setTitle('');
      setStatus('Pendente');
      setPriority('Média');
      setAssignee('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setSector('');
      setCustomFields({});
    }
    setError(null);
  }, [taskToEdit, isOpen, mapping, headers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título da tarefa é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        status,
        priority,
        assignee: assignee.trim(),
        dueDate,
        notes: notes.trim(),
        sector: sector.trim(),
        customFields,
      });
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar tarefa:', err);
      setError(err?.message || 'Falha ao salvar a tarefa no Google Sheets.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find extra sheet columns that aren't mapped to standard fields
  const standardMappedHeaders = [
    mapping.title,
    mapping.status,
    mapping.priority,
    mapping.assignee,
    mapping.dueDate,
    mapping.notes,
    mapping.sector,
  ].filter(Boolean);
  const extraColumns = headers.filter((h) => !standardMappedHeaders.includes(h));

  return (
    <div
      id="task-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="task-modal-dialog"
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              {taskToEdit ? (
                <FileText className="w-4 h-4" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-base font-bold text-slate-100">
              {taskToEdit ? `Editar Tarefa (Linha ${taskToEdit.rowNumber})` : 'Nova Tarefa no CEEM CVEL'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Título da Tarefa / Atividade *
            </label>
            <input
              id="task-title-input"
              type="text"
              required
              placeholder="Ex.: Revisão preventiva, Manutenção veículo, Relatório..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Grid: Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Status
              </label>
              <select
                id="task-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Pendente">Pendente</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
                <option value="Aguardando Peça">Aguardando Peça</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Prioridade
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Grid: Assignee & Sector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Responsável / Operador
              </label>
              <select
                id="task-assignee-input"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Não atribuído</option>
                {responsibles.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
                {taskToEdit?.assigneeId &&
                  !responsibles.some((person) => person.id === taskToEdit.assigneeId) && (
                    <option value={taskToEdit.assigneeId}>Responsável não identificado</option>
                  )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Setor / Veículo / Prefixo
              </label>
              <input
                id="task-sector-input"
                type="text"
                placeholder="Ex.: Carro 5100, Oficina..."
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Prazo / Data Limite
            </label>
            <input
              id="task-date-input"
              type="text"
              placeholder="AAAA-MM-DD ou DD/MM/AAAA"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observações / Detalhes Adicionais
            </label>
            <textarea
              id="task-notes-input"
              rows={3}
              placeholder="Descreva observações técnicas ou instruções operacionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Extra spreadsheet columns if any exist */}
          {extraColumns.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Campos adicionais da planilha:
              </span>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {extraColumns.map((col) => (
                  <div key={col} className="flex items-center gap-2">
                    <label className="text-xs text-slate-400 w-1/3 truncate" title={col}>
                      {col}:
                    </label>
                    <input
                      type="text"
                      value={customFields[col] || ''}
                      onChange={(e) =>
                        setCustomFields({
                          ...customFields,
                          [col]: e.target.value,
                        })
                      }
                      className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar no Sheets'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
