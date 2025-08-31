import React from 'react';

interface TaskCounterProps {
  completedTasks: number;
  totalTasks: number;
}

const TaskCounter: React.FC<TaskCounterProps> = ({
  completedTasks,
  totalTasks,
}) => {
  const percentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="task-counter bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-3">
        Progression des tâches
      </h3>
      <div className="progress-container w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className="progress-bar h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-gray-300 font-medium">
        <span className="text-cyan-400 font-bold">{completedTasks}</span> tâches
        terminées sur
        <span className="text-cyan-400 font-bold"> {totalTasks}</span>
        <span className="text-gray-400 text-sm ml-2">({percentage}%)</span>
      </p>
    </div>
  );
};

export default TaskCounter;
