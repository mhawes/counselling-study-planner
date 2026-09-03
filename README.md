# Counsellor Study Tracker

A Vue 3 + Quasar application for managing placement hours, counselling session process notes, supervision records, course criteria claims, and glossary terms.

## Features
- Placement page for session tracking by client and agency
- Supervision notes for reflective and supervisory information
- Course criteria page with claim recording and unit completion tracking
- Glossary for defining learning terms

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

The `main` branch is deployed automatically by the
[GitHub Actions workflow](.github/workflows/deploy-pages.yml). In the repository
settings, set **Pages > Build and deployment > Source** to **GitHub Actions**.

The production site is available at:
`https://mhawes.github.io/counselling-study-planner/`
