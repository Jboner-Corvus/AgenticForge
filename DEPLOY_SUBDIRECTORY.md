# Deploying AgenticForge in a Subdirectory

When deploying AgenticForge in a subdirectory (e.g., `https://example.com/agenticforge` instead of `https://example.com`), you need to configure the base URL for API requests.

## Configuration

### Environment Variable

Set the `VITE_API_BASE_URL` environment variable to the subdirectory path:

```bash
VITE_API_BASE_URL=/agenticforge
```

If deploying at the root level, you can set it to `/` or leave it empty:

```bash
VITE_API_BASE_URL=/
```

### Docker Deployment

When using Docker, you can pass the environment variable in several ways:

1. **Using docker-compose.yml** (already configured):
   ```yaml
   environment:
     - VITE_API_BASE_URL=/agenticforge
   ```

2. **Using command line**:
   ```bash
   docker run -e VITE_API_BASE_URL=/agenticforge your-image
   ```

3. **Using an env file**:
   Create a `.env` file with:
   ```
   VITE_API_BASE_URL=/agenticforge
   ```
   Then reference it in your docker-compose.yml:
   ```yaml
   env_file: ./.env
   ```

### Direct Deployment

When deploying directly (without Docker), create a `.env` file in the project root with:

```
VITE_API_BASE_URL=/agenticforge
```

Then rebuild the application:
```bash
pnpm build
```

## How It Works

The `VITE_API_BASE_URL` environment variable is used in the frontend code to construct full URLs for API requests. The `buildApiUrl` function in `packages/ui/src/lib/api.ts` combines this base URL with the API endpoint paths.

For example:
- Base URL: `/agenticforge`
- Endpoint: `/api/chat`
- Final URL: `/agenticforge/api/chat`

## Troubleshooting

If API requests are still not working after configuration:

1. Check that the environment variable is correctly set
2. Verify that the backend is accessible at the expected path
3. Check the browser's developer console for any error messages
4. Ensure that your reverse proxy (if used) is correctly configured to forward requests to the backend