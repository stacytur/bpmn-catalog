import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const PROC_DIR = path.join(ROOT, 'processes');
const SITE_DIR = path.join(ROOT, 'site');

const walk = async (dir) => {
  const out = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  for (const it of items) {
    const full = path.join(dir, it.name);
    if (it.isDirectory()) out.push(...await walk(full));
    else if (it.isFile() && it.name.endsWith('.bpmn')) out.push(full);
  }
  return out;
};

await fs.mkdir(SITE_DIR, { recursive: true });
const files = (await walk(PROC_DIR)).map(f => path.relative(ROOT, f).replace(/\\/g,'/'));

await fs.writeFile(path.join(SITE_DIR, 'files.json'), JSON.stringify(files, null, 2), 'utf8');

const index = `<!doctype html><meta charset="utf-8"><title>BPMN Catalog</title>
<h1>BPMN Catalog</h1><ul>
${files.map(f=>`<li><a href="viewer.html?file=${encodeURIComponent(f)}">${f.replace(/^processes\\//,'')}</a></li>`).join('\n')}
</ul>`;
await fs.writeFile(path.join(SITE_DIR, 'index.html'), index, 'utf8');

console.log('Site built. Files:', files.length);
