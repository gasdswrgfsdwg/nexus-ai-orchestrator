import React, { useState, useEffect } from 'react';

// Fallback scoring logic moved to module level for reusability
const calculateScoresFallback = (edList, uProf) => {
  const { keywords, area, maxOrcamento } = uProf;
  return edList.map(edital => {
    if (!keywords || keywords.length === 0 || (keywords.length === 1 && keywords[0] === '')) {
      return { ...edital, score: 50 };
    }
    let score = 50;
    if (edital.valor > maxOrcamento) score -= 20;
    else score += 10;
    let matches = 0;
    keywords.forEach(kw => {
      if (kw && (edital.titulo.toLowerCase().includes(kw.toLowerCase()) || 
                 edital.orgao.toLowerCase().includes(kw.toLowerCase()))) {
        matches++;
      }
    });
    score += matches * 15;
    if (area && area !== 'geral' && edital.categoria.toLowerCase() === area.toLowerCase()) {
      score += 20;
    }
    return { ...edital, score: Math.max(0, Math.min(100, score)) };
  });
};

export default function EditaisModule({
  editais,
  setEditais,
  userProfile,
  setUserProfile,
  currentFilterCategory,
  setCurrentFilterCategory,
  currentSearchTerm,
  setCurrentSearchTerm,
  activeProposalEditalId,
  setActiveProposalEditalId,
  setActiveTab,
  appBridge
}) {
  const profile = appBridge ? appBridge.state.userProfile : userProfile;
  const filterCategory = appBridge ? appBridge.state.currentFilterCategory : currentFilterCategory;
  const searchTerm = appBridge ? appBridge.state.currentSearchTerm : currentSearchTerm;
  const list = appBridge ? appBridge.state.editais : editais;

  // Local state for raw keywords input text to prevent typing space deletion bug
  const [keywordsText, setKeywordsText] = useState(profile.keywords ? profile.keywords.join(', ') : '');

  // Keep keywords text in sync with external profile updates
  useEffect(() => {
    if (profile.keywords) {
      const joined = profile.keywords.join(', ');
      const cleanJoined = joined.split(',').map(s => s.trim()).filter(Boolean).join(',');
      const cleanText = keywordsText.split(',').map(s => s.trim()).filter(Boolean).join(',');
      if (cleanJoined !== cleanText) {
        setKeywordsText(joined);
      }
    }
  }, [profile.keywords]);

  const handleKeywordsChange = (e) => {
    const rawVal = e.target.value;
    setKeywordsText(rawVal);
    
    const val = rawVal.split(',').map(s => s.trim());
    if (appBridge) {
      appBridge.state.userProfile.keywords = val;
      appBridge.recalculateScores();
    } else {
      const nextProfile = { ...profile, keywords: val };
      setUserProfile(nextProfile);
      setEditais(calculateScoresFallback(list, nextProfile));
    }
  };

  const handleBudgetChange = (e) => {
    const val = Number(e.target.value);
    if (appBridge) {
      appBridge.state.userProfile.maxOrcamento = val;
      appBridge.recalculateScores();
    } else {
      const nextProfile = { ...profile, maxOrcamento: val };
      setUserProfile(nextProfile);
      setEditais(calculateScoresFallback(list, nextProfile));
    }
  };

  const handleAreaChange = (e) => {
    const val = e.target.value;
    if (appBridge) {
      appBridge.state.userProfile.area = val;
      appBridge.recalculateScores();
    } else {
      const nextProfile = { ...profile, area: val };
      setUserProfile(nextProfile);
      setEditais(calculateScoresFallback(list, nextProfile));
    }
  };

  const handleSaveProfileClick = () => {
    if (appBridge) {
      appBridge.recalculateScores();
    } else {
      setEditais(calculateScoresFallback(list, profile));
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    if (appBridge) {
      appBridge.state.currentSearchTerm = val;
      appBridge.render();
    } else {
      setCurrentSearchTerm(val);
    }
  };

  const handleCategoryClick = (cat) => {
    if (appBridge) {
      appBridge.state.currentFilterCategory = cat;
      appBridge.render();
    } else {
      setCurrentFilterCategory(cat);
    }
  };

  const handleCreateProposal = (editalId) => {
    if (appBridge) {
      if (!appBridge.state.proposals[editalId]) {
        appBridge.state.proposals[editalId] = {
          editalId,
          objetivos: '',
          justificativa: '',
          metodologia: '',
          budget: [],
          schedule: []
        };
      }
      appBridge.state.activeProposalEditalId = editalId;
      appBridge.state.activeModule = 'propostas';
      appBridge.render();
    } else {
      setActiveProposalEditalId(editalId);
      setActiveTab('propostas');
    }
  };

  // Filter logic
  let filtered = list;
  if (filterCategory !== 'todas') {
    filtered = filtered.filter(e => e.categoria.toLowerCase() === filterCategory.toLowerCase());
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(e => e.titulo.toLowerCase().includes(term) || e.orgao.toLowerCase().includes(term));
  }

  return (
    <div className="module-editais">
      <section className="profile-settings glass">
        <h2>Configuração de Perfil</h2>
        <div className="form-group">
          <label htmlFor="profile-keywords">Palavras-chave (separadas por vírgula):</label>
          <input
            type="text"
            id="profile-keywords"
            value={keywordsText}
            onChange={handleKeywordsChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="profile-budget">Orçamento Máximo Desejado (R$):</label>
          <input
            type="number"
            id="profile-budget"
            value={profile.maxOrcamento || 0}
            onChange={handleBudgetChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="profile-area">Área Temática Principal:</label>
          <select id="profile-area" value={profile.area || 'geral'} onChange={handleAreaChange}>
            <option value="geral">Geral</option>
            <option value="inovação">Inovação</option>
            <option value="cultura">Cultura</option>
            <option value="social">Social</option>
          </select>
        </div>
        <button id="save-profile" onClick={handleSaveProfileClick}>Salvar Perfil</button>
      </section>

      <section className="editais-discovery">
        <div className="discovery-filters">
          <div className="search-bar">
            <input
              type="text"
              id="editais-search"
              placeholder="Buscar edital ou órgão..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="category-filters">
            {['todas', 'inovação', 'cultura', 'social'].map(cat => (
              <button
                key={cat}
                className={`filter-category ${filterCategory === cat ? 'active' : ''}`}
                data-category={cat}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="editais-list">
          {filtered.length > 0 ? (
            filtered.map(e => (
              <div key={e.id} className={`edital-card ${e.status === 'fechado' ? 'status-fechado' : ''}`} data-id={e.id}>
                <div className="edital-header">
                  <h3 className="edital-titulo">{e.titulo}</h3>
                  <span className="edital-status-badge">{e.status === 'fechado' ? 'Fechado' : 'Aberto'}</span>
                </div>
                <div className="edital-details">
                  <p><strong>Órgão:</strong> <span className="edital-orgao">{e.orgao}</span></p>
                  <p><strong>Prazo:</strong> <span className="edital-prazo">{e.prazo}</span></p>
                  <p><strong>Valor:</strong> <span className="edital-valor">R$ {e.valor ? e.valor.toLocaleString('pt-BR') : '0'}</span></p>
                  <p><strong>Categoria:</strong> <span className="edital-categoria">{e.categoria}</span></p>
                </div>
                <div className="edital-footer">
                  <span className="compatibility-score">Compatibilidade: {e.score}%</span>
                  {e.status !== 'fechado' && (
                    <button className="btn-create-proposal" data-id={e.id} onClick={() => handleCreateProposal(e.id)}>
                      Criar Proposta
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">Nenhum edital compatível</div>
          )}
        </div>
      </section>
    </div>
  );
}
