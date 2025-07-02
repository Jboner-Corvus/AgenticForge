#!/bin/bash

echo "--- Checking Docker Daemon Status ---"
if systemctl is-active --quiet docker; then
    echo "Docker daemon is running."
else
    echo "Docker daemon is NOT running. Please start it using: sudo systemctl start docker"
    exit 1
fi

echo "--- Checking Docker Socket Permissions ---"
if [ -S /var/run/docker.sock ]; then
    echo "Docker socket exists."
    if getent group docker | grep -q "\b$(id -un)\b"; then
        echo "User $(id -un) is in the 'docker' group."
    else
        echo "User $(id -un) is NOT in the 'docker' group. You might need to add yourself: sudo usermod -aG docker $USER && newgrp docker"
        echo "After adding, you'll need to log out and log back in for changes to take effect."
    fi
else
    echo "Docker socket /var/run/docker.sock does not exist. This indicates a problem with Docker installation."
    exit 1
fi

echo "--- Attempting to run a simple Docker container (hello-world) ---"
docker run hello-world
if [ $? -eq 0 ]; then
    echo "Successfully ran 'hello-world' container. Basic Docker functionality is working."
else
    echo "Failed to run 'hello-world' container. There might be an issue with your Docker installation or configuration."
fi

echo "--- Docker environment check complete ---"
echo "Please review the output above for any errors or warnings."
