import ExcelJS from 'exceljs';
import { UserImportRow } from '@/types/userImport';

/**
 * Parse Excel file to user import rows
 * Note: Export and template generation are now handled by the backend
 */
export async function parseUsersExcel(file: File): Promise<UserImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  // Try to get worksheet by index or name
  const worksheet = workbook.worksheets[0] || workbook.getWorksheet('Users') || workbook.getWorksheet(1);

  if (!worksheet) {
    throw new Error('No worksheet found in the Excel file. Please ensure the file has at least one worksheet.');
  }

  const rows: UserImportRow[] = [];

  // Find header row and map column indices
  const headerRow = worksheet.getRow(1);
  const columnMap: Record<string, number> = {};

  headerRow.eachCell((cell, colNumber) => {
    const headerText = String(cell.value || '').toLowerCase().trim();
    if (headerText === 'username') columnMap['username'] = colNumber;
    else if (headerText === 'email') columnMap['email'] = colNumber;
    else if (headerText === 'password') columnMap['password'] = colNumber;
    else if (headerText === 'name') columnMap['name'] = colNumber;
    else if (headerText === 'role' || headerText === 'role_name') columnMap['role_name'] = colNumber;
    else if (headerText === 'active' || headerText === 'is_active') columnMap['is_active'] = colNumber;
  });

  // Validate required columns
  const requiredColumns = ['username', 'email', 'name', 'role_name', 'is_active'];
  const missingColumns = requiredColumns.filter((col) => !columnMap[col]);
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // Parse data rows (starting from row 2)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const getCellValue = (colKey: string): string => {
      const colNum = columnMap[colKey];
      if (!colNum) return '';
      const cell = row.getCell(colNum);
      if (cell.value === null || cell.value === undefined) return '';
      return String(cell.value).trim();
    };

    const username = getCellValue('username');
    const email = getCellValue('email');
    const name = getCellValue('name');
    const roleName = getCellValue('role_name');

    // Skip empty rows
    if (!username && !email && !name) {
      return;
    }

    const isActiveStr = getCellValue('is_active').toLowerCase();
    const isActive = isActiveStr === 'true' || isActiveStr === '1' || isActiveStr === 'yes';

    rows.push({
      row_number: rowNumber,
      username,
      email,
      password: getCellValue('password') || undefined,
      name,
      role_name: roleName,
      is_active: isActive,
    });
  });

  return rows;
}
