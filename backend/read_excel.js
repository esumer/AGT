const xlsx = require('xlsx');
const fs = require('fs');

try {
  const workbook = xlsx.readFile('../ASM.xlsx');
  let output = '';

  workbook.SheetNames.forEach(sheetName => {
    output += `\n--- SHEET: ${sheetName} ---\n`;
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    // Tablonun yapısını anlamak için ilk 50 satırı yazdır
    const slice = json.slice(0, 50);
    slice.forEach(row => {
      // Boş satırları filtrele
      if (row.length > 0 && row.some(cell => cell !== null && cell !== '')) {
        output += JSON.stringify(row) + '\n';
      }
    });
  });

  fs.writeFileSync('read_excel_output.txt', output);
  console.log('Excel dosyası başarıyla okundu ve read_excel_output.txt dosyasına yazıldı.');
} catch (error) {
  console.error('Hata:', error);
}
