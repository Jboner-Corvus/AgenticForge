#!/usr/bin/env python3

import yaml
import os
import json

def read_yaml_file(file_path):
    """Read and parse a YAML file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return yaml.safe_load(file)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None

def generate_progress_report():
    """Generate a progress report from all YAML files."""
    yaml_dir = os.path.dirname(os.path.abspath(__file__))
    yaml_files = [f for f in os.listdir(yaml_dir) if f.endswith('.yaml') and f != 'summary.yaml']
    
    total_tasks = 0
    completed_tasks = 0
    categories = []
    
    for file in yaml_files:
        file_path = os.path.join(yaml_dir, file)
        data = read_yaml_file(file_path)
        
        if data and 'tasks' in data:
            category_info = {
                'name': data.get('category', file.replace('.yaml', '')),
                'total': 0,
                'completed': 0,
                'subcategories': []
            }
            
            for subcategory, tasks in data['tasks'].items():
                sub_total = len(tasks)
                sub_completed = sum(1 for task in tasks if task.get('status') == 'completed')
                
                category_info['total'] += sub_total
                category_info['completed'] += sub_completed
                category_info['subcategories'].append({
                    'name': subcategory,
                    'total': sub_total,
                    'completed': sub_completed
                })
                
                total_tasks += sub_total
                completed_tasks += sub_completed
            
            categories.append(category_info)
    
    # Print summary
    print("=== Rapport de progression des tâches AgenticForge ===")
    print(f"Total des tâches: {total_tasks}")
    print(f"Tâches complétées: {completed_tasks}")
    print(f"Pourcentage: {completed_tasks/total_tasks*100:.1f}%\n")
    
    print("Détail par catégorie:")
    for category in categories:
        print(f"\n{category['name']}: {category['completed']}/{category['total']} "
              f"({category['completed']/category['total']*100:.1f}%)")
        for subcat in category['subcategories']:
            if subcat['total'] > 0:
                print(f"  {subcat['name']}: {subcat['completed']}/{subcat['total']} "
                      f"({subcat['completed']/subcat['total']*100:.1f}%)")
    
    # Save to JSON file
    report_data = {
        'summary': {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'completion_percentage': round(completed_tasks/total_tasks*100, 2)
        },
        'categories': categories
    }
    
    with open(os.path.join(yaml_dir, 'progress_report.json'), 'w', encoding='utf-8') as f:
        json.dump(report_data, f, indent=2, ensure_ascii=False)
    
    print("\nRapport détaillé sauvegardé dans: progress_report.json")

if __name__ == "__main__":
    generate_progress_report()