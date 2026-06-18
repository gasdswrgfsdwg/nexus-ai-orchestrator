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
import './modules.css';

const WORKSPACE_STORAGE_KEY = 'nexus-editais-workspace-v1';
const VALID_TABS = ['editais', 'propostas', 'kanban', 'pos-aprovacao'];
const VALID_WIZARD_STEPS = ['resumo', 'objetivos', 'justificativa', 'metodologia', 'metas', 'equipe', 'cronograma', 'orcamento'];

const getRequestedValue = (parameter, allowedValues) => {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get(parameter);
  return allowedValues.includes(value) ? value : null;
};

const canUseLocalStorage = () => (
  typeof window !== 'undefined'
  && !window.navigator?.userAgent?.toLowerCase().includes('jsdom')
  && typeof window.localStorage !== 'undefined'
);

const loadStoredWorkspace = () => {
  if (!canUseLocalStorage()) return null;
  try {
    const stored = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export default function App({ appBridge }) {
  const storedWorkspace = React.useMemo(
    () => (appBridge ? null : loadStoredWorkspace()),
    [appBridge],
  );

  // Central States
  const [activeTab, setActiveTab] = useState(appBridge ? appBridge.state.activeModule : (getRequestedValue('tab', VALID_TABS) || storedWorkspace?.activeTab || 'editais'));
  const [editais, setEditais] = useState(appBridge ? appBridge.state.editais : (storedWorkspace?.editais || initialEditais));
  const [userProfile, setUserProfile] = useState(appBridge ? appBridge.state.userProfile : (storedWorkspace?.userProfile || initialUserProfile));
  const [proposals, setProposals] = useState(appBridge ? appBridge.state.proposals : (storedWorkspace?.proposals || initialProposals));
  const [projects, setProjects] = useState(appBridge ? appBridge.state.projects : (storedWorkspace?.projects || initialProjects));

  // Additional fields for testing/sync bridge
  const [viewportWidth, setViewportWidth] = useState(appBridge ? appBridge.state.viewportWidth : 1024);
  const [activeWizardStep, setActiveWizardStep] = useState(appBridge ? appBridge.state.activeWizardStep : (getRequestedValue('step', VALID_WIZARD_STEPS) || storedWorkspace?.activeWizardStep || 'resumo'));
  const [activeProposalEditalId, setActiveProposalEditalId] = useState(appBridge ? appBridge.state.activeProposalEditalId : (storedWorkspace?.activeProposalEditalId || 'e2'));
  const [posAprovacao, setPosAprovacao] = useState(appBridge ? appBridge.state.posAprovacao : (storedWorkspace?.posAprovacao || {}));
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

  useEffect(() => {
    if (appBridge || !canUseLocalStorage()) return;
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify({
      activeTab,
      editais,
      userProfile,
      proposals,
      projects,
      activeWizardStep,
      activeProposalEditalId,
      posAprovacao,
    }));
  }, [
    appBridge,
    activeTab,
    editais,
    userProfile,
    proposals,
    projects,
    activeWizardStep,
    activeProposalEditalId,
    posAprovacao,
  ]);

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
