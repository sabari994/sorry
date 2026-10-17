import fs from 'fs';

// If Vite built index.dev.html, ensure dist/index.html exists
if (fs.existsSync('dist/index.dev.html')) {
  fs.copyFileSync('dist/index.dev.html', 'dist/index.html');
}

// Copy production index.html to root for GitHub Pages direct serving
if (fs.existsSync('dist/index.html')) {
  fs.copyFileSync('dist/index.html', 'index.html');
}

// Clean and copy production assets to root for GitHub Pages direct serving
if (fs.existsSync('dist/assets')) {
  if (fs.existsSync('assets')) {
    fs.rmSync('assets', { recursive: true, force: true });
  }
  fs.cpSync('dist/assets', 'assets', { recursive: true });
}

console.log('✅ Successfully synced production build to root for GitHub Pages!');
