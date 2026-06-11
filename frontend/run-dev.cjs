const { spawn } = require('child_process');
const path = require('path');

const vitePath = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
const child = spawn(process.execPath, [vitePath, '--open'], { stdio: ['inherit', 'pipe', 'inherit'] });

child.on('error', (err) => {
  console.error('Vite başlatılamadı:', err);
});

child.stdout.on('data', (data) => {
  const text = data.toString();
  // "trying another one..." içeren satırları filtrele
  const lines = text.split('\r\n').flatMap(line => line.split('\n'));
  const filtered = lines
    .filter(line => !line.includes('trying another one'))
    .join('\n');
  
  if (filtered.trim()) {
    process.stdout.write(filtered + '\n');
  }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
