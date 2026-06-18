# Project: Nexus Editais

## Architecture
- **App Shell / Layout**: Handles overall state, navigation, active module rendering, responsive layout (desktop & tablet).
- **Editais Module (R1)**: Manages mock editais data, filtering, user profiles, and score computation.
- **Propostas Module (R2)**: Standard proposal section wizard, rich text editor integration, Mock LLM generation service, editable budget & schedule tables.
- **Projetos/Kanban Module (R3)**: Handles Kanban workflow board (drag & drop stages), card metrics, calendar/timeline representation.
- **Pós-Aprovação Module (R4)**: Financial tracking, rubrics, schedule validation, markdown generation.
- **Mock Data Engine**: Centralized data store in `src/data/editaisMockData.js` managing initial state.

## Code Layout
- `dashboard/src/App.jsx`: Main entry, state, navbar.
- `dashboard/src/components/`: Sub-components for modules.
  - `Navbar.jsx`: Navigation buttons and layout wrapper.
  - `EditaisModule.jsx`: Discovery dashboard, filters, profile settings.
  - `PropostasModule.jsx`: Proposal writing wizard, budget/schedule grids.
  - `ProjetosModule.jsx`: Kanban drag-and-drop board, timeline/calendar components.
  - `PosAprovacaoModule.jsx`: Financial tracking, reports.
- `dashboard/src/data/editaisMockData.js`: Centralized data store for editais, projects, proposals, and user profiles.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | E2E Test Suite | Create opaque-box E2E test cases (Tiers 1-4) and publish `TEST_READY.md` | None | DONE |
| 2 | App Shell & Navigation | Implement professional Layout in pt-BR, responsive sidebar, navigation without reloading | None | DONE |
| 3 | Monitoramento & Descoberta | Implement 10+ mock editais across 3+ categories, filters, configurable profile, and compatibility score | M2 | IN_PROGRESS |
| 4 | Elaboração de Propostas | Implement technical proposal wizard, rich text fields, "Gerar com IA" mock generator, and editable tables | M3 | PLANNED |
| 5 | Gestão de Submissões (Kanban) | Implement 6+ stage Kanban board with drag & drop, card stats, and timeline/calendar view | M4 | PLANNED |
| 6 | Acompanhamento Pós-Aprovação | Implement timeline vs. planned comparison, financial ledger with rubrics, and markdown report exporter | M5 | PLANNED |
| 7 | Integration, E2E Pass & Hardening | Pass 100% of E2E tests (Phase 1), perform adversarial test case verification, and white-box hardening (Phase 2) | M1, M6 | PLANNED |

## Interface Contracts
### Components ↔ Mock Data Store
- `editais`: Array of objects containing `{ id, titulo, orgao, prazo, valor, categoria, score, status }`
- `userProfile`: Configurable object containing `{ keywords: string[], area: string, maxOrcamento: number }`
- `proposals`: Object containing `{ sections: { objetivos, justificativa, metodologia, cronograma, orcamento }, budget: Array, schedule: Array }`
- `projects`: Array of objects containing `{ id, editalNome, prazo, documentosCompletosPercent, estagio, agenteAtribuido }`
