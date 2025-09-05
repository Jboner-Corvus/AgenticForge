#!/usr/bin/env python3
import psutil
import time
import logging
import json

# Configure logging
logging.basicConfig(filename='monitoring.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Configuration for thresholds (can be loaded from a config file later)
CONFIG = {
    'cpu_threshold': 80,  # percentage
    'ram_threshold': 80,  # percentage
    'disk_threshold': 90, # percentage
    'alert_cooldown': 300 # seconds
}

alert_status = {
    'cpu': {'triggered': False, 'last_alert_time': 0},
    'ram': {'triggered': False, 'last_alert_time': 0},
    'disk': {'triggered': False, 'last_alert_time': 0}
}

def send_alert(metric, value, threshold, level='warning'):
    current_time = time.time()
    if current_time - alert_status[metric]['last_alert_time'] < CONFIG['alert_cooldown'] and alert_status[metric]['triggered']:
        return # Cooldown period

    message = f"ALERT: {metric.upper()} usage is {value}% which exceeds the threshold of {threshold}%. Level: {level}"
    print(message) # Simulated Slack/Email alert
    logging.warning(message)
    alert_status[metric]['triggered'] = True
    alert_status[metric]['last_alert_time'] = current_time

def clear_alert(metric):
    if alert_status[metric]['triggered']:
        message = f"INFO: {metric.upper()} usage has returned to normal."
        print(message)
        logging.info(message)
        alert_status[metric]['triggered'] = False

def get_metrics():
    cpu_percent = psutil.cpu_percent(interval=1)
    ram_percent = psutil.virtual_memory().percent
    disk_percent = psutil.disk_usage('/').percent

    metrics = {
        'cpu': cpu_percent,
        'ram': ram_percent,
        'disk': disk_percent,
        'timestamp': time.time()
    }
    logging.info(f"Metrics collected: {metrics}")
    return metrics

def main():
    print("Starting monitoring script...")
    try:
        while True:
            metrics = get_metrics()

            # Check CPU
            if metrics['cpu'] > CONFIG['cpu_threshold']:
                send_alert('cpu', metrics['cpu'], CONFIG['cpu_threshold'])
            else:
                clear_alert('cpu')

            # Check RAM
            if metrics['ram'] > CONFIG['ram_threshold']:
                send_alert('ram', metrics['ram'], CONFIG['ram_threshold'])
            else:
                clear_alert('ram')

            # Check Disk
            if metrics['disk'] > CONFIG['disk_threshold']:
                send_alert('disk', metrics['disk'], CONFIG['disk_threshold'])
            else:
                clear_alert('disk')

            # For real-time dashboard, write metrics to a file or a message queue
            with open('metrics.json', 'w') as f:
                json.dump(metrics, f)

            time.sleep(5) # Monitor every 5 seconds

    except KeyboardInterrupt:
        print("Monitoring stopped.")
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()