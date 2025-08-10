#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Commander module for AgenticForge testing and run.sh command execution.
This module provides improved organization and functionality for testing the AgenticForge system.
"""

import subprocess
import sys
import json
import time
import shlex
import requests
import yaml
import os
from typing import Dict, List, Optional


class AgenticForgeTester:
    """Main class for testing AgenticForge functionality."""

    def __init__(self):
        """Initialize the tester with configuration."""
        # Utilisation de l'adresse IP du serveur distant
        self.api_url = "http://192.168.40.6:3001/api"
        self.api_token = "Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0"
        self.poll_interval = 2  # secondes
        self.poll_timeout = 120  # secondes (augmenté pour les tâches longues)
        self.run_sh_api_base_url = "http://192.168.40.6:3005"
        self.prompts = self._load_prompts()

    def _load_prompts(self) -> List[str]:
        """Load prompts from YAML file."""
        try:
            yaml_path = os.path.join(os.path.dirname(__file__), 'prompts.yaml')
            with open(yaml_path, 'r', encoding='utf-8') as file:
                data = yaml.safe_load(file)
                return data.get('prompts', [])
        except Exception as e:
            print(f"❌ Error loading prompts: {e}")
            return []

    def run_single_test(self, command_number_str: str) -> None:
        """
        Execute a single test based on its number.
        """
        try:
            command_number = int(command_number_str)
            index = command_number - 1

            if not (0 <= index < len(self.prompts)):
                print(f"❌ Error: Command number '{command_number_str}' is invalid. "
                      f"Please choose a number between 1 and {len(self.prompts)}.")
                return

        except ValueError:
            print(f"❌ Error: Please provide a valid command number (ex: '1', '25').")
            return

        prompt_text = self.prompts[index]
        print(f"▶️  Running test #{command_number}: {prompt_text[:70]}...")

        # Step 1: Send initial POST request
        try:
            payload = json.dumps({"prompt": prompt_text})
            curl_command = [
                'curl', '-s', '-X', 'POST',
                '-H', 'Content-Type: application/json',
                '-H', f'Authorization: Bearer {self.api_token}',
                '-d', payload,
                f'{self.api_url}/chat'
            ]

            print(f"  Command: {' '.join(shlex.quote(c) for c in curl_command)}")

            process = subprocess.run(
                curl_command,
                capture_output=True,
                text=True,
                encoding='utf-8',
                check=True
            )

            job_info = json.loads(process.stdout)
            job_id = job_info.get('jobId')

            if not job_id:
                print("❌ Error: Job ID (jobId) not found in response:")
                print(process.stdout)
                return

            print(f"✅ Job started successfully. ID: {job_id}")

        except subprocess.CalledProcessError as e:
            print(f"❌ Error executing initial curl command.")
            print(f"  Return code: {e.returncode}")
            print(f"  Standard output (stdout): {e.stdout}")
            print(f"  Error output (stderr): {e.stderr}")
            print("ℹ **Agent tip:** Check that the main API is running and accessible at `API_URL`.")
            print("  Make sure the `API_TOKEN` is correct. Check AgenticForge server logs.")
            return
        except json.JSONDecodeError:
            print(f"❌ Error: Unable to decode JSON response from initial request.")
            print(f"  Received response: {process.stdout}")
            print("ℹ **Agent tip:** The API response is not valid JSON. Check AgenticForge server logs for errors.")
            return
        except Exception as e:
            print(f"❌ An unexpected error occurred when sending the job: {e}")
            print("ℹ **Agent tip:** Check network connectivity and AgenticForge server status.")
            return

        # Step 2: Poll job status
        status_url = f"{self.api_url}/status/{job_id}"
        print(f"↩ Polling job status at {status_url}")

        start_time = time.time()
        while time.time() - start_time < self.poll_timeout:
            try:
                status_process = subprocess.run(
                    ['curl', '-s', status_url],
                    capture_output=True,
                    text=True,
                    encoding='utf-8',
                    check=True
                )
                status_data = json.loads(status_process.stdout)
                job_state = status_data.get('state')

                print(f"  Current status: {job_state}...")

                if job_state == 'completed':
                    return_value = status_data.get('returnvalue', {})
                    print("="*50)
                    print(f"✅ Test #{command_number} job completed successfully.")
                    
                    # Check if the task or test itself failed despite job completion
                    if isinstance(return_value, dict) and return_value.get('success') is False:
                        print("⚠️  WARNING: Job completed but task/test failed!")
                        print("  The job was processed successfully by the worker, but the actual task or test failed.")
                        print("  This often indicates an issue with the task implementation or test logic.")
                        print("  Check the detailed result below and examine the logs for more information.")
                        print("\n  🔍 Detailed result:")
                        print(json.dumps(return_value, indent=2, ensure_ascii=False))
                        print("\n  📋 Agent tip:")
                        print("    1. Check the worker logs: `python commander.py run_sh logs_worker`")
                        print("    2. Check the Docker logs: `python commander.py run_sh logs_docker`")
                        print("    3. Verify the task implementation and test logic")
                        print("    4. Consider restarting the worker: `python commander.py run_sh restart_worker`")
                        print("    5. If the issue persists, rebuild the worker: `python commander.py run_sh rebuild_worker`")
                    else:
                        print("  Final result:")
                        print(json.dumps(return_value, indent=2, ensure_ascii=False))
                    
                    print("="*50)
                    return

                if job_state == 'failed':
                    error_info = status_data.get('error', "No error information provided.")
                    print("="*50)
                    print(f"❌ FAILURE: Test #{command_number} failed.")
                    print(f"  Failure reason: {error_info}")
                    print("ℹ **Agent tip:** The job failed. Examine the 'Failure reason' above and AgenticForge worker logs.")
                    print("  If the failure is persistent or unexplained, a full `restart` may help.")
                    print("  If the issue seems Docker-related, consider `clean_docker` followed by `rebuild`.")
                    print("="*50)
                    return

                time.sleep(self.poll_interval)

            except subprocess.CalledProcessError as e:
                print(f"❌ Error polling job status: {e.stderr}")
                print("ℹ **Agent tip:** AgenticForge server returned an error when checking status. Check its logs.")
                time.sleep(self.poll_interval)
            except json.JSONDecodeError:
                print(f"❌ Error: Unable to decode JSON response from status API.")
                print(f"  Received response: {status_process.stdout}")
                print("ℹ **Agent tip:** The status API response is not valid JSON. AgenticForge server may have an issue.")
                return
            except Exception as e:
                print(f"❌ An unexpected error occurred during polling: {e}")
                print("ℹ **Agent tip:** Connectivity issue or internal error during polling. Check AgenticForge server status.")
                return

        # If loop ends without response
        print(f"⏰ TIMEOUT: Test #{command_number} did not complete within {self.poll_timeout} seconds.")
        print("ℹ **Agent tip:** The job exceeded the allotted time. The AgenticForge worker may be blocked, or the task is too long/complex.")
        print("  Check worker logs for clues about the blocking or failure reason.")
        print("  A full `restart` (`python commander.py run_sh restart`) can often resolve blocking issues.")
        print("  If the problem persists, `clean_docker` followed by `rebuild` may be needed for a clean environment.")


class RunShExecutor:
    """Class for executing run.sh commands via API."""

    def __init__(self, api_base_url="http://localhost:3005"):
        """Initialize with API configuration."""
        self.api_base_url = api_base_url
        self.script_dir = os.path.dirname(os.path.abspath(__file__))

    def execute_command(self, command: str, stream: bool = False, *args) -> None:
        """
        Execute a run.sh command via API.
        """
        # Map commands to API endpoints
        endpoint_map = {
            "start": "start",
            "stop": "stop", 
            "restart": "restart",
            "status": "status",
            "logs_worker": "logs/worker",
            "logs_docker": "logs/docker",
            "rebuild": "rebuild",
            "rebuild_docker": "rebuild-docker",
            "rebuild_worker": "rebuild-worker",
            "rebuild_all": "rebuild-all",
            "clean_docker": "clean-docker",
            "restart_worker": "restart/worker",
            "lint": "lint",
            "format": "format",
            "test_integration": "test/integration",
            "unit_tests": "test/unit",
            "typecheck": "typecheck",
            "all_checks": "all-checks",
            "unit_checks": "unit-checks",
            "small_checks": "small-checks",
        }

        endpoint = endpoint_map.get(command)
        if not endpoint:
            print(f"❌ Error: Unknown command: {command}")
            print("  Available commands: " + ", ".join(endpoint_map.keys()))
            return

        # Use stream endpoint if stream=True, otherwise use simple endpoint
        if stream:
            url = f"{self.api_base_url}/stream/{endpoint}"
            print(f"▶️  Executing streaming command: {url}")
            self._execute_streaming_request(url, command)
        else:
            url = f"{self.api_base_url}/{endpoint}"
            print(f"▶️  Executing command: {url}")
            self._execute_simple_request(url, command)

    def _execute_simple_request(self, url: str, command: str) -> None:
        """Execute a simple API request."""
        try:
            # Set timeout based on command type
            timeout = self._get_timeout_for_command(command)
            timeout_str = f"{timeout//60} minutes" if timeout >= 60 else f"{timeout} seconds"
            print(f"⏰ Timeout set to: {timeout_str}")
            
            response = requests.get(url, timeout=timeout)
            
            if response.status_code == 200:
                print("✅ Command executed successfully.")
                result = response.json()
                print("--- STDOUT ---")
                print(result.get('stdout', '(empty)'))
                print("--- STDERR ---")
                print(result.get('stderr', '(empty)'))
            else:
                print(f"❌ Command failed with status code {response.status_code}.")
                print("--- ERROR ---")
                print(response.text)
        except requests.exceptions.Timeout:
            timeout_str = f"{timeout//60} minutes" if timeout >= 60 else f"{timeout} seconds"
            print(f"⏰ Request timed out after {timeout_str}.")
        except requests.exceptions.ConnectionError:
            print("❌ Connection error. Make sure the API server is running on http://localhost:3005")
        except Exception as e:
            print(f"❌ Error executing command: {e}")

    def _execute_streaming_request(self, url: str, command: str) -> None:
        """Execute a streaming API request."""
        try:
            timeout = self._get_timeout_for_command(command)
            timeout_str = f"{timeout//60} minutes" if timeout >= 60 else f"{timeout} seconds"
            print(f"🔄 Starting streaming request (timeout: {timeout_str})...")
            response = requests.get(url, stream=True, timeout=timeout)
            
            if response.status_code != 200:
                print(f"❌ Command failed with status code {response.status_code}.")
                print("--- ERROR ---")
                print(response.text)
                return

            print("📡 Streaming output:")
            for line in response.iter_lines():
                if line:
                    try:
                        # Parse Server-Sent Events format
                        line_str = line.decode('utf-8')
                        if line_str.startswith('data: '):
                            data = json.loads(line_str[6:])  # Remove 'data: ' prefix
                            
                            if data.get('type') == 'start':
                                print(f"🚀 Started: {data.get('command', 'Unknown command')}")
                            elif data.get('type') == 'stdout':
                                print(f"📤 {data.get('data', '').rstrip()}")
                            elif data.get('type') == 'stderr':
                                print(f"🚨 {data.get('data', '').rstrip()}")
                            elif data.get('type') == 'end':
                                code = data.get('code', 0)
                                if code == 0:
                                    print("✅ Command completed successfully.")
                                else:
                                    print(f"❌ Command failed with exit code {code}.")
                            elif data.get('type') == 'error':
                                print(f"💥 Error: {data.get('message', 'Unknown error')}")
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        # Skip malformed lines
                        continue
                        
        except requests.exceptions.Timeout:
            timeout_str = f"{timeout//60} minutes" if timeout >= 60 else f"{timeout} seconds"
            print(f"⏰ Streaming request timed out after {timeout_str}.")
        except requests.exceptions.ConnectionError:
            print("❌ Connection error. Make sure the API server is running on http://localhost:3005")
        except Exception as e:
            print(f"❌ Error executing streaming command: {e}")

    def _get_timeout_for_command(self, command: str) -> int:
        """Get appropriate timeout for different command types."""
        # Long operations that can take 10+ minutes
        long_commands = [
            "rebuild_all", "rebuild-all", "rebuild_docker", "rebuild-docker",
            "rebuild_worker", "rebuild-worker", "clean_docker", "clean-docker"
        ]
        
        # Medium operations that can take 5+ minutes  
        medium_commands = [
            "all_checks", "all-checks", "test_integration", "test/integration",
            "unit_tests", "test/unit", "restart", "start"
        ]
        
        # Quick operations (under 2 minutes)
        quick_commands = [
            "lint", "format", "typecheck", "small_checks", "small-checks",
            "status", "stop", "logs/worker", "logs/docker"
        ]
        
        if command in long_commands:
            return 1800  # 30 minutes - no timeout issues!
        elif command in medium_commands:
            return 900   # 15 minutes
        elif command in quick_commands:
            return 300   # 5 minutes
        else:
            return 600   # 10 minutes default


def main():
    """Main entry point."""
    # Configure stdout for UTF-8 encoding, crucial for Windows
    if sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')

    if len(sys.argv) > 1:
        if sys.argv[1] == "run_sh":
            if len(sys.argv) < 3:
                print("❌ Error: Please specify a run.sh command to execute.")
                print("  Example: python commander.py run_sh start")
            else:
                # Check if streaming is requested
                stream = "--stream" in sys.argv
                if stream:
                    sys.argv.remove("--stream")
                
                tester = AgenticForgeTester()
                executor = RunShExecutor(tester.run_sh_api_base_url)
                executor.execute_command(sys.argv[2], stream, *sys.argv[3:])
        else:
            tester = AgenticForgeTester()
            tester.run_single_test(sys.argv[1])
    else:
        print("ℹ️  Please specify a command number to execute.")
        print(f"  Example: python {sys.argv[0]} 1")
        print("\n--- run.sh API Commands ---")
        print("  To run a run.sh command via the API, use: python commander.py run_sh <command>")
        print("  Example: python commander.py run_sh start")
        print("  For real-time output streaming: python commander.py run_sh --stream <command>")
        endpoint_map = {
            "start": "start", "stop": "stop", "restart": "restart", "status": "status",
            "logs_worker": "logs/worker", "logs_docker": "logs/docker", 
            "rebuild": "rebuild", "rebuild_docker": "rebuild-docker",
            "rebuild_worker": "rebuild-worker", "rebuild_all": "rebuild-all",
            "clean_docker": "clean-docker", "restart_worker": "restart/worker",
            "lint": "lint", "format": "format", "test_integration": "test/integration",
            "unit_tests": "test/unit", "typecheck": "typecheck", "all_checks": "all-checks",
            "unit_checks": "unit-checks", "small_checks": "small-checks",
        }
        print("  Available commands: " + ", ".join(endpoint_map.keys()))


if __name__ == "__main__":
    main()