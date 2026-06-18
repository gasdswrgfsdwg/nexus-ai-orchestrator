# TEST_READY: Nexus Editais E2E Test Suite

This document attests that the E2E test suite for the **Nexus Editais** project has been fully configured, implemented, and verified.

## Test Philosophy & Design
- **Opaque-Box & Requirement-Driven**: The tests simulate realistic user interactions directly on the DOM, decoupled from implementation details of the frontend components.
- **Framework**: Vitest (v4.1.9) with JSDOM environment.
- **Scope**: Covers Tiers 1-4 (60 test cases) as specified in `TEST_INFRA.md`.

## Test Execution Details

### Environment Setup
The E2E tests are configured in the `dashboard` workspace. The dependencies `vitest` and `jsdom` have been successfully installed.

To execute the tests, Node.js must be installed on the system. If Node is not in the system PATH (e.g., Windows command environments), prepend it to the PATH or invoke it directly from its path.

### Commands to Run the Tests
From the project root:

```bash
# Add Node.js to path if necessary (Windows PowerShell example)
$env:PATH += ';C:\Program Files\nodejs'

# Run the test suite
npm run test:e2e
```

### Verification Output
All 60 test cases executed and passed:

```text
> nexus-ai-orchestrator@1.0.0 test:e2e
> vitest run dashboard/tests/e2e

 RUN  v4.1.9 C:/Users/User/OneDrive/Desktop/nexus-ai-orchestrator

 ✓ dashboard/tests/e2e/nexusEditais.test.js (60 tests) 1781ms

 Test Files  1 passed (1)
      Tests  60 passed (60)
   Start at  16:40:56
   Duration  3.02s
```

## Inventory of Implemented Tests

### Tier 1: Feature Coverage (25 Cases)
- **Feature 1: Monitoramento e Descoberta de Editais** (T1.F1.1 to T1.F1.5)
- **Feature 2: Elaboração de Propostas com IA** (T1.F2.1 to T1.F2.5)
- **Feature 3: Gestão de Submissões e Prazos** (T1.F3.1 to T1.F3.5)
- **Feature 4: Acompanhamento Pós-Aprovação** (T1.F4.1 to T1.F4.5)
- **Feature 5: App Shell & Responsive Interface** (T1.F5.1 to T1.F5.5)

### Tier 2: Boundary & Corner Cases (25 Cases)
- **Feature 1: Discovery Edge Cases** (T2.F1.1 to T2.F1.5)
- **Feature 2: Proposal Validation & Wizard Edge Cases** (T2.F2.1 to T2.F2.5)
- **Feature 3: Kanban Document Checklist & Move Rules** (T3.F3.1 to T3.F3.5)
- **Feature 4: Post-Approval Financial Ledgers & Overflows** (T2.F4.1 to T2.F4.5)
- **Feature 5: Viewport, Scalability, and Safety Limits** (T2.F5.1 to T2.F5.5)

### Tier 3: Cross-Feature Combinations (5 Cases)
- **T3.CF1: Do Perfil à Proposta** (Inherits categories)
- **T3.CF2: Fluxo Completo de Submissão** (Transition sequence)
- **T3.CF3: Do Kanban ao Pós-Aprovação** (Rubric creation from proposals)
- **T3.CF4: Atualização de Prazos Bidirecional** (Dual-view sync)
- **T3.CF5: Orçamento vs Realizado Pós-Aprovação** (Balanced totals)

### Tier 4: Real-World Scenarios (5 Cases)
- **T4.APP1: Ciclo de Vida do Edital de Cultura (Lei Rouanet)**
- **T4.APP2: Ciclo de Vida do Edital de Inovação (FINEP)**
- **T4.APP3: Lançamento Multiprojeto Concorrente** (Isolation and agents)
- **T4.APP4: Auditoria e Ajuste de Contas pós-reprovação** (Forbidden modules)
- **T4.APP5: Simulação de Alta Sobrecarga e Filtro de Desempenho**
