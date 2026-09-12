#!/usr/bin/env node
/**
 * layered-study-new-module - CLI wrapper
 */

import { newModule } from '../renderer/new-module.js';
import path from 'path';

const moduleId = process.argv[2];
if (!moduleId) {
  console.error('Usage: layered-study-new-module <module-id>');
  process.exit(1);
}

const contentDir = path.join(process.cwd(), 'content');
newModule(moduleId, contentDir);