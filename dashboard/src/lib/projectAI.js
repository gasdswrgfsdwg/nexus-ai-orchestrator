import { isSupabaseConfigured, supabase } from './supabaseClient';

export const AI_WRITABLE_SECTIONS = ['objetivos', 'justificativa', 'metodologia'];

const LOCAL_DRAFTS = {
  objetivos: 'Texto gerado automaticamente por IA para a seção Objetivos: democratizar o acesso à cultura e à tecnologia, fortalecer agentes locais e ampliar a circulação da produção regional.',
  justificativa: 'Texto gerado automaticamente por IA. Justificativa: o projeto responde à baixa oferta de formação e circulação cultural nos territórios atendidos, conectando repertório local, inclusão digital e geração de oportunidades.',
  metodologia: 'Texto gerado automaticamente por IA para a seção Metodologia: a execução será organizada em diagnóstico, mobilização, oficinas práticas, acompanhamento de produção e mostra pública de resultados.',
};

const cleanText = (value, maxLength = 4000) => String(value ?? '').trim().slice(0, maxLength);

export const getLocalProjectDraft = section => LOCAL_DRAFTS[section] || '';

export const buildProjectAIRequest = ({ section, proposal = {}, edital = {} }) => {
  if (!AI_WRITABLE_SECTIONS.includes(section)) {
    throw new Error('Seção não permitida para geração com IA.');
  }

  return {
    section,
    currentText: cleanText(proposal[section], 12000),
    project: {
      tituloProjeto: cleanText(proposal.tituloProjeto, 240),
      ideiaCentral: cleanText(proposal.ideiaCentral, 3000),
      sinopse: cleanText(proposal.sinopse, 4000),
      areaProjeto: cleanText(proposal.areaProjeto, 120),
      statusProjeto: cleanText(proposal.statusProjeto, 120),
      territorio: cleanText(proposal.territorio, 500),
      publicoAlvo: cleanText(proposal.publicoAlvo, 1500),
      duracaoMeses: Number(proposal.duracaoMeses || 0),
      metas: (proposal.goals || []).slice(0, 12).map(goal => ({
        descricao: cleanText(goal.descricao, 600),
        indicador: cleanText(goal.indicador, 400),
        quantidade: Number(goal.quantidade || 0),
        unidade: cleanText(goal.unidade, 120),
      })),
      cronograma: (proposal.schedule || []).slice(0, 24).map(item => ({
        tarefa: cleanText(item.tarefa, 500),
        inicio: cleanText(item.inicio, 20),
        fim: cleanText(item.fim, 20),
      })),
    },
    edital: {
      titulo: cleanText(edital.titulo, 300),
      orgao: cleanText(edital.orgao, 200),
      categoria: cleanText(edital.categoria, 120),
      prazo: cleanText(edital.prazo, 20),
      valor: Number(edital.valor || 0),
    },
  };
};

const readFunctionError = async (error) => {
  const response = error?.context;
  if (response && typeof response.clone === 'function') {
    try {
      const payload = await response.clone().json();
      if (payload?.error) return payload.error;
    } catch {
      // A mensagem padrao abaixo evita expor detalhes internos do provedor.
    }
  }
  return error?.message || 'Não foi possível gerar o texto agora.';
};

export const generateProjectSection = async ({ section, proposal, edital }) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase não configurado para usar a IA on-line.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error('Entre na conta da nuvem para usar a IA on-line.');
  }

  const { data, error } = await supabase.functions.invoke('generate-project-text', {
    body: buildProjectAIRequest({ section, proposal, edital }),
  });

  if (error) throw new Error(await readFunctionError(error));

  const text = cleanText(data?.text, 20000);
  if (!text) throw new Error('A IA não retornou um texto utilizável.');

  return {
    text,
    model: cleanText(data?.model, 160),
    provider: cleanText(data?.provider, 40),
  };
};
