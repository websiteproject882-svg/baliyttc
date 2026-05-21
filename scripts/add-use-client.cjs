const fs = require('fs');
const path = require('path');

const addUseClient = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      addUseClient(fullPath);
    } else if (file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.startsWith('"use client"') && !content.startsWith("'use client'")) {
        fs.writeFileSync(fullPath, '"use client";\n' + content);
        console.log('Added "use client" to ' + fullPath);
      }
    }
  });
};

addUseClient(path.join(process.cwd(), 'src/components/home'));
addUseClient(path.join(process.cwd(), 'src/components/shared'));
addUseClient(path.join(process.cwd(), 'src/components/ui'));
