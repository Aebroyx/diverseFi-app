import ExcelJS from 'exceljs';
import { MenuImportRow } from '@/types/menuImport';

/**
 * Parse Excel file to menu import rows
 * Note: Export and template generation are handled by the backend
 */
export async function parseMenusExcel(file: File): Promise<MenuImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  // Try to get worksheet by index or name
  const worksheet = workbook.worksheets[0] || workbook.getWorksheet('Menus') || workbook.getWorksheet(1);

  if (!worksheet) {
    throw new Error('No worksheet found in the Excel file. Please ensure the file has at least one worksheet.');
  }

  const rows: MenuImportRow[] = [];

  // Find header row and map column indices
  const headerRow = worksheet.getRow(1);
  const columnMap: Record<string, number> = {};

  headerRow.eachCell((cell, colNumber) => {
    const headerText = String(cell.value || '').toLowerCase().trim();
    if (headerText === 'name') columnMap['name'] = colNumber;
    else if (headerText === 'path') columnMap['path'] = colNumber;
    else if (headerText === 'icon') columnMap['icon'] = colNumber;
    else if (headerText === 'order index' || headerText === 'order_index' || headerText === 'order') columnMap['order_index'] = colNumber;
    else if (headerText === 'parent menu' || headerText === 'parent_menu' || headerText === 'parent') columnMap['parent_name'] = colNumber;
    else if (headerText === 'is active' || headerText === 'is_active' || headerText === 'active') columnMap['is_active'] = colNumber;
  });

  // Validate required columns
  const requiredColumns = ['name', 'order_index', 'is_active'];
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

    // Skip empty rows
    if (!name) {
      return;
    }

    const orderIndexStr = getCellValue('order_index');
    const orderIndex = orderIndexStr ? parseInt(orderIndexStr, 10) : 0;

    const isActiveStr = getCellValue('is_active').toLowerCase();
    const isActive = isActiveStr === 'true' || isActiveStr === '1' || isActiveStr === 'yes';

    rows.push({
      row_number: rowNumber,
      name,
      path: getCellValue('path') || '',
      icon: getCellValue('icon') || '',
      order_index: isNaN(orderIndex) ? 0 : orderIndex,
      parent_name: getCellValue('parent_name') || '',
      is_active: isActive,
    });
  });

  return rows;
}
