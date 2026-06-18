# Nexus Editais - Guia para agentes

## Prioridade do produto

O dashboard em `dashboard/` e um gestor de editais e projetos. Preserve o fluxo:

1. Descoberta de editais.
2. Escrita do dossie e da proposta.
3. Submissao e acompanhamento de prazos.
4. Execucao e prestacao de contas apos aprovacao.

## Regras de implementacao

- Interface e textos em portugues do Brasil.
- Preserve IDs e classes usados em `dashboard/tests/e2e/`.
- Reutilize os tokens e componentes de `dashboard/src/index.css`, `App.css` e `modules.css`.
- O modelo canonico do projeto esta em `dashboard/src/data/projectModel.js`.
- Dados antigos de orcamento devem continuar funcionando por meio das funcoes de normalizacao.
- A versao publica e estatica no GitHub Pages; nao dependa de backend para o fluxo principal.
- Dados preenchidos no navegador usam `localStorage` e podem ser exportados em Markdown e JSON.
- Nao inclua segredos, tokens ou dados pessoais reais no repositorio.

## Validacao obrigatoria

```powershell
npm run test:e2e
npm run test:orchestrator
cd dashboard
..\node_modules\.bin\vite.cmd build --configLoader runner
```

## Leitura antes de alterar o dossie

- `docs/PROJECT_DOSSIER_MODEL.md`
- `CONTINUAR_COM_OUTRA_IA.md`
- `dashboard/src/data/projectModel.js`
- `dashboard/src/components/PropostasModule.jsx`

