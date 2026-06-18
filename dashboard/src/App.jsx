import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import EditaisModule from './components/EditaisModule';
import PropostasModule from './components/PropostasModule';
import ProjetosModule from './components/ProjetosModule';
import PosAprovacaoModule from './components/PosAprovacaoModule';
import { flushSync } from 'react-dom';

import { 
  initialEditais, 
  initialUserProfile, 
  initialProposals, 
  initialProjects 
} from './data/editaisMockData';

import './App.css';

// Persistência local: o estado do app é salvo no navegador para sobreviver a
// refresh/fechamento. Só vale no modo normal (sem appBridge de teste).
const STORAGE_KEY = 'nexus-editais-state-v1';

function loadPersisted() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // JSON inválido / storage indisponível -> ignora
  }
}

export default function App({ appBridge }) {
  // Estado persistido (carregado uma vez, apenas fora do modo bridge).
  const persisted = appBridge ? null : loadPersisted();

  // Central States
  const [activeTab, setActiveTab] = useState(appBridge ? appBridge.state.activeModule : (persisted?.activeTab ?? 'editais'));
  const [editais, setEditais] = useState(appBridge ? appBridge.state.editais : (persisted?.editais ?? initialEditais));
  const [userProfile, setUserProfile] = useState(appBridge ? appBridge.state.userProfile : (persisted?.userProfile ?? initialUserProfile));
  const [proposals, setProposals] = useState(appBridge ? appBridge.state.proposals : (persisted?.proposals ?? initialProposals));
  const [projects, setProjects] = useState(appBridge ? appBridge.state.projects : (persisted?.projects ?? initialProjects));

  // Additional fields for testing/sync bridge
  const [viewportWidth, setViewportWidth] = useState(appBridge ? appBridge.state.viewportWidth : 1024);
  const [activeWizardStep, setActiveWizardStep] = useState(appBridge ? appBridge.state.activeWizardStep : 'objetivos');
  const [activeProposalEditalId, setActiveProposalEditalId] = useState(appBridge ? appBridge.state.activeProposalEditalId : 'e2');
  const [posAprovacao, setPosAprovacao] = useState(appBridge ? appBridge.state.posAprovacao : (persisted?.posAprovacao ?? {}));
  const [currentFilterCategory, setCurrentFilterCategory] = useState(appBridge ? appBridge.state.currentFilterCategory : 'todas');
  const [currentSearchTerm, setCurrentSearchTerm] = useState(appBridge ? appBridge.state.currentSearchTerm : '');
  const [errors, setErrors] = useState(appBridge ? appBridge.state.errors : {});

  // Register state synchronization callback on the testing bridge
  useEffect(() => {
    if (appBridge) {
      appBridge.updateReactState = (newState) => {
        // Use flushSync to force synchronous updates to the JSDOM document
        flushSync(() => {
          setActiveTab(newState.activeModule);
          setEditais([...newState.editais]);
          setUserProfile({ ...newState.userProfile });
          setProposals({ ...newState.proposals });
          setProjects([...newState.projects]);
          setViewportWidth(newState.viewportWidth);
          setActiveWizardStep(newState.activeWizardStep);
          setActiveProposalEditalId(newState.activeProposalEditalId);
          setPosAprovacao({ ...newState.posAprovacao });
          setCurrentFilterCategory(newState.currentFilterCategory);
          setCurrentSearchTerm(newState.currentSearchTerm);
          setErrors({ ...newState.errors });
        });
      };
    }
  }, [appBridge]);

  // Salva o estado no localStorage sempre que algo relevante muda (modo normal).
  useEffect(() => {
    if (appBridge || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        activeTab, editais, userProfile, proposals, projects, posAprovacao,
      }));
    } catch {
      // quota excedida / erro de serialização -> ignora silenciosamente
    }
  }, [appBridge, activeTab, editais, userProfile, proposals, projects, posAprovacao]);

  const renderModuleContent = () => {
    switch (activeTab) {
      case 'editais':
        return (
          <EditaisModule 
            editais={editais} 
            setEditais={setEditais} 
            userProfile={userProfile} 
            setUserProfile={setUserProfile}
            currentFilterCategory={currentFilterCategory}
            setCurrentFilterCategory={setCurrentFilterCategory}
            currentSearchTerm={currentSearchTerm}
            setCurrentSearchTerm={setCurrentSearchTerm}
            activeProposalEditalId={activeProposalEditalId}
            setActiveProposalEditalId={setActiveProposalEditalId}
            setActiveTab={setActiveTab}
            appBridge={appBridge}
          />
        );
      case 'propostas':
        return (
          <PropostasModule 
            proposals={proposals} 
            setProposals={setProposals} 
            editais={editais}
            activeProposalEditalId={activeProposalEditalId}
            setActiveProposalEditalId={setActiveProposalEditalId}
            activeWizardStep={activeWizardStep}
            setActiveWizardStep={setActiveWizardStep}
            errors={errors}
            setErrors={setErrors}
            appBridge={appBridge}
          />
        );
      case 'kanban':
        return (
          <ProjetosModule 
            projects={projects} 
            setProjects={setProjects}
            appBridge={appBridge}
          />
        );
      case 'pos-aprovacao':
        return (
          <PosAprovacaoModule 
            projects={projects} 
            setProjects={setProjects}
            proposals={proposals}
            posAprovacao={posAprovacao}
            setPosAprovacao={setPosAprovacao}
            appBridge={appBridge}
          />
        );
      default:
        return (
          <EditaisModule 
            editais={editais} 
            setEditais={setEditais} 
            userProfile={userProfile} 
            setUserProfile={setUserProfile}
            currentFilterCategory={currentFilterCategory}
            setCurrentFilterCategory={setCurrentFilterCategory}
            currentSearchTerm={currentSearchTerm}
            setCurrentSearchTerm={setCurrentSearchTerm}
            activeProposalEditalId={activeProposalEditalId}
            setActiveProposalEditalId={setActiveProposalEditalId}
            setActiveTab={setActiveTab}
            appBridge={appBridge}
          />
        );
    }
  };

  const handleTabChange = (tabId) => {
    if (appBridge) {
      appBridge.state.activeModule = tabId;
      appBridge.render();
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <Navbar 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
      systemStats={{
        activeProjects: projects.length,
        profileCompleted: !!userProfile.area
      }}
    >
      {renderModuleContent()}
    </Navbar>
  );
}
