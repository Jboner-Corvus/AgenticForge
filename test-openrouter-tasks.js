import { getLlmProvider } from './packages/core/dist/chunk-LHUCLKLS.js';
import { getConfig } from './packages/core/dist/chunk-7WLI2CKS.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

class TaskRunner {
  constructor() {
    this.provider = null;
    this.tasks = [];
    this.results = [];
    this.currentTaskIndex = 0;
  }

  async initialize() {
    console.log('🚀 Initializing OpenRouter Task Runner...');

    try {
      // Get configuration
      const config = getConfig();
      console.log('📋 Configuration loaded successfully');

      // Get the OpenRouter provider
      this.provider = getLlmProvider('openrouter-sky');
      console.log('🔧 OpenRouter provider initialized successfully');

      // Load tasks from taches.md
      await this.loadTasks();
      console.log(`📝 Loaded ${this.tasks.length} tasks from taches.md`);

    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  async loadTasks() {
    try {
      const content = fs.readFileSync('taches.md', 'utf8');
      const lines = content.split('\n');

      let currentCategory = '';
      let taskCounter = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect category headers
        if (line.startsWith('### ') && !line.includes('[')) {
          currentCategory = line.replace('### ', '').trim();
          continue;
        }

        // Detect task lines with checkboxes
        if (line.startsWith('- [ ] ') || line.startsWith('- [x] ')) {
          const isCompleted = line.startsWith('- [x] ');
          const taskDescription = line.replace(/^-\s*\[x?\]\s*/, '').trim();

          // Extract task number if present
          const taskMatch = taskDescription.match(/^(\d+)\.\s*(.+)/);
          let taskNumber = ++taskCounter;
          let description = taskDescription;

          if (taskMatch) {
            taskNumber = parseInt(taskMatch[1]);
            description = taskMatch[2];
          }

          this.tasks.push({
            id: taskNumber,
            description: description,
            category: currentCategory,
            completed: isCompleted,
            lineNumber: i + 1
          });
        }
      }

      console.log(`📊 Task categories found: ${[...new Set(this.tasks.map(t => t.category))].join(', ')}`);

    } catch (error) {
      console.error('❌ Failed to load tasks:', error.message);
      throw error;
    }
  }

  async executeTask(task) {
    console.log(`\n🎯 Executing Task ${task.id}: ${task.description}`);
    console.log(`📂 Category: ${task.category}`);

    const startTime = Date.now();

    try {
      // Create a prompt for the OpenRouter provider to execute this task
      const prompt = `Please execute the following task as an AI assistant:

Task: ${task.description}
Category: ${task.category}
Task ID: ${task.id}

Please perform this task step by step and provide a detailed response about what you accomplished. If this task involves creating files, writing code, or performing any actions, please do so and explain your process.

Remember that you have access to various tools and capabilities. Use them appropriately to complete this task.`;

      const messages = [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ];

      console.log('⏳ Sending request to OpenRouter...');

      const response = await this.provider.getLlmResponse(
        messages,
        'You are a helpful AI assistant with access to various tools and capabilities. Execute tasks efficiently and provide detailed feedback.',
        undefined, // Use API key from config
        undefined // Use default model
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`✅ Task ${task.id} completed successfully in ${duration}ms`);
      console.log(`📝 Response length: ${response.length} characters`);

      // Store result
      this.results.push({
        taskId: task.id,
        task: task.description,
        category: task.category,
        success: true,
        duration: duration,
        response: response,
        timestamp: new Date().toISOString()
      });

      return { success: true, response, duration };

    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.error(`❌ Task ${task.id} failed after ${duration}ms:`);
      console.error('Error:', error.message);

      // Store failed result
      this.results.push({
        taskId: task.id,
        task: task.description,
        category: task.category,
        success: false,
        duration: duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return { success: false, error: error.message, duration };
    }
  }

  async runTasks(startIndex = 0, count = 5) {
    console.log(`\n🚀 Starting task execution from index ${startIndex}, running ${count} tasks...`);

    const endIndex = Math.min(startIndex + count, this.tasks.length);
    let successCount = 0;
    let failCount = 0;

    for (let i = startIndex; i < endIndex; i++) {
      const task = this.tasks[i];

      if (task.completed) {
        console.log(`⏭️  Skipping completed task ${task.id}: ${task.description}`);
        continue;
      }

      const result = await this.executeTask(task);

      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }

      // Add a small delay between tasks to avoid rate limiting
      if (i < endIndex - 1) {
        console.log('⏱️  Waiting 2 seconds before next task...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n📊 Execution Summary:`);
    console.log(`✅ Successful tasks: ${successCount}`);
    console.log(`❌ Failed tasks: ${failCount}`);
    console.log(`📈 Success rate: ${((successCount / (successCount + failCount)) * 100).toFixed(1)}%`);

    return { successCount, failCount };
  }

  async runCategory(categoryName, maxTasks = 10) {
    console.log(`\n🎯 Running tasks for category: ${categoryName}`);

    const categoryTasks = this.tasks.filter(task =>
      task.category.toLowerCase().includes(categoryName.toLowerCase()) && !task.completed
    );

    if (categoryTasks.length === 0) {
      console.log(`❌ No uncompleted tasks found in category: ${categoryName}`);
      return { successCount: 0, failCount: 0 };
    }

    console.log(`📝 Found ${categoryTasks.length} tasks in category`);

    const tasksToRun = categoryTasks.slice(0, maxTasks);
    console.log(`🎬 Executing ${tasksToRun.length} tasks...`);

    let successCount = 0;
    let failCount = 0;

    for (const task of tasksToRun) {
      const result = await this.executeTask(task);

      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }

      // Delay between tasks
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n📊 Category ${categoryName} Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);

    return { successCount, failCount };
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `task-results-${timestamp}.json`;

    const summary = {
      totalTasks: this.tasks.length,
      executedTasks: this.results.length,
      successfulTasks: this.results.filter(r => r.success).length,
      failedTasks: this.results.filter(r => !r.success).length,
      results: this.results
    };

    fs.writeFileSync(filename, JSON.stringify(summary, null, 2));
    console.log(`💾 Results saved to ${filename}`);
  }

  showStats() {
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    console.log('\n📊 Task Statistics:');
    console.log(`📝 Total tasks: ${totalTasks}`);
    console.log(`✅ Completed: ${completedTasks}`);
    console.log(`⏳ Pending: ${pendingTasks}`);
    console.log(`📈 Completion rate: ${((completedTasks / totalTasks) * 100).toFixed(1)}%`);

    // Show category breakdown
    const categories = {};
    this.tasks.forEach(task => {
      categories[task.category] = (categories[task.category] || 0) + 1;
    });

    console.log('\n📂 Tasks by category:');
    Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} tasks`);
      });
  }
}

// Main execution
async function main() {
  const runner = new TaskRunner();

  try {
    await runner.initialize();
    runner.showStats();

    // Ask user what to do
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.log('\n🔍 Usage:');
      console.log('  node test-openrouter-tasks.js stats          # Show task statistics');
      console.log('  node test-openrouter-tasks.js run <start> <count>  # Run tasks from index');
      console.log('  node test-openrouter-tasks.js category <name> <max> # Run tasks from category');
      console.log('  node test-openrouter-tasks.js test <taskId>        # Test specific task');
      return;
    }

    const command = args[0];

    switch (command) {
      case 'stats':
        // Already shown above
        break;

      case 'run':
        const startIndex = parseInt(args[1]) || 0;
        const count = parseInt(args[2]) || 5;
        await runner.runTasks(startIndex, count);
        runner.saveResults();
        break;

      case 'category':
        const categoryName = args[1];
        const maxTasks = parseInt(args[2]) || 10;
        if (!categoryName) {
          console.log('❌ Please specify a category name');
          return;
        }
        await runner.runCategory(categoryName, maxTasks);
        runner.saveResults();
        break;

      case 'test':
        const taskId = parseInt(args[1]);
        if (!taskId) {
          console.log('❌ Please specify a task ID');
          return;
        }
        const task = runner.tasks.find(t => t.id === taskId);
        if (!task) {
          console.log(`❌ Task ${taskId} not found`);
          return;
        }
        await runner.executeTask(task);
        runner.saveResults();
        break;

      default:
        console.log(`❌ Unknown command: ${command}`);
    }

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);