import React, { useState } from 'react';
import { X, Check, SlidersHorizontal, Info, Sparkles } from 'lucide-react';
import { ColumnMapping } from '../types/sheets';

interface ColumnMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  headers: string[];
  mapping: ColumnMapping;
  onSaveMapping: (newMapping: ColumnMapping) => void;
  onInitializeTemplate?: () => Promise<void>;
  isSheetEmpty?: boolean;
}

export const ColumnMapperModal: React.FC<ColumnMapperModalProps> = ({
  isOpen,
  onClose,
  headers,
  mapping,
  onSaveMapping,
  onInitializeTemplate,
  isSheetEmpty,
}) => {
  const [currentMap, setCurrentMap] = useState<ColumnMapping>({ ...mapping });
  const [isInitializing, setIsInitializing] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveMapping(currentMap);
    onClose();
  };

  const handleTemplateInit = async () => {
    if (!onInitializeTemplate) return;
    setIsInitializing(true);
    try {
      await onInitializeTemplate();
      onClose();
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div
      id="column-mapper-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="column-mapper-dialog"
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Mapeamento de Colunas
              </h3>
              <p className="text-xs text-slate-400">
                Associe as colunas da sua planilha aos campos do Painel CEEM CVEL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {isSheetEmpty && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 font-semibold">
                <Info className="w-4 h-4 text-amber-400" />
                <span>Esta aba da planilha parece estar sem cabeçalho.</span>
              </div>
              <p className="text-amber-300/80">
                Você pode inicializar os cabeçalhos padrão do Painel CEEM CVEL (Tarefa, Status, Prioridade, Responsável, Prazo, Setor, Observações).
              </p>
              {onInitializeTemplate && (
                <button
                  type="button"
                  onClick={handleTemplateInit}
                  disabled={isInitializing}
                  className="mt-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs self-start flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isInitializing ? 'Criando cabeçalho...' : 'Criar Cabeçalho Padrão'}</span>
                </button>
              )}
            </div>
          )}

          <div className="space-y-3">
            {[
              { key: 'title', label: 'Coluna de Título / Tarefa *' },
              { key: 'status', label: 'Coluna de Status / Situação' },
              { key: 'priority', label: 'Coluna de Prioridade' },
              { key: 'assignee', label: 'Coluna de Responsável / Operador' },
              { key: 'dueDate', label: 'Coluna de Prazo / Data' },
              { key: 'sector', label: 'Coluna de Setor / Veículo / Prefixo' },
              { key: 'notes', label: 'Coluna de Observações' },
            ].map(({ key, label }) => {
              const currentVal = (currentMap as any)[key] || '';
              return (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                  <label className="text-xs font-medium text-slate-300 sm:w-1/2">
                    {label}:
                  </label>
                  <select
                    value={currentVal}
                    onChange={(e) =>
                      setCurrentMap({
                        ...currentMap,
                        [key]: e.target.value,
                      })
                    }
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer sm:w-1/2"
                  >
                    <option value="">(Nenhuma)</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              O painel detecta automaticamente colunas com nomes usuais. Você pode alterar a qualquer momento se a sua planilha usar nomes diferentes.
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Mapeamento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
