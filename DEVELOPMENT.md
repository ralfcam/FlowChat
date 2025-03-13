# FlowChat Development Guide

This guide provides information on working with FlowChat in development mode, including special development features and troubleshooting common issues.

## Development Mode

FlowChat includes special development-friendly features to make local development easier. These features are automatically enabled when running the application with the appropriate environment variables.

### Environment Variables

To enable development mode, set these environment variables:

```bash
# Windows (CMD)
set FLASK_ENV=development
set FLASK_DEBUG=1
set DEV_AUTH_BYPASS=true

# Windows (PowerShell)
$env:FLASK_ENV = "development"
$env:FLASK_DEBUG = 1
$env:DEV_AUTH_BYPASS = "true"

# Unix/Linux/MacOS
export FLASK_ENV=development
export FLASK_DEBUG=1
export DEV_AUTH_BYPASS=true
```

### Running in Development Mode

For convenience, you can use the provided development scripts:

**Windows:**
```cmd
cd backend
run_dev.bat
```

**Unix/Linux/MacOS:**
```bash
cd backend
./run_dev.sh
```

## Authentication Bypass

In development mode, FlowChat can bypass authentication requirements to make testing easier. This allows you to access protected routes without having to log in.

The bypass works through:

1. **Frontend Authentication Check**: In development mode, the `ProtectedRoute` component will not redirect to the login page.

2. **Backend Token Verification**: The `token_required` decorator checks for development mode and allows access without a valid token.

This system is controlled by the `DEV_AUTH_BYPASS` environment variable.

## Preset Flows

### Development Endpoints

The application provides special endpoints for working with preset flows in development mode:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/dev/flows/presets` | GET | Fetches preset flows without authentication |
| `/api/v1/dev/flows/create_preset` | POST | Creates a new preset flow without authentication |
| `/api/v1/open/create_simple_preset` | GET | Always creates a simple preset flow as a fallback |

### Fallback Mechanism

The frontend automatically attempts multiple endpoints when loading preset flows:

1. First tries the standard authenticated endpoint: `/api/v1/flows/presets`
2. Then tries the development endpoint: `/api/v1/dev/flows/presets`
3. Finally falls back to the open endpoint: `/api/v1/open/create_simple_preset`

This cascading approach ensures that preset flows are always available during development, even if there are authentication issues.

## Troubleshooting

### Preset Flows Not Loading

If preset flows aren't appearing in the "Load Flow" dialog:

1. Check browser console logs for API errors
2. Verify environment variables are correctly set
3. Try manually creating a preset flow by accessing: `/api/v1/open/create_simple_preset`
4. Restart the application in development mode

### Authentication Issues

If you're still being redirected to login:

1. Ensure `DEV_AUTH_BYPASS=true` is set
2. Check that both frontend and backend are running in development mode
3. Clear browser cookies and local storage
4. Restart both frontend and backend services

## Development Best Practices

1. **Disable in Production**: Always ensure development mode is disabled in production environments.

2. **Local Testing Only**: Development mode bypasses security checks and should only be used in isolated development environments.

3. **Keep Dependencies Updated**: Regularly update project dependencies to maintain security and access new features.

4. **Follow Logging Guidelines**: Use appropriate log levels to keep development logs informative but manageable. 