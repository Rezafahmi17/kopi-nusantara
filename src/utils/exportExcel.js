/**
 * Utility to export data to a CSV file optimized for MS Excel.
 * Uses a UTF-8 BOM (\uFEFF) and semicolon (;) delimiters to ensure correct
 * double-byte encoding (emojis, rupiah symbol, text formatting) and columns alignment.
 */
export const exportToExcelCSV = (filename, headers, rows) => {
  const delimiter = ';';
  
  // Format cells
  const formattedRows = rows.map(row => 
    row.map(val => {
      if (val === null || val === undefined) return '';
      
      let str = String(val);
      
      // Clean newlines
      str = str.replace(/\r?\n|\r/g, ' ');
      
      // Escape double quotes and wrap in quotes if contains separator, quotes, or comma
      if (str.includes(delimiter) || str.includes('"') || str.includes(',')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      
      return str;
    }).join(delimiter)
  );

  const fileHeader = headers.join(delimiter);
  const csvContent = '\uFEFF' + [fileHeader, ...formattedRows].join('\n'); // Add UTF-8 BOM
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
