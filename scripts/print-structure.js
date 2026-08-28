const fs = require('fs');
const path = require('path');
function walk(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !['node_modules','.git'].includes(e.name))
    .sort((a,b)=>Number(b.isDirectory())-Number(a.isDirectory()) || a.name.localeCompare(b.name));
  for (const e of entries) {
    console.log(prefix + e.name + (e.isDirectory() ? '/' : ''));
    if (e.isDirectory()) walk(path.join(dir, e.name), prefix + '  ');
  }
}
walk(process.cwd());
