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
| Metas | `goals` |
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
| `responsabilidades` | Entregas e atribuicoes da pessoa | Producao executiva e relatorios |
| `statusAtuacao` | Situacao na equipe | `previsto`, `confirmado`, `em_atividade`, `concluido`, `desligado` |
| `cargaHorariaSemanal` | Dedicacao estimada por semana | 20 |
| `inicioAtuacao` / `fimAtuacao` | Periodo de participacao | `2026-08-01` / `2026-12-15` |
| `tipoRemuneracao` | Forma do pagamento | `nao_remunerado`, `valor_total`, `mensal`, `hora`, `diaria`, `servico` |
| `valorPrevisto` | Custo total planejado da pessoa | 15000 |
| `budgetItemId` | Rubrica ligada no plano financeiro | 1720000000000 |
| `cpf` | CPF | 123.456.789-00 |
| `rg` | Documento de identidade | 1.234.567 |
| `cidade` | Cidade de residencia | Marilandia |
| `email` | Contato | nome@exemplo.com |
| `telefone` | Contato | (27) 90000-0000 |
| `anuencia` | Anuencia registrada | `true` / `false` |
| `dataAnuencia` | Data da anuencia | `2026-08-15` |

`normalizeTeamMember()` preenche os valores padrao e preserva campos desconhecidos de dados antigos.

O botao "Vincular ao financeiro" cria uma unica rubrica de categoria `equipe` e grava o ID em `budgetItemId`. Os proximos acionamentos atualizam a mesma rubrica. Tambem e possivel selecionar uma rubrica financeira existente. Assim, equipe e financeiro compartilham a referencia do custo sem somar uma copia separada ao total do projeto.

`buildAnuenciaMarkdown({ member, proposal, edital })` gera um Termo de Anuencia e Autorizacao de Participacao ja preenchido com os dados da pessoa e do projeto, pronto para baixar em Markdown. No painel, cada integrante tem o botao "Gerar anuencia" na etapa Equipe do dossie.

## Metas e indicadores

A lista `goals` guarda o quadro de metas. Cada meta possui `descricao`, `indicador`, `quantidade`, `unidade` e `meioVerificacao`. `normalizeGoal()` aplica padroes, converte `quantidade` para numero e preserva campos desconhecidos. As metas aparecem na etapa Metas do dossie e na secao "Metas e indicadores" do Markdown exportado. Esse padrao acompanha o que plataformas de gestao de editais oferecem (definicao de metas e indicadores para monitoramento da execucao).

## Portabilidade

O painel oferece dois formatos:

- Markdown: documento legivel com identificacao, textos, cronograma e tabela financeira.
- JSON: dados estruturados com `schemaVersion`, edital e projeto completo.

Para continuar em outra IA, prefira o JSON para edicao estruturada e o Markdown para revisao editorial.

## Prontidao para submissao

`getDossierReadiness()` calcula sete verificacoes acionaveis: identificacao, texto tecnico, metas, equipe, anuencias, cronograma e financeiro. A etapa Resumo exibe o percentual e permite abrir diretamente a secao pendente. Esse indicador complementa `getDossierCompletion()`: preenchimento mede volume de dados; prontidao mede condicoes minimas para revisao e envio.

## Persistencia

O workspace e salvo no navegador com a chave:

```text
nexus-editais-workspace-v1
```

Essa persistencia e local ao navegador e ao aparelho. Para mover o projeto entre computadores, navegadores ou IAs, exporte o JSON.

Quando o Supabase esta configurado, o mesmo workspace e salvo em `public.user_workspaces`, uma linha por usuario autenticado. O modo local permanece obrigatorio e funciona sem conexao. A migracao canonica esta em `supabase/migrations/20260619164937_create_user_workspaces.sql`.

## Proximas evolucoes recomendadas

1. Importar um JSON exportado para restaurar um dossie. **Implementado** (botao "Importar dados" no rodape do dossie); aceita o JSON exportado (`{ project }`) ou um objeto de projeto cru e preserva campos desconhecidos via `normalizeProposal`.
2. Versionar revisoes do texto e do orcamento.
3. Equipe, Termo de Anuencia, metas e indicadores ja implementados; ainda faltam documentos anexos.
4. Sincronizar com um backend autenticado quando houver necessidade multiusuario.
5. Gerar PDF e DOCX a partir do mesmo modelo canonico (inclusive da anuencia).
