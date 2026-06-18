import React, { useState } from 'react';
import {
  BadgeCheck,
  Columns3,
  FilePenLine,
  PanelLeftClose,
  PanelLeftOpen,
  Radar,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'editais', label: 'Descoberta', mobileLabel: 'Descoberta', icon: Radar },
  { id: 'propostas', label: 'Propostas', mobileLabel: 'Dossiês', icon: FilePenLine },
  { id: 'kanban', label: 'Submissões', mobileLabel: 'Submissões', icon: Columns3 },
  { id: 'pos-aprovacao', label: 'Pós-Aprovação', mobileLabel: 'Aprovados', icon: BadgeCheck },
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
      case 'propostas': return 'Dossiê e Escrita do Projeto';
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
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Sidebar Nav Buttons */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`nav-item ${activeTab === item.id ? 'nav-item--active' : ''}`}
                onClick={() => handleTabChange(item.id)}
                title={item.label}
              >
                <span className="nav-icon"><Icon size={19} strokeWidth={1.9} /></span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
                {activeTab === item.id && <span className="nav-indicator"></span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with system stats */}
        {!isCollapsed && (
          <div className="sidebar-footer">
            <div className="system-status glass">
              <div className="status-row">
                <span className="status-dot status-dot--online"></span>
                <span className="status-label">Painel online</span>
              </div>
              <div className="status-details">
                {systemStats ? (
                  <div style={{ fontSize: '0.8rem', marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Projetos Ativos: {systemStats.activeProjects}</span>
                    <span>Perfil: {systemStats.profileCompleted ? 'Preenchido' : 'Incompleto'}</span>
                  </div>
                ) : (
                  <span>Dados locais</span>
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
              <span className="live-text">ONLINE</span>
            </div>
          </div>
        </header>

        {/* Dynamic active tab page render area */}
        <div className="content-area">
          {children}
        </div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`mobile-bottom-item ${activeTab === item.id ? 'mobile-bottom-item--active' : ''}`}
              onClick={() => handleTabChange(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
            >
              <Icon className="mobile-bottom-icon" size={20} strokeWidth={1.9} />
              <span className="mobile-bottom-label">{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
