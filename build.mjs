import { readFileSync, writeFileSync } from 'node:fs';
const sources = ['catalogue.js', 'engine.js', 'app.js'];
const scripts = sources.map(name => `<script>\n${readFileSync(new URL(`src/${name}`, import.meta.url), 'utf8').replace(/<\/script/gi, '<\\/script')}\n</script>`).join('\n');
writeFileSync(new URL('index.html', import.meta.url), readFileSync(new URL('src/page.html', import.meta.url), 'utf8').replace('<!-- GAME_SCRIPTS -->', scripts));
console.log('Built self-contained index.html');
