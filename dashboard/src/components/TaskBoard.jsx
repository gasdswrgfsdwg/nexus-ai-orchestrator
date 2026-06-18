import { useState } from 'react';
import { tasks as initialTasks, agents } from '../data/mockData';
import './TaskBoard.css';

const COLUMNS = [
  { id: 'pending', label: 'Pendente', icon: '◯' },
  { id: 'in_progress', label: 'Em Progresso', icon: '◉' },
  { id: 'review', label: 'Revisão', icon: '◈' },
  { id: 'done', label: 'Concluído', icon: '✔' },
];

const PRIORITY_MAP = {
  high: { label: 'Alta', className: 'badge-danger' },
  medium: { label: 'Méd', className: 'badge-warning' },
  low: { label: 'Baixa', className: 'badge-primary' },
};

function getAgentInfo(agentId) {
  return agents.find(a => a.id === agentId) || { avatar: '?', name: 'Não Atribuído', color: '#666' };
}

function getTimeElapsed(createdAt) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function TaskBoard() {
  const [taskList, setTaskList] = useState(initialTasks);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(taskId);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    setTaskList(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    setDragOverColumn(null);
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="taskboard">
      {COLUMNS.map(col => {
        const columnTasks = taskList.filter(t => t.status === col.id);
        return (
          <div
            key={col.id}
            className={`taskboard-column ${dragOverColumn === col.id ? 'taskboard-column--dragover' : ''}`}
            onDragOver={e => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, col.id)}
          >
            <div className="taskboard-column-header">
              <span className="column-icon">{col.icon}</span>
              <h3 className="column-title">{col.label}</h3>
              <span className="column-count">{columnTasks.length}</span>
            </div>

            <div className="taskboard-column-body">
              {columnTasks.map(task => {
                const agent = getAgentInfo(task.assignedAgent);
                const priority = PRIORITY_MAP[task.priority];
                return (
                  <div
                    key={task.id}
                    className={`task-card glass ${draggingId === task.id ? 'task-card--dragging' : ''}`}
                    draggable
                    onDragStart={e => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="task-card-header">
                      <span className={`badge ${priority.className}`}>{priority.label}</span>
                      <span className="task-time">{getTimeElapsed(task.createdAt)}</span>
                    </div>

                    <h4 className="task-title">{task.title}</h4>
                    <p className="task-description">{task.description}</p>

                    <div className="task-card-footer">
                      <div className="task-agent" title={agent.name}>
                        <span
                          className="task-agent-avatar"
                          style={{ borderColor: agent.color }}
                        >
                          {agent.avatar}
                        </span>
                        <span className="task-agent-name">{agent.name}</span>
                      </div>

                      <div className="task-tags">
                        {task.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="task-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {columnTasks.length === 0 && (
                <div className="taskboard-empty">
                  <span className="taskboard-empty-icon">◇</span>
                  <span>Sem tarefas</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
