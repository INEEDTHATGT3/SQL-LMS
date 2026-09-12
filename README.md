# SQL Layered Study System

A four-layer learning system for SQL.

## Structure

- `content/` - Source content (JSON per module/level)
- `renderer/blocks/` - Custom block renderers
- `site/` - Generated output (deploy to GitHub Pages)

## Levels

1. **BEGINNER** - Mental models, zero assumptions
2. **INTERVIEW READY** - Standard patterns, formal complexity
3. **ADVANCED** - Optimization trade-offs, internals
4. **EXPERT** - Constraint-driven techniques

## Commands

```bash
npm install
npm run new:module -- basics   # scaffold module
npm run lint                   # validate quotas
npm run build                  # generate site/
npm run dev                    # preview at localhost:3000
npm run deploy                 # deploy to GitHub Pages
```

## Custom Blocks

- `query-plan` - EXPLAIN visualization
- `schema-diagram` - Mermaid ERD
- `table-diff` - Before/after data tables
- `dialect-diff` - Multi-dialect comparison
- `seed-data` - Seed data reference card

## Deployment

1. Push to GitHub
2. Enable GitHub Pages (source: GitHub Actions)
3. Site deploys automatically on push to main

## Upgrading Core

```bash
npm run upgrade
npm run build
```
