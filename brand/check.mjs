import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const errors = [];

const sections = ['overview', 'logo', 'color', 'typography', 'illustration', 'iconography', 'crt'];
for (const id of sections) {
  if (!html.includes(`id="${id}"`)) errors.push(`missing section #${id}`);
}
const colors = ['#C4C4C4', '#D9D9D9', '#1C1B1F', '#333333', '#3B3942', '#787582', '#ED9833', '#F861D6', '#00C472', '#2E2A36'];
for (const c of colors) {
  if (!html.toUpperCase().includes(c)) errors.push(`missing color ${c}`);
}
for (const s of ['DINPro', 'Barlow', 'Coming soon...', 'Results driven environmentalism']) {
  if (!html.includes(s)) errors.push(`missing text "${s}"`);
}
if (/<html[\s>]|<head[\s>]|<body[\s>]|<!doctype/i.test(html)) errors.push('page must not contain html/head/body/doctype tags (Artifact wraps it)');
for (const f of ['itd-monogram.svg', 'itd-monogram-white.svg', 'itd-lockup.svg']) {
  if (!existsSync(new URL(`./assets/${f}`, import.meta.url))) errors.push(`missing asset ${f}`);
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('brand guide OK');
