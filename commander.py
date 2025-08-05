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
        self.api_url = "http://192.168.2.56:8080/api"
        self.api_token = "Qp5brxkUkTbmWJHmdrGYUjfgNY1hT9WOxUmzpP77JU0"
        self.poll_interval = 2  # secondes
        self.poll_timeout = 60  # secondes
        self.run_sh_api_base_url = "http://localhost:3005"
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

    def __init__(self):
        """Initialize with API base URL."""
        self.run_sh_api_base_url = "http://localhost:3005"
        self.endpoint_map = {
            "start": "/start",
            "stop": "/stop",
            "restart": "/restart",
            "status": "/status",
            "logs_worker": "/logs/worker",
            "logs_docker": "/logs/docker",
            "rebuild": "/rebuild-docker",
            "rebuild_docker": "/rebuild-docker",
            "rebuild_worker": "/rebuild-worker",
            "rebuild_all": "/rebuild-all",
            "clean_docker": "/clean-docker",
            "restart_worker": "/restart/worker",
            "lint": "/lint",
            "format": "/format",
            "test_integration": "/test/integration",
            "unit_tests": "/test/unit",
            "typecheck": "/typecheck",
            "all_checks": "/all-checks",
            "unit_checks": "/unit-checks",
            "small_checks": "/small-checks",
        }

    def execute_command(self, command: str, stream: bool = False, *args) -> None:
        """
        Execute a run.sh command via API.
        """
        # Use streaming endpoint if requested
        endpoint = self.endpoint_map.get(command)
        if not endpoint:
            print(f"❌ Error: Unknown run.sh command: {command}")
            print("  Available commands: " + ", ".join(self.endpoint_map.keys()))
            return

        # Add /stream prefix for streaming endpoints
        if stream:
            endpoint = "/stream" + endpoint

        url = f"{self.run_sh_api_base_url}{endpoint}"
        print(f"▶️  Executing run.sh command via API: {url}")

        try:
            if stream:
                # Stream the response for real-time output
                with requests.get(url, stream=True) as response:
                    response.raise_for_status()
                    print("✅ Command started. Streaming output:")
                    for line in response.iter_lines():
                        if line:
                            decoded_line = line.decode('utf-8')
                            if decoded_line.startswith('data: '):
                                data = json.loads(decoded_line[6:])  # Remove 'data: ' prefix
                                if data['type'] == 'stdout':
                                    print(data['data'], end='')
                                elif data['type'] == 'stderr':
                                    print(f"STDERR: {data['data']}", end='')
                                elif data['type'] == 'error':
                                    print(f"❌ Error: {data['message']}")
                                elif data['type'] == 'end':
                                    print(f"\n✅ Command completed with exit code {data['code']}")
                                    # Check if command succeeded but tests/tasks failed
                                    if data['code'] == 0:
                                        # For test commands, check for failures in output
                                        if command in ["test_integration", "unit_tests", "all_checks", "unit_checks", "small_checks"]:
                                            print("ℹ **Agent tip:** Even though the command succeeded (exit code 0), check the output above for test failures.")
                                            print("  If tests failed, examine the logs for detailed error information:")
                                            print("    - Worker logs: `python commander.py run_sh logs_worker`")
                                            print("    - Docker logs: `python commander.py run_sh logs_docker`")
                                    else:
                                        print("ℹ **Agent tip:** Command failed with non-zero exit code. Check the output above for error details.")
                                        print("  For troubleshooting:")
                                        print("    - Check logs: `python commander.py run_sh logs_worker` or `logs_docker`")
                                        print("    - Restart services: `python commander.py run_sh restart`")
                                        print("    - Clean and rebuild: `python commander.py run_sh clean_docker` then `rebuild`")
                            else:
                                print(decoded_line)
            else:
                # Simple execution (backward compatibility)
                response = requests.get(url)
                response.raise_for_status()
                data = response.json()
                exit_code = data.get("exitCode", 0)
                
                if exit_code == 0:
                    print("✅ Command executed successfully.")
                else:
                    print(f"❌ Command failed with exit code {exit_code}.")
                
                print("--- STDOUT ---")
                stdout_content = data.get("stdout", "(empty)")
                print(stdout_content)
                print("--- STDERR ---")
                stderr_content = data.get("stderr", "(empty)")
                print(stderr_content)
                
                # Additional tips based on shell command output
                if stderr_content and stderr_content != "(empty)":
                    print("ℹ **Agent tip:** The `run.sh` command returned errors. Carefully read the `stderr` output above.")
                    if "docker" in command or "rebuild" in command or "test-integration" in command:
                        print("  If the issue is Docker-related, try running `python commander.py run_sh clean_docker` then `rebuild`.")
                    elif "lint" in command or "format" in command or "typecheck" in command or "checks" in command:
                        print("  If the issue is code quality-related, run `python commander.py run_sh small_checks` for a quick check.")
                    print("  A full `restart` (`python commander.py run_sh restart`) can sometimes resolve transient issues.")
                elif exit_code == 0:
                    # Command succeeded, but check for test/task failures in output
                    if command in ["test_integration", "unit_tests", "all_checks", "unit_checks", "small_checks"]:
                        # Look for failure indicators in test output
                        failure_indicators = ["FAILED", "failed", "ERROR", "Error", "FAILURE"]
                        has_failures = any(indicator in stdout_content for indicator in failure_indicators)
                        
                        if has_failures:
                            print("\n⚠️  WARNING: Command succeeded but tests/tasks failed!")
                            print("  The run.sh command completed successfully, but tests or tasks within it failed.")
                            print("  This often indicates issues with the implementation or test logic.")
                            print("\n  📋 Agent tip:")
                            print("    1. Carefully review the STDOUT output above for specific failure details")
                            print("    2. Check the worker logs: `python commander.py run_sh logs_worker`")
                            print("    3. Check the Docker logs: `python commander.py run_sh logs_docker`")
                            print("    4. Verify the implementation and test logic")
                            print("    5. Consider restarting the worker: `python commander.py run_sh restart_worker`")
                            print("    6. If the issue persists, rebuild the worker: `python commander.py run_sh rebuild_worker`")
                        else:
                            print("✅ All tests/checks passed successfully.")
        except requests.exceptions.RequestException as e:
            print(f"❌ Error calling run.sh API: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"  HTTP Status: {e.response.status_code}")
                print(f"  Response: {e.response.text}")
            print("ℹ **Agent tip:** Network or API connectivity issue.")
            print("  Check that the run.sh API server is running and accessible.")
            print("  Verify the API URL: http://192.168.2.56:3005")


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
                
                executor = RunShExecutor()
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
        executor = RunShExecutor()
        print("  Available commands: " + ", ".join(executor.endpoint_map.keys()))


if __name__ == "__main__":
    main()