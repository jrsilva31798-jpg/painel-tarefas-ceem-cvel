export interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
}

export interface SheetTab {
  sheetId: number;
  title: string;
  rowCount?: number;
  columnCount?: number;
}

export interface SpreadsheetInfo {
  id: string;
  name: string;
  sheets: SheetTab[];
  webViewLink?: string;
}

export interface ColumnMapping {
  title: string;
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
  notes: string;
  sector: string;
  allHeaders: string[];
}

export interface TaskItem {
  rowNumber: number; // 2-indexed, matching Google Sheets row numbers
  id: string;
  title: string;
  description: string;
  status: string; // e.g., 'Pendente', 'Em Andamento', 'Concluído', 'Aguardando', 'Cancelado'
  priority: string; // 'Urgente', 'Alta', 'Média', 'Baixa'
  assignee: string; // Nome legível do responsável
  assigneeId?: string; // Chave gravada na planilha
  dueDate: string; // Prazo / Data
  notes: string; // Observações / Detalhes
  sector: string; // Setor / Veículo / Linha
  rawValues: Record<string, string>;
}

export interface ResponsiblePerson {
  id: string;
  name: string;
  email?: string;
  sourceSheet: string;
}

export type TaskStatusCategory = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Outro';
export type TaskPriorityCategory = 'Urgente' | 'Alta' | 'Média' | 'Baixa' | 'Normal';
