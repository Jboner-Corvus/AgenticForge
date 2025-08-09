#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const program = new Command();

// Fichier pour stocker les tâches
const tasksFile = path.join(process.cwd(), 'tasks.json');

// Fonction pour lire les tâches depuis le fichier
function readTasks() {
  try {
    const data = fs.readFileSync(tasksFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Fonction pour écrire les tâches dans le fichier
function writeTasks(tasks) {
  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
}

program
  .name('task')
  .description('CLI to manage tasks')
  .version('1.0.0');

program
  .command('add')
  .description('Add a new task')
  .argument('<task>', 'task description')
  .action((task) => {
    const tasks = readTasks();
    tasks.push({
      id: tasks.length + 1,
      description: task,
      completed: false,
      createdAt: new Date().toISOString()
    });
    writeTasks(tasks);
    console.log(`Task added: ${task}`);
  });

program
  .command('list')
  .description('List all tasks')
  .action(() => {
    const tasks = readTasks();
    if (tasks.length === 0) {
      console.log('No tasks found.');
      return;
    }
    
    console.log('Tasks:');
    tasks.forEach(task => {
      const status = task.completed ? '[x]' : '[ ]';
      console.log(`${status} ${task.id}. ${task.description}`);
    });
  });

program
  .command('complete')
  .description('Mark a task as completed')
  .argument('<id>', 'task id')
  .action((id) => {
    const tasks = readTasks();
    const taskId = parseInt(id);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      console.log(`Task with id ${id} not found.`);
      return;
    }
    
    task.completed = true;
    writeTasks(tasks);
    console.log(`Task ${id} marked as completed.`);
  });

program.parse();