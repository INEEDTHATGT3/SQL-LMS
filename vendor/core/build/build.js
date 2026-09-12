#!/usr/bin/env node
/**
 * layered-study-build - Skill build script
 * Loads skill config and runs core renderer
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { render } from '@layered-study/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  const cwd = process.cwd();
  
  // Load skill config files
  const themeConfig = JSON.parse(fs.readFileSync(path.join(cwd, 'content', 'theme-config.json'), 'utf8'));
  const languageConfig = JSON.parse(fs.readFileSync(path.join(cwd, 'content', 'language-config.json'), 'utf8'));
  const quotaConfig = JSON.parse(fs.readFileSync(path.join(cwd, 'content', 'quota-config.json'), 'utf8'));
  
  // Merge configs
  const skillConfig = {
    skillName: themeConfig.skillName,
    watermark: themeConfig.watermark,
    levels: themeConfig.levels,
    palette: themeConfig.palette,
    languages: languageConfig.languages,
    defaultLanguage: languageConfig.default,
    storageKey: quotaConfig.storageKey,
    ...quotaConfig
  };
  
  // Ensure site directory exists
  const siteDir = path.join(cwd, 'site');
  if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });
  
  // Compile theme
  const { compileTheme } = await import('@layered-study/core');
  await compileTheme(
    path.join(cwd, 'content', 'theme-config.json'),
    path.join(siteDir, 'theme.css')
  );
  
  // Generate language switcher
  const { generateLanguageSwitcher } = await import('@layered-study/core');
  const langJs = generateLanguageSwitcher(languageConfig);
  fs.writeFileSync(path.join(siteDir, 'lang-toggle.js'), langJs);
  
  // Generate progress tracker
  const { createProgressTracker } = await import('@layered-study/core');
  const recallJs = createProgressTracker(quotaConfig);
  fs.writeFileSync(path.join(siteDir, 'recall.js'), recallJs);
  
  // Run main render
  await render(skillConfig, {
    root: cwd,
    contentDir: path.join(cwd, 'content'),
    siteDir: path.join(cwd, 'site')
  });
}

build().catch(e => {
  console.error('Build failed:', e);
  process.exit(1);
});