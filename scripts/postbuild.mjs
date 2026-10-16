// GitHub Pages serves 404.html for unknown paths. Copying the app shell there lets
// client-side routes such as /play or /credits load directly or after a refresh.
import { copyFile } from 'node:fs/promises';
await copyFile('dist/index.html', 'dist/404.html');
console.log('postbuild: wrote dist/404.html');
