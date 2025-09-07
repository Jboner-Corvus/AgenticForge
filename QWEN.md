## Qwen Added Memories

- After analyzing the worker.log and system configuration, I found that:

1. There are multiple worker processes running outside of Docker containers
2. The server container connects to Redis via the docker network using hostname 'redis'
3. Workers running on the host try to connect to Redis using 'localhost' which causes connection issues
4. The Redis container is healthy and accessible from the server container
5. Jobs are processed successfully when the connection works, but there are frequent Redis connection errors
