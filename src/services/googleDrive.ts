import { DriveFile } from '../types/sheets';

export async function listSpreadsheets(
  accessToken: string,
  searchQuery?: string
): Promise<DriveFile[]> {
  let q = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
  if (searchQuery && searchQuery.trim().length > 0) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set(
    'fields',
    'files(id, name, modifiedTime, webViewLink, owners(displayName, emailAddress))'
  );
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('pageSize', '50');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message ||
        `Erro ao buscar planilhas do Google Drive (${response.status})`
    );
  }

  const data = await response.json();
  return data.files || [];
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  // Regex to extract from URL format: /spreadsheets/d/([a-zA-Z0-9-_]+)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If it's already an ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}
