# Continuar com outra IA

## Como transportar o contexto

0. Leia `CONTEXTO_PARA_QUALQUER_IA.md`, que agora e o documento principal de arquitetura, Supabase e seguranca.
1. Abra o dossie no painel e use `Exportar dados` para obter o JSON do projeto.
2. Entregue a outra IA o repositorio ou o link do GitHub.
3. Anexe o JSON exportado quando a tarefa envolver um projeto preenchido.
4. Envie o prompt abaixo.

## Prompt de continuidade

```text
Voce vai continuar o desenvolvimento do Nexus Editais.

Repositorio:
https://github.com/gasdswrgfsdwg/nexus-ai-orchestrator

Antes de alterar codigo, leia integralmente:
- AGENTS.md
- CONTEXTO_PARA_QUALQUER_IA.md
- docs/PROJECT_DOSSIER_MODEL.md
- dashboard/src/data/projectModel.js
- dashboard/src/components/PropostasModule.jsx
- dashboard/tests/e2e/

Contexto do produto:
O Nexus Editais organiza descoberta de editais, escrita de projetos, submissao e pos-aprovacao. Cada proposta e um Dossie do Projeto com identificacao, ideia central, sinopse, objetivos, justificativa, metodologia, metas, equipe, cronograma e planejamento financeiro configuravel.

Regras importantes:
- Mantenha a interface em portugues do Brasil.
- Preserve compatibilidade com os testes e com dados antigos.
- O plano financeiro usa categoria, status, unidade de medida, quantidade, valor unitario, frequencia, mes, ano e fonte de recurso.
- Cada integrante da equipe possui funcao, vinculo, responsabilidades, status, carga horaria, periodo, remuneracao e anuencia. `budgetItemId` liga o integrante a uma unica rubrica financeira e evita duplicar o custo.
- A aplicacao publica e estatica no GitHub Pages.
- Os dados preenchidos ficam no localStorage e podem ser exportados em Markdown e JSON.
- O Supabase e opcional e nunca pode impedir o uso local. Use apenas chave publica no frontend e preserve as politicas RLS.
- Nao remova funcionalidades existentes nem altere IDs usados pelos testes sem atualizar e justificar os testes.

Se houver um arquivo JSON anexado, trate-o como a versao atual do projeto do usuario. Preserve todos os campos desconhecidos ao fazer migracoes.

Primeiro, resuma em no maximo 10 linhas:
1. O que ja existe.
2. O que a minha solicitacao muda.
3. Quais arquivos voce pretende alterar.

Depois implemente, execute os testes e informe exatamente o que foi validado.

Minha proxima solicitacao e:
[ESCREVA AQUI O QUE DESEJA CONTINUAR]
```

## Estado atual do produto

- Site: https://gasdswrgfsdwg.github.io/nexus-ai-orchestrator/
- Codigo: branch `main`.
- Testes principais: `npm run test:e2e`.
- Build do painel: `cd dashboard` e `..\node_modules\.bin\vite.cmd build --configLoader runner`.
