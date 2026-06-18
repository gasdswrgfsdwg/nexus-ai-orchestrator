import React, { useState } from 'react';

const NAV_ITEMS = [
  { id: 'editais', label: 'Descoberta', icon: '📡' },
  { id: 'propostas', label: 'Propostas', icon: '✍️' },
  { id: 'kanban', label: 'Submissões', icon: '📋' },
  { id: 'pos-aprovacao', label: 'Pós-Aprovação', icon: '🏆' },
];

export default function Navbar({ activeTab, onTabChange, children, systemStats }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false); // Close mobile drawer overlay on navigation
  };

  const getHeaderTitle = (tabId) => {
    switch (tabId) {
      case 'editais': return 'Monitoramento e Descoberta de Editais';
      case 'propostas': return 'Elaboração de Propostas com IA';
      case 'kanban': return 'Gestão de Submissões e Prazos';
      case 'pos-aprovacao': return 'Acompanhamento Pós-Aprovação';
      default: return 'Nexus Editais';
    }
  };

  const activeItem = NAV_ITEMS.find(item => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="app-layout">
      {/* Backdrop overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`sidebar glass-strong ${isMobileMenuOpen ? 'sidebar--open' : ''} ${isCollapsed ? 'sidebar--collapsed' : ''}`}
      >
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <span className="logo-symbol">N</span>
              <div className="logo-ring"></div>
            </div>
            {!isCollapsed && (
              <div className="logo-text">
                <span className="logo-title">NEXUS</span>
                <span className="logo-subtitle">EDITAIS</span>
              </div>
            )}
          </div>
          {/* Desktop collapsible toggle button */}
          <button 
            className="desktop-collapse-btn" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expandir menu" : "Colapsar menu"}
          >
            {isCollapsed ? '⟫' : '⟪'}
          </button>
        </div>

        {/* Sidebar Nav Buttons */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${activeTab === item.id ? 'nav-item--active' : ''}`}
              onClick={() => handleTabChange(item.id)}
            >
              <span className="nav-icon" title={item.label}>{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
              {activeTab === item.id && <span className="nav-indicator"></span>}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer with system stats */}
        {!isCollapsed && (
          <div className="sidebar-footer">
            <div className="system-status glass">
              <div className="status-row">
                <span className="status-dot status-dot--online"></span>
                <span className="status-label">Monitoramento Ativo</span>
              </div>
              <div className="status-details">
                {systemStats ? (
                  <div style={{ fontSize: '0.8rem', marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Projetos Ativos: {systemStats.activeProjects}</span>
                    <span>Perfil: {systemStats.profileCompleted ? 'Preenchido' : 'Incompleto'}</span>
                  </div>
                ) : (
                  <span>Fontes online</span>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className={`main-content ${isCollapsed ? 'main-content--collapsed' : ''}`}>
        <header className="main-header glass">
          <div className="header-left">
            {/* Hamburger menu toggle button for mobile */}
            <button 
              className="mobile-toggle-btn" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Abrir menu lateral"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>

            <h1 className="header-title">{getHeaderTitle(activeTab)}</h1>
            
            {/* Breadcrumbs */}
            <div className="header-breadcrumb">
              <span className="breadcrumb-item">NEXUS</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-item breadcrumb-current">
                {activeItem.label}
              </span>
            </div>
          </div>

          <div className="header-right">
            <div className="header-live-indicator">
              <span className="live-dot"></span>
              <span className="live-text">MONITORANDO</span>
            </div>
          </div>
        </header>

        {/* Dynamic active tab page render area */}
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}
