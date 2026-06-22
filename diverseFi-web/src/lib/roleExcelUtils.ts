import ExcelJS from 'exceljs';
import { RoleImportRow } from '@/types/roleImport';

/**
 * Parse Excel file to role import rows
 * Note: Export and template generation are handled by the backend
 */
export async function parseRolesExcel(file: File): Promise<RoleImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  // Try to get worksheet by index or name
  const worksheet = workbook.worksheets[0] || workbook.getWorksheet('Roles') || workbook.getWorksheet(1);

  if (!worksheet) {
    throw new Error('No worksheet found in the Excel file. Please ensure the file has at least one worksheet.');
  }

  const rows: RoleImportRow[] = [];

  // Find header row and map column indices
  const headerRow = worksheet.getRow(1);
  const columnMap: Record<string, number> = {};

  headerRow.eachCell((cell, colNumber) => {
    const headerText = String(cell.value || '').toLowerCase().trim();
    if (headerText === 'name') columnMap['name'] = colNumber;
    else if (headerText === 'display name' || headerText === 'display_name') columnMap['display_name'] = colNumber;
    else if (headerText === 'description') columnMap['description'] = colNumber;
    else if (headerText === 'is default' || headerText === 'is_default' || headerText === 'default') columnMap['is_default'] = colNumber;
    else if (headerText === 'is active' || headerText === 'is_active' || headerText === 'active') columnMap['is_active'] = colNumber;
  });

  // Validate required columns
  const requiredColumns = ['name', 'display_name', 'is_default', 'is_active'];
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

    const name = getCellValue('name');
    const displayName = getCellValue('display_name');

    // Skip empty rows
    if (!name && !displayName) {
      return;
    }

    const isDefaultStr = getCellValue('is_default').toLowerCase();
    const isDefault = isDefaultStr === 'true' || isDefaultStr === '1' || isDefaultStr === 'yes';

    const isActiveStr = getCellValue('is_active').toLowerCase();
    const isActive = isActiveStr === 'true' || isActiveStr === '1' || isActiveStr === 'yes';

    rows.push({
      row_number: rowNumber,
      name,
      display_name: displayName,
      description: getCellValue('description') || '',
      is_default: isDefault,
      is_active: isActive,
    });
  });

  return rows;
}
