import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Mustache from 'mustache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Compile theme.css.mustache using theme-config.json
 * Usage: node css/theme-compiler.js [theme-config.json] [output.css]
 */

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function compileTheme(themeConfigPath, outputPath) {
  const config = JSON.parse(fs.readFileSync(themeConfigPath, 'utf8'));
  
  // Add rgba helper to config
  config.rgba = hexToRgba;
  
  // Ensure levels array has rgba computed
  config.levels = config.levels.map(l => ({
    ...l,
    rgba: hexToRgba(l.color, 0.1),
    rgba2: hexToRgba(l.color, 0.25)
  }));
  
  const template = fs.readFileSync(
    path.resolve(__dirname, 'theme.css.mustache'),
    'utf8'
  );
  
  const css = Mustache.render(template, config);
  fs.writeFileSync(outputPath, css);
  console.log(`✓ Theme compiled: ${outputPath}`);
}

// CLI entry
const [, , configPath = 'theme-config.json', outputPath = 'site/theme.css'] = process.argv;
if (import.meta.url === `file://${process.argv[1]}`) {
  compileTheme(configPath, outputPath);
}