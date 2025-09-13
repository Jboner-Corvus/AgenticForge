#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Function to read and parse YAML file
function readYamlFile(filePath) {
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContents);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

// Function to generate a simple HTML report
function generateHtmlReport(categories) {
  let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Rapport des tâches AgenticForge</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        h2 { color: #666; border-bottom: 1px solid #eee; }
        .category { margin-bottom: 30px; }
        .task { margin: 5px 0; padding: 5px; background: #f5f5f5; }
        .completed { background: #d4edda; }
        .pending { background: #f8d7da; }
        .stats { font-weight: bold; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Rapport des tâches AgenticForge</h1>
`;

  categories.forEach((category) => {
    html += `
    <div class="category">
        <h2>${category.category || category.name}</h2>
        <div class="stats">
            Total: ${category.tasks ? Object.values(category.tasks).flat().length : 'N/A'} | 
            Complétées: ${
              category.tasks
                ? Object.values(category.tasks)
                    .flat()
                    .filter((t) => t.status === 'completed').length
                : 'N/A'
            }
        </div>
`;

    if (category.tasks) {
      Object.entries(category.tasks).forEach(([subcategory, tasks]) => {
        html += `<h3>${subcategory}</h3>`;
        tasks.forEach((task) => {
          html += `<div class="task ${task.status}">[${task.id}] ${task.description} (${task.status})</div>`;
        });
      });
    }

    html += `</div>`;
  });

  html += `
</body>
</html>`;

  return html;
}

// Main function
function main() {
  const yamlDir = path.join(__dirname);
  const yamlFiles = fs
    .readdirSync(yamlDir)
    .filter((file) => file.endsWith('.yaml') && file !== 'summary.yaml');

  const categories = [];

  yamlFiles.forEach((file) => {
    const filePath = path.join(yamlDir, file);
    const data = readYamlFile(filePath);
    if (data) {
      categories.push(data);
    }
  });

  // Generate HTML report
  const htmlReport = generateHtmlReport(categories);
  fs.writeFileSync(path.join(__dirname, 'report.html'), htmlReport);
  console.log('Rapport HTML généré: report.html');

  // Generate simple console report
  console.log('\n=== Rapport des tâches ===');
  categories.forEach((category) => {
    if (category.tasks) {
      const totalTasks = Object.values(category.tasks).flat().length;
      const completedTasks = Object.values(category.tasks)
        .flat()
        .filter((t) => t.status === 'completed').length;
      console.log(
        `${category.category}: ${completedTasks}/${totalTasks} tâches complétées`,
      );
    }
  });
}

main();
