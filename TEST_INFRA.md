# E2E Test Infra: Nexus Editais

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Monitoramento e Descoberta de Editais | ORIGINAL_REQUEST §R1 | 5      | 5      | ✓      |
| 2 | Elaboração de Propostas com IA | ORIGINAL_REQUEST §R2 | 5      | 5      | ✓      |
| 3 | Gestão de Submissões e Prazos | ORIGINAL_REQUEST §R3 | 5      | 5      | ✓      |
| 4 | Acompanhamento Pós-Aprovação | ORIGINAL_REQUEST §R4 | 5      | 5      | ✓      |
| 5 | Interface Web Responsiva em pt-BR | ORIGINAL_REQUEST §R5 | 5      | 5      | ✓      |

## Test Architecture
- Test Runner: Playwright / Vitest / Custom runner (implemented via a Node script in the test folder).
- Test Case format: Javascript/Typescript test files that simulate user interaction in a headless browser or component shell.
- Directory layout: `dashboard/tests/e2e/` for test cases.

## Test Cases Details

### Tier 1 - Feature Coverage (5 per feature)

#### Feature 1: Monitoramento e Descoberta de Editais (R1)
- **T1.F1.1: Exibição de Editais**: Verifica se a tela exibe pelo menos 10 editais de exemplo na carga inicial.
- **T1.F1.2: Categorias de Editais**: Confirma que existem editais de pelo menos 3 categorias diferentes (inovação, cultura, social).
- **T1.F1.3: Detalhes do Edital**: Garante que cada edital exibe título, órgão emissor, prazo, valor, categoria e score de compatibilidade.
- **T1.F1.4: Filtros Funcionais**: Teste de filtro de editais por categoria, verificando se a lista se atualiza corretamente.
- **T1.F1.5: Configuração de Perfil**: Verifica se o score de compatibilidade é recalculado ao alterar as palavras-chave do perfil.

#### Feature 2: Elaboração de Propostas com IA (R2)
- **T1.F2.1: Fluxo de Escrita**: Verifica se o wizard guia o usuário pelas seções (objetivos, justificativa, metodologia, etc.).
- **T1.F2.2: Campo de Texto Rico**: Garante que os campos de texto do wizard permitem edição.
- **T1.F2.3: Assistente de Escrita (Gerar com IA)**: Verifica se o botão "Gerar com IA" preenche o campo ativo com texto placeholder de qualidade.
- **T1.F2.4: Orçamento Editável**: Confirma que as tabelas de orçamento são editáveis.
- **T1.F2.5: Cronograma Editável**: Confirma que as tabelas de cronograma são editáveis.

#### Feature 3: Gestão de Submissões e Prazos (R3)
- **T1.F3.1: Colunas do Kanban**: Garante que o quadro kanban exibe as 6 colunas/estágios corretas.
- **T1.F3.2: Arrastar e Soltar**: Verifica a mudança de estágio de um projeto ao arrastar o card de uma coluna para outra.
- **T1.F3.3: Conteúdo do Card**: Garante que the card do projeto exibe o nome do edital, prazo, progresso dos documentos e o agente IA.
- **T1.F3.4: Visualização de Timeline**: Verifica a renderização dos prazos em um componente de linha do tempo ou calendário.
- **T1.F3.5: Alerta de Prazos**: Confirma se alertas/indicadores visuais são exibidos para prazos próximos.

#### Feature 4: Acompanhamento Pós-Aprovação (R4)
- **T1.F4.1: Comparativo Cronograma**: Verifica a exibição do comparativo cronograma planejado vs. real para projetos aprovados.
- **T1.F4.2: Controle Financeiro**: Garante que o razão financeiro exibe rubricas de verba planejada vs. gasta.
- **T1.F4.3: Adição de Transações**: Confirma que o usuário pode adicionar novos gastos a uma rubrica específica.
- **T1.F4.4: Exportar Relatório**: Teste da exportação de relatório de prestação de contas parcial/final em markdown.
- **T1.F4.5: Checklist de Obrigações**: Verifica a exibição de obrigações pendentes pós-aprovação.

#### Feature 5: Interface Web Responsiva em pt-BR (R5)
- **T1.F5.1: Navegação sem Recarga**: Garante que a troca de módulos funciona sem recarregar a página (comportamento SPA).
- **T1.F5.2: Tradução Completa (pt-BR)**: Verifica se todos os textos da UI estão em português (sem termos em inglês).
- **T1.F5.3: Responsividade Desktop**: Valida que a sidebar e o layout são exibidos de forma adequada em resoluções desktop comuns.
- **T1.F5.4: Responsividade Tablet**: Valida a adaptação do layout ao redimensionar a tela para o tamanho de tablet.
- **T1.F5.5: Barra de Navegação**: Garante que todos os itens de navegação (Painel, Agentes, Tarefas, etc.) levam às telas certas.

---

### Tier 2 - Boundary & Corner Cases (5 per feature)

#### Feature 1: Monitoramento e Descoberta de Editais (R1)
- **T2.F1.1: Sem Editais Correspondentes**: Altera perfil para valores impossíveis e verifica se o sistema mostra mensagem amigável de "Nenhum edital compatível".
- **T2.F1.2: Valores no Limite**: Testa ordenação e filtragem com valores de edital extremos (zero, bilhões).
- **T2.F1.3: Prazos Expirados**: Garante que editais vencidos são destacados com tags visuais de status fechado ou removidos da lista padrão.
- **T2.F1.4: Perfil Vazio**: Limpa todas as preferências e palavras-chave do perfil e verifica se o score padrão é exibido de forma neutra ou segura.
- **T2.F1.5: Caractere Especial no Filtro**: Testa busca/filtro de editais contendo caracteres especiais (ex: `@`, `*`, `&`).

#### Feature 2: Elaboração de Propostas com IA (R2)
- **T2.F2.1: Valores de Orçamento Negativos**: Tenta inserir valores negativos no orçamento e verifica se o sistema valida ou impede o salvamento.
- **T2.F2.2: Data de Cronograma Inválida**: Insere data final anterior à data inicial no cronograma e valida o comportamento de erro.
- **T2.F2.3: Seção Vazia na Geração**: Tenta "Gerar com IA" em uma seção sem foco ou com campos bloqueados e verifica se lida corretamente.
- **T2.F2.4: Limite de Caracteres**: Insere texto extremamente longo em uma seção de proposta e testa a persistência e visualização.
- **T2.F2.5: Adicionar Linha Vazia**: Valida o comportamento de adicionar e excluir itens no orçamento e no cronograma.

#### Feature 3: Gestão de Submissões e Prazos (R3)
- **T3.F3.1: Documentos 100% Completos**: Altera checklist de documentos para 100% completo e valida o status visual no card.
- **T3.F3.2: Sem Documentos**: Valida o percentual inicial (0%) quando nenhuma caixa de documentos está marcada.
- **T3.F3.3: Arrastar para Coluna Inválida**: Tenta arrastar um card para fora das colunas kanban e valida se ele retorna à posição de origem de forma segura.
- **T3.F3.4: Prazos Conflitantes**: Insere múltiplos projetos com o mesmo prazo e valida a renderização legível na linha do tempo.
- **T3.F3.5: Sem Agente Atribuído**: Garante que o card funciona corretamente e mostra a informação "Nenhum agente" caso não haja agente atribuído.

#### Feature 4: Acompanhamento Pós-Aprovação (R4)
- **T2.F4.1: Estouro de Orçamento**: Adiciona transações que excedem o valor da rubrica e verifica se exibe indicador visual de estouro.
- **T2.F4.2: Rubrica sem Valor**: Tenta criar rubrica com valor zero e valida se o sistema lida corretamente.
- **T2.F4.3: Exportar sem Dados**: Tenta exportar relatório com propostas/projetos vazios e valida se cria um markdown com estrutura padrão limpa.
- **T2.F4.4: Cronograma Real Atrasado**: Altera datas do cronograma real para após o prazo e verifica o indicador de atraso.
- **T2.F4.5: Exclusão de Todas as Rubricas**: Exclui todas as rubricas financeiras e valida se o módulo exibe estado vazio estruturado.

#### Feature 5: Interface Web Responsiva em pt-BR (R5)
- **T2.F5.1: Resolução Mínima**: Testa a interface em tela de tamanho mínimo (320px) para verificar se ocorrem quebras de layout.
- **T2.F5.2: Injeção de Código na URL / Input**: Tenta inserir tags HTML em campos de input e valida a proteção contra XSS (os inputs devem ser tratados como texto literal).
- **T2.F5.3: Carga Rápida entre Módulos**: Clica repetidamente e de forma rápida nos links de navegação para validar estabilidade da renderização.
- **T2.F5.4: Fonte Redimensionada**: Valida se o layout se adapta quando a escala de fontes do navegador é aumentada.
- **T2.F5.5: Termos Técnicos em Inglês**: Garante que mesmo termos comuns da web (ex: "Save", "Cancel", "IA", "Status") possuem alternativas adequadas em pt-BR.

---

### Tier 3 - Cross-Feature Combinations (5 cases)

- **T3.CF1: Do Perfil à Proposta**: Altera o perfil de interesse -> seleciona edital descoberto -> cria proposta com base no edital selecionado -> verifica se a proposta herda as categorias corretas.
- **T3.CF2: Fluxo Completo de Submissão**: Move projeto no kanban para "Pronto para Submissão" -> gera proposta -> marca checklist de documentos como completo -> avança projeto para "Submetido".
- **T3.CF3: Do Kanban ao Pós-Aprovação**: Move card no kanban para "Aprovado" -> acessa o módulo Pós-Aprovação -> verifica se o projeto aparece listado com as rubricas de orçamento configuradas anteriormente na proposta.
- **T3.CF4: Atualização de Prazos Bidirecional**: Altera data de cronograma no editor de propostas -> verifica se o prazo correspondente é atualizado no card do kanban e no calendário de prazos.
- **T3.CF5: Orçamento vs Realizado Pós-Aprovação**: Modifica o orçamento da proposta na fase "Em Elaboração" -> aprova o edital -> adiciona despesas no Pós-Aprovação -> valida se o comparativo planejado vs. real calcula o saldo usando o valor da proposta atualizada.

---

### Tier 4 - Real-World Application Scenarios (5 cases)

- **T4.APP1: Ciclo de Vida do Edital de Cultura (Lei Rouanet)**:
  1. Usuário configura perfil com interesse em "Cultura".
  2. Identifica o edital da "Lei Rouanet" na descoberta (compatibilidade alta).
  3. Inicia proposta e usa "Gerar com IA" para as seções de justificativa e contrapartidas.
  4. Organiza o cronograma de produção cultural de 6 meses.
  5. Move o projeto para "Pronto para Submissão".
  6. Efetua a aprovação fictícia do edital, verifica o módulo de pós-aprovação, exporta o relatório.
- **T4.APP2: Ciclo de Vida do Edital de Inovação (FINEP)**:
  1. Configura perfil de inovação tecnológica e orçamento de R$ 500.000.
  2. Filtra editais da FINEP e localiza edital correspondente.
  3. Cria proposta, monta planilha orçamentária com rubricas de RH, Equipamentos e Consumíveis.
  4. Gerencia checklist de documentos obrigatórios (certidões negativas, projeto executivo).
  5. Acompanha no kanban até a aprovação.
  6. No Pós-Aprovação, simula desembolso e valida controle de gastos por rubrica.
- **T4.APP3: Lançamento Multiprojeto Concorrente**:
  1. Cria três projetos paralelos (FAPESP, CNPq e SEBRAE).
  2. Associa diferentes agentes de IA a cada um.
  3. Acompanha os prazos consolidados no calendário.
  4. Valida se os dados de cada proposta e cronograma permanecem isolados e íntegros.
- **T4.APP4: Auditoria e Ajuste de Contas pós-reprovação**:
  1. Cria projeto-edital de exemplo.
  2. Preenche cronograma e orçamento.
  3. Move projeto para "Reprovado".
  4. Valida se o módulo Pós-Aprovação fica inacessível para este projeto.
  5. Garante que os relatórios de prestação de contas não são gerados para projetos não aprovados.
- **T4.APP5: Simulação de Alta Sobrecarga e Limpeza**:
  1. Simula entrada de dados complexa em massa (15+ editais).
  2. Efetua buscas rápidas e filtros cruzados.
  3. Cria e exclui propostas.
  4. Garante estabilidade da aplicação em tempo de execução sem travamento de renderização e vazamento de dados.
