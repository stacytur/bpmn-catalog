import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'processes');
const OUT_DIR = path.join(ROOT, 'site');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(full));
    else if (e.isFile() && e.name.endsWith('.bpmn')) files.push(full);
  }
  return files;
}

await fs.mkdir(OUT_DIR, { recursive: true });

const filesAbs = await walk(SRC_DIR);
const files = filesAbs.map(f => path.relative(ROOT, f).replace(/\\/g, '/')); // 'processes/...'

// копируем *.bpmn → site/processes/…
for (const rel of files) {
  const dst = path.join(OUT_DIR, rel);
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.copyFile(path.join(ROOT, rel), dst);
}

// список для viewer
await fs.writeFile(path.join(OUT_DIR, 'files.json'), JSON.stringify(files, null, 2), 'utf8');

// главная страница каталога
const items = files.map(f => {
  const label = f.startsWith('processes/') ? f.slice('processes/'.length) : f;
  return `<li><a href="viewer.html?file=${encodeURIComponent(f)}">${label}</a></li>`;
}).join('\n');

const index = `<!doctype html><meta charset="utf-8"><title>BPMN Catalog</title>
<h1>BPMN Catalog</h1>
<ul>
${items}
</ul>`;
await fs.writeFile(path.join(OUT_DIR, 'index.html'), index, 'utf8');

console.log('Built site with', files.length, 'BPMN file(s).');

