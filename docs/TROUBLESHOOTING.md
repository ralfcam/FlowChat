# FlowChat Troubleshooting Guide

This guide provides solutions for common issues you might encounter when using FlowChat.

## Authentication Issues

### Login Redirection Loop

**Symptoms:** You're repeatedly redirected to the login page even after entering valid credentials.

**Solutions:**
1. Clear browser cookies and local storage
2. Ensure your account has the correct permissions
3. Check that your backend authentication service is running
4. In development mode, verify that `DEV_AUTH_BYPASS=true` is set

### Token Expiration

**Symptoms:** You're suddenly logged out or redirected to login while working.

**Solutions:**
1. Log in again to refresh your token
2. Adjust the token expiration time in the backend configuration (admin only)
3. Enable "Remember me" when logging in for longer sessions

## Preset Flow Issues

### No Preset Flows Displayed

**Symptoms:** The "PRESET FLOWS" tab in the Load Flow dialog shows "No preset flows available".

**Solutions:**
1. Check that preset flows exist in the database
2. Verify your account has permission to view preset flows
3. Try refreshing the browser
4. In development mode, access `/api/v1/open/create_simple_preset` to create a default preset

### Error Creating Flow from Preset

**Symptoms:** Error message when attempting to create a flow from a preset.

**Solutions:**
1. Check that the selected preset ID is valid
2. Ensure you have permission to create new flows
3. Verify that the backend can duplicate flows
4. Check browser console for specific error details

## Flow Editor Issues

### Nodes Not Connecting

**Symptoms:** Cannot create connections between nodes.

**Solutions:**
1. Verify that the source node has an output handle and the target node has an input handle
2. Check that nodes are eligible for connection (some nodes may have restrictions)
3. Ensure the flow is not in read-only mode
4. Try refreshing the browser if the issue persists

### Flow Not Saving

**Symptoms:** Flow changes aren't saved or error appears during save.

**Solutions:**
1. Check your connection to the backend
2. Ensure you have permission to edit the flow
3. Verify that the flow data doesn't exceed size limits
4. Try saving with fewer changes at once

## API Connection Issues

### 401 Unauthorized Errors

**Symptoms:** API requests fail with 401 status code.

**Solutions:**
1. Check that you're logged in
2. Verify your token is valid
3. Ensure your account has the necessary permissions
4. In development, set `DEV_AUTH_BYPASS=true` to bypass authentication

### 403 Forbidden Errors

**Symptoms:** API requests fail with 403 status code.

**Solutions:**
1. Verify your account has permission for the requested resource
2. Check if you're trying to modify a protected resource
3. Ensure you're using the correct API endpoint
4. Contact an administrator if you need elevated permissions

### 500 Server Errors

**Symptoms:** API requests fail with 500 status code.

**Solutions:**
1. Check backend logs for error details
2. Verify the backend service is running properly
3. Ensure your request data is valid
4. Try simplifying your request if it's complex

## Performance Issues

### Slow Loading of Flows

**Symptoms:** Flows take a long time to load in the editor.

**Solutions:**
1. Check your network connection
2. Reduce the complexity of flows (too many nodes can cause slowdown)
3. Close other flows or browser tabs to free up resources
4. Clear browser cache and reload

### Browser Freezing

**Symptoms:** Browser becomes unresponsive when working with flows.

**Solutions:**
1. Reduce the number of nodes in your flow
2. Break complex flows into multiple smaller flows
3. Ensure your browser is up to date
4. Increase your device's available memory if possible

## Installation Issues

### Frontend Build Errors

**Symptoms:** Errors when running `npm install` or `npm start`.

**Solutions:**
1. Verify you have the correct Node.js version (see package.json)
2. Delete `node_modules` and run `npm install` again
3. Check for conflicts in package versions
4. Ensure you have all required development tools installed

### Backend Dependency Issues

**Symptoms:** Errors when running `pip install -r requirements.txt`.

**Solutions:**
1. Verify you have the correct Python version
2. Use a virtual environment to avoid conflicts
3. Update pip with `pip install --upgrade pip`
4. Install system dependencies required by Python packages

## Getting More Help

If you're still experiencing issues after trying these solutions:

1. Check the application logs for more details:
   - Frontend: Browser console logs
   - Backend: `backend/logs/` directory
   
2. Search for similar issues in the project repository

3. Contact the development team with:
   - Clear description of the issue
   - Steps to reproduce
   - Error messages and logs
   - Your environment details (OS, browser, etc.) 