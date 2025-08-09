import React from 'react';

interface TaskCounterProps {
  completedTasks: number;
  totalTasks: number;
}

const TaskCounter: React.FC<TaskCounterProps> = ({ completedTasks, totalTasks }) => {
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  return (
    <div className="task-counter">
      <h3>Progression des tâches</h3>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
      </div>
      <p>{completedTasks} tâches terminées sur {totalTasks} ({percentage}%)</p>
    </div>
  );
};

export default TaskCounter;