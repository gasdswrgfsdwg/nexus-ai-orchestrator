# Modelo do Dossie do Projeto

## Objetivo

Cada proposta deve funcionar como um dossie portatil. Ele concentra o texto do projeto, o cronograma e o planejamento financeiro em uma unica estrutura que pode ser salva no navegador e exportada para outra ferramenta ou IA.

O modelo canonico esta em `dashboard/src/data/projectModel.js`.

## Estrutura principal

| Grupo | Campos principais |
| --- | --- |
| Identificacao | `editalId`, `tituloProjeto`, `areaProjeto`, `statusProjeto` |
| Conceito | `ideiaCentral`, `sinopse` |
| Responsabilidade | `proponente`, `responsavel` |
| Abrangencia | `territorio`, `publicoAlvo`, `duracaoMeses` |
| Texto tecnico | `objetivos`, `justificativa`, `metodologia` |
| Equipe | `team` |
| Execucao | `schedule` |
| Financeiro | `budget` |

## Status do projeto

Fluxo recomendado:

`ideia` -> `em_escrita` -> `em_revisao` -> `pronto` -> `submetido` -> `aprovado` -> `em_execucao` -> `concluido`

O status do dossie e mais detalhado que a coluna do Kanban. Ao integrar os dois, mantenha uma funcao explicita de conversao em vez de comparar textos soltos.

## Item financeiro

Cada linha do plano financeiro possui:

| Campo | Finalidade | Exemplo |
| --- | --- | --- |
| `descricao` | Nome do custo | Coordenacao geral |
| `categoria` | Area financeira | `equipe`, `logistica`, `comunicacao` |
| `status` | Maturidade do valor | `estimado`, `cotado`, `aprovado`, `contratado`, `pago` |
| `unidadeMedida` | Como o item e medido | `unidade`, `mes`, `ano`, `servico`, `diaria`, `hora` |
| `quantidade` | Numero de unidades | 6 |
| `valorUnitario` | Valor por unidade | 2500 |
| `valor` | Total calculado | 15000 |
| `frequencia` | Recorrencia | `unica`, `mensal`, `trimestral`, `semestral`, `anual` |
| `mesReferencia` | Competencia mensal | `2026-08` |
| `anoReferencia` | Ano do gasto | 2026 |
| `fonteRecurso` | Origem do recurso | `edital`, `contrapartida`, `patrocinio`, `proprio` |

Formula atual:

```text
valor = quantidade * valorUnitario
```

`normalizeBudgetItem()` mantem compatibilidade com linhas antigas que possuem apenas `descricao` e `valor`.

## Equipe e anuencia

A lista `team` guarda os integrantes do projeto. Cada integrante possui:

| Campo | Finalidade | Exemplo |
| --- | --- | --- |
| `nome` | Nome completo | Maria Souza |
| `funcao` | Papel no projeto | `coordenacao`, `producao`, `oficineiro` |
| `vinculo` | Condicao no projeto | `proponente`, `contratado`, `voluntario` |
| `cpf` | CPF | 123.456.789-00 |
| `rg` | Documento de identidade | 1.234.567 |
| `cidade` | Cidade de residencia | Marilandia |
| `email` | Contato | nome@exemplo.com |
| `telefone` | Contato | (27) 90000-0000 |
| `anuencia` | Anuencia registrada | `true` / `false` |
| `dataAnuencia` | Data da anuencia | `2026-08-15` |

`normalizeTeamMember()` preenche os valores padrao e preserva campos desconhecidos de dados antigos.

`buildAnuenciaMarkdown({ member, proposal, edital })` gera um Termo de Anuencia e Autorizacao de Participacao ja preenchido com os dados da pessoa e do projeto, pronto para baixar em Markdown. No painel, cada integrante tem o botao "Gerar anuencia" na etapa Equipe do dossie.

## Portabilidade

O painel oferece dois formatos:

- Markdown: documento legivel com identificacao, textos, cronograma e tabela financeira.
- JSON: dados estruturados com `schemaVersion`, edital e projeto completo.

Para continuar em outra IA, prefira o JSON para edicao estruturada e o Markdown para revisao editorial.

## Persistencia

O workspace e salvo no navegador com a chave:

```text
nexus-editais-workspace-v1
```

Essa persistencia e local ao navegador e ao aparelho. Para mover o projeto entre computadores, navegadores ou IAs, exporte o JSON.

## Proximas evolucoes recomendadas

1. Importar um JSON exportado para restaurar um dossie.
2. Versionar revisoes do texto e do orcamento.
3. Equipe ja implementada (com Termo de Anuencia); ainda faltam metas, indicadores e documentos anexos.
4. Sincronizar com um backend autenticado quando houver necessidade multiusuario.
5. Gerar PDF e DOCX a partir do mesmo modelo canonico (inclusive da anuencia).

