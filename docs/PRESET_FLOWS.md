# Preset Flows

This document provides detailed information about the preset flows feature in FlowChat, including how to use, create, and customize preset flows.

## What Are Preset Flows?

Preset flows are pre-configured workflow templates that can be used as starting points for creating new flows. They provide common patterns and solutions for typical messaging workflows, saving time and ensuring best practices.

## Using Preset Flows

### Accessing Preset Flows

1. Navigate to the Flow Editor by clicking on "Flow Editor" in the main navigation.
2. Click on the "Load Flow" button in the Flow Header.
3. Select the "PRESET FLOWS" tab in the dialog that appears.
4. Choose a preset flow from the dropdown menu.
5. Click "SELECT" to create a new flow based on the selected preset.

### Modifying Preset-Based Flows

After creating a flow from a preset:

1. The flow will be created as a new flow (not modifying the original preset).
2. You can customize all aspects of the flow, including nodes, edges, and metadata.
3. Save the flow with a custom name to store your modified version.

## Available Preset Flows

FlowChat comes with several built-in preset flows:

### Welcome Flow Template

A simple greeting flow that welcomes users and waits for a response.

**Components:**
- Welcome message node
- Wait for response node

**Use case:** Initial customer onboarding or first-time user greeting.

### Customer Support Template

A branching flow that handles different types of customer inquiries.

**Components:**
- Initial greeting message
- Menu options for different support categories
- Conditional branching based on user selection
- Follow-up messages for each category

**Use case:** Customer support automation and issue categorization.

### Order Status Template

A flow designed to check and communicate order status information.

**Components:**
- Order ID collection node
- Status checking logic
- Status reporting messages
- Alternative paths for different status conditions

**Use case:** Order status inquiries and updates.

## Creating Custom Preset Flows

In production, preset flows can only be created by administrators. However, in development mode, there are additional options for testing:

### Using the Development API

In development mode, you can create preset flows using the following endpoint:

```
POST /api/v1/dev/flows/create_preset
```

With payload:
```json
{
  "name": "My Custom Preset",
  "description": "Description of the preset",
  "nodes": [...],
  "edges": [...]
}
```

### Simple Preset Generation

For quick testing, you can also generate a simple preset flow using:

```
GET /api/v1/open/create_simple_preset
```

This will create a basic Welcome Flow preset that can be used immediately.

## Troubleshooting

### Preset Flows Not Appearing

If preset flows aren't visible in the dropdown:

1. Check that you're viewing the "PRESET FLOWS" tab, not "MY FLOWS"
2. Refresh the browser to reload preset data
3. Check the browser console for API errors
4. In development mode, try accessing `/api/v1/open/create_simple_preset` to generate a preset

### Error When Creating from Preset

If you encounter errors when creating a flow from a preset:

1. Ensure you have permission to create new flows
2. Check that the preset ID is valid and exists
3. Verify that the backend service is running properly
4. In development mode, check that authentication bypass is enabled

## Best Practices

1. **Use Presets as Starting Points**: Presets are templates meant to be customized, not used as-is.

2. **Create Company-Specific Presets**: Administrators can create presets that follow company messaging guidelines.

3. **Update Presets Regularly**: Keep preset flows updated with current best practices and messaging styles.

4. **Document Custom Presets**: When creating new presets, include detailed descriptions to help users understand their purpose and use cases. 