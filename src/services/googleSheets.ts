import {
  SpreadsheetInfo,
  SheetTab,
  ColumnMapping,
  TaskItem,
  ResponsiblePerson,
} from '../types/sheets';

const normalizeHeader = (value: string) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const looksLikeInternalId = (value: string) => {
  const text = String(value || '').trim();
  return (
    /^[a-f0-9]{8,}$/i.test(text) ||
    /^[a-z0-9_-]{16,}$/i.test(text) ||
    /^resp\d+$/i.test(text) ||
    /^\d{6,}$/.test(text)
  );
};

function columnIndexToLetter(index: number): string {
  let letter = '';
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export async function getSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetInfo> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message ||
        `Não foi possível carregar a planilha (${response.status})`
    );
  }

  const data = await response.json();
  const sheets: SheetTab[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId ?? 0,
    title: s.properties?.title || 'Página 1',
    rowCount: s.properties?.gridProperties?.rowCount,
    columnCount: s.properties?.gridProperties?.columnCount,
  }));

  return {
    id: data.spreadsheetId,
    name: data.properties?.title || 'Planilha sem título',
    sheets,
    webViewLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

export async function fetchResponsibleDirectory(
  accessToken: string,
  spreadsheetId: string,
  activeTaskSheet?: string
): Promise<ResponsiblePerson[]> {
  const metadata = await getSpreadsheetMetadata(accessToken, spreadsheetId);
  const candidates = metadata.sheets
    .filter((sheet) => sheet.title !== activeTaskSheet)
    .filter((sheet) => {
      const name = normalizeHeader(sheet.title);
      return /respons|usuario|equipe|colaborador|pessoa/.test(name);
    });

  const people = new Map<string, ResponsiblePerson>();

  for (const sheet of candidates) {
    const range = `'${sheet.title}'!A1:ZZ`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) continue;

    const data = await response.json();
    const rows: string[][] = data.values || [];
    if (rows.length < 2) continue;

    const headers = rows[0].map(normalizeHeader);
    const idIndex = headers.findIndex((header) =>
      [
        'id',
        'id_responsavel',
        'usuario_id',
        'responsavel_id',
        'user_id',
        'uid',
        'codigo',
      ].includes(header)
    );
    const nameIndex = headers.findIndex((header) =>
      ['nome', 'nome_completo', 'responsavel', 'usuario', 'colaborador'].includes(header)
    );
    const emailIndex = headers.findIndex((header) =>
      ['email', 'e_mail', 'correio'].includes(header)
    );
    if (nameIndex === -1) continue;

    rows.slice(1).forEach((row, index) => {
      const name = String(row[nameIndex] || '').trim();
      const id = String(idIndex >= 0 ? row[idIndex] || '' : '').trim() || name;
      if (!name || !id) return;
      people.set(id, {
        id,
        name,
        email: emailIndex >= 0 ? String(row[emailIndex] || '').trim() : undefined,
        sourceSheet: sheet.title,
      });
      // Compatibilidade com registros antigos que guardaram o nome.
      if (!people.has(name)) {
        people.set(name, { id, name, sourceSheet: sheet.title });
      }
    });
  }

  return Array.from(
    new Map(
      Array.from(people.values()).map((person) => [person.id, person])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function resolveTaskAssignees(
  tasks: TaskItem[],
  people: ResponsiblePerson[]
): TaskItem[] {
  const lookup = new Map<string, string>();
  people.forEach((person) => {
    lookup.set(person.id, person.name);
    lookup.set(person.name, person.name);
  });

  return tasks.map((task) => {
    const raw = String(task.assignee || '').trim();
    if (!raw) {
      return { ...task, assignee: 'Não atribuído', assigneeId: '' };
    }
    const resolved = lookup.get(raw);
    return {
      ...task,
      assigneeId: raw,
      assignee: resolved || (looksLikeInternalId(raw) ? 'Responsável não identificado' : raw),
    };
  });
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const mapping: ColumnMapping = {
    title: '',
    status: '',
    priority: '',
    assignee: '',
    dueDate: '',
    notes: '',
    sector: '',
    allHeaders: headers,
  };

  const normHeaders = headers.map(normalize);

  // Find Title / Task
  const titleIdx = normHeaders.findIndex(
    (h) =>
      h.includes('tarefa') ||
      h.includes('titulo') ||
      h.includes('atividade') ||
      h.includes('descricao') ||
      h.includes('assunto') ||
      h.includes('servico')
  );
  mapping.title = titleIdx !== -1 ? headers[titleIdx] : headers[0] || '';

  // Find Status
  const statusIdx = normHeaders.findIndex(
    (h) =>
      h.includes('status') ||
      h.includes('situacao') ||
      h.includes('estado') ||
      h.includes('fase') ||
      h.includes('etapa')
  );
  if (statusIdx !== -1) mapping.status = headers[statusIdx];

  // Find Priority
  const priorityIdx = normHeaders.findIndex(
    (h) =>
      h.includes('prioridade') ||
      h.includes('urgencia') ||
      h.includes('criticidade') ||
      h.includes('nivel')
  );
  if (priorityIdx !== -1) mapping.priority = headers[priorityIdx];

  // Find Assignee
  const assigneeIdx = normHeaders.findIndex(
    (h) =>
      h.includes('responsavel') ||
      h.includes('atribuido') ||
      h.includes('operador') ||
      h.includes('colaborador') ||
      h.includes('mecanico') ||
      h.includes('motorista') ||
      h.includes('quem')
  );
  if (assigneeIdx !== -1) mapping.assignee = headers[assigneeIdx];

  // Find Due Date / Date
  const dueDateIdx = normHeaders.findIndex(
    (h) =>
      h.includes('prazo') ||
      h.includes('limite') ||
      h.includes('vencimento') ||
      h.includes('previsao') ||
      h.includes('data')
  );
  if (dueDateIdx !== -1) mapping.dueDate = headers[dueDateIdx];

  // Find Notes / Observation
  const notesIdx = normHeaders.findIndex(
    (h) =>
      h.includes('obs') ||
      h.includes('observacao') ||
      h.includes('observacoes') ||
      h.includes('detalhe') ||
      h.includes('comentario')
  );
  if (notesIdx !== -1) mapping.notes = headers[notesIdx];

  // Find Sector / Vehicle / Linha (common in Eucatur CEEM CVEL)
  const sectorIdx = normHeaders.findIndex(
    (h) =>
      h.includes('setor') ||
      h.includes('veiculo') ||
      h.includes('prefixo') ||
      h.includes('carro') ||
      h.includes('linha') ||
      h.includes('onibus') ||
      h.includes('local')
  );
  if (sectorIdx !== -1) mapping.sector = headers[sectorIdx];

  return mapping;
}

export async function fetchSheetRows(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string
): Promise<{ headers: string[]; tasks: TaskItem[]; mapping: ColumnMapping }> {
  const range = `'${sheetTitle}'!A1:ZZ`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message ||
        `Erro ao ler dados da página "${sheetTitle}" (${response.status})`
    );
  }

  const data = await response.json();
  const rawValues: string[][] = data.values || [];

  if (rawValues.length === 0) {
    return {
      headers: [],
      tasks: [],
      mapping: {
        title: '',
        status: '',
        priority: '',
        assignee: '',
        dueDate: '',
        notes: '',
        sector: '',
        allHeaders: [],
      },
    };
  }

  const headers = (rawValues[0] || []).map((h) => String(h || '').trim());
  const mapping = detectColumnMapping(headers);

  const tasks: TaskItem[] = [];
  for (let i = 1; i < rawValues.length; i++) {
    const row = rawValues[i] || [];
    // If row is completely empty, skip
    if (row.every((cell) => !cell || String(cell).trim() === '')) {
      continue;
    }

    const rowNumber = i + 1; // 1-based index in sheets (header is row 1)
    const rawMap: Record<string, string> = {};
    headers.forEach((h, colIdx) => {
      rawMap[h] = row[colIdx] !== undefined ? String(row[colIdx]).trim() : '';
    });

    const title = mapping.title ? rawMap[mapping.title] || '' : row[0] || `Tarefa #${rowNumber}`;
    const status = mapping.status ? rawMap[mapping.status] || 'Pendente' : 'Pendente';
    const priority = mapping.priority ? rawMap[mapping.priority] || 'Média' : 'Média';
    const assignee = mapping.assignee ? rawMap[mapping.assignee] || 'Não atribuído' : '';
    const dueDate = mapping.dueDate ? rawMap[mapping.dueDate] || '' : '';
    const notes = mapping.notes ? rawMap[mapping.notes] || '' : '';
    const sector = mapping.sector ? rawMap[mapping.sector] || '' : '';

    tasks.push({
      rowNumber,
      id: `task-row-${rowNumber}`,
      title,
      description: notes || title,
      status,
      priority,
      assignee,
      dueDate,
      notes,
      sector,
      rawValues: rawMap,
    });
  }

  return { headers, tasks, mapping };
}

export async function appendTaskRow(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  headers: string[],
  mapping: ColumnMapping,
  taskData: {
    title: string;
    status: string;
    priority: string;
    assignee: string;
    dueDate: string;
    notes: string;
    sector: string;
    customFields?: Record<string, string>;
  }
): Promise<void> {
  const rowValues: string[] = headers.map((header) => {
    if (header === mapping.title) return taskData.title;
    if (header === mapping.status) return taskData.status;
    if (header === mapping.priority) return taskData.priority;
    if (header === mapping.assignee) return taskData.assignee;
    if (header === mapping.dueDate) return taskData.dueDate;
    if (header === mapping.notes) return taskData.notes;
    if (header === mapping.sector) return taskData.sector;
    if (taskData.customFields && taskData.customFields[header] !== undefined) {
      return taskData.customFields[header];
    }
    return '';
  });

  const range = `'${sheetTitle}'!A1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message ||
        `Erro ao adicionar linha no Google Sheets (${response.status})`
    );
  }
}

export async function updateTaskRow(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  rowNumber: number,
  headers: string[],
  mapping: ColumnMapping,
  taskData: {
    title: string;
    status: string;
    priority: string;
    assignee: string;
    dueDate: string;
    notes: string;
    sector: string;
    existingRaw?: Record<string, string>;
    customFields?: Record<string, string>;
  }
): Promise<void> {
  const endColLetter = columnIndexToLetter(Math.max(headers.length - 1, 0));
  const range = `'${sheetTitle}'!A${rowNumber}:${endColLetter}${rowNumber}`;

  const rowValues: string[] = headers.map((header) => {
    if (header === mapping.title) return taskData.title;
    if (header === mapping.status) return taskData.status;
    if (header === mapping.priority) return taskData.priority;
    if (header === mapping.assignee) return taskData.assignee;
    if (header === mapping.dueDate) return taskData.dueDate;
    if (header === mapping.notes) return taskData.notes;
    if (header === mapping.sector) return taskData.sector;
    if (taskData.customFields && taskData.customFields[header] !== undefined) {
      return taskData.customFields[header];
    }
    return taskData.existingRaw?.[header] || '';
  });

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message ||
        `Erro ao atualizar linha no Google Sheets (${response.status})`
    );
  }
}

export async function updateSingleCell(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  rowNumber: number,
  columnName: string,
  headers: string[],
  newValue: string
): Promise<void> {
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) {
    throw new Error(`Coluna "${columnName}" não encontrada no cabeçalho.`);
  }

  const colLetter = columnIndexToLetter(colIndex);
  const cellRange = `'${sheetTitle}'!${colLetter}${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    cellRange
  )}?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[newValue]],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message ||
        `Erro ao atualizar célula no Google Sheets (${response.status})`
    );
  }
}

export async function clearRowValues(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  rowNumber: number,
  columnCount: number
): Promise<void> {
  const endColLetter = columnIndexToLetter(Math.max(columnCount - 1, 0));
  const range = `'${sheetTitle}'!A${rowNumber}:${endColLetter}${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:clear`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message ||
        `Erro ao limpar tarefa na planilha (${response.status})`
    );
  }
}

export async function createDefaultTemplateSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string
): Promise<void> {
  // If the sheet is empty, optionally write a standard CEEM CVEL header template
  const defaultHeaders = [
    'Tarefa',
    'Status',
    'Prioridade',
    'Responsável',
    'Prazo',
    'Setor / Prefixo',
    'Observações',
    'Data de Criação',
  ];

  const range = `'${sheetTitle}'!A1:H1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}?valueInputOption=USER_ENTERED`;

  await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [defaultHeaders],
    }),
  });
}
