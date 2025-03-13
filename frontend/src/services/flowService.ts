import apiService from './api';

export interface FlowData {
  _id?: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  is_active: boolean;
  is_preset?: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

class FlowService {
  /**
   * Get all flows for the current user
   * @param includePresets Whether to include preset flows
   */
  async getAllFlows(includePresets: boolean = false): Promise<FlowData[]> {
    try {
      const response = await apiService.get<{ success: boolean; flows: FlowData[] }>(
        `/v1/flows${includePresets ? '?include_presets=true' : ''}`
      );
      return response.flows || [];
    } catch (error) {
      console.error('Error fetching flows:', error);
      throw error;
    }
  }

  /**
   * Get a flow by ID
   * @param flowId Flow ID
   */
  async getFlowById(flowId: string): Promise<FlowData> {
    try {
      const response = await apiService.get<{ success: boolean; flow: FlowData }>(`/v1/flows/${flowId}`);
      return response.flow;
    } catch (error) {
      console.error(`Error fetching flow ${flowId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new flow
   * @param flowData Flow data
   */
  async createFlow(flowData: Partial<FlowData>): Promise<FlowData> {
    try {
      const response = await apiService.post<{ success: boolean; flow: FlowData }>('/v1/flows', flowData);
      return response.flow;
    } catch (error) {
      console.error('Error creating flow:', error);
      throw error;
    }
  }

  /**
   * Update an existing flow
   * @param flowId Flow ID
   * @param flowData Flow data
   */
  async updateFlow(flowId: string, flowData: Partial<FlowData>): Promise<FlowData> {
    try {
      const response = await apiService.put<{ success: boolean; flow: FlowData }>(`/v1/flows/${flowId}`, flowData);
      return response.flow;
    } catch (error) {
      console.error(`Error updating flow ${flowId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a flow
   * @param flowId Flow ID
   */
  async deleteFlow(flowId: string): Promise<boolean> {
    try {
      const response = await apiService.delete<{ success: boolean }>(`/v1/flows/${flowId}`);
      return response.success;
    } catch (error) {
      console.error(`Error deleting flow ${flowId}:`, error);
      throw error;
    }
  }

  /**
   * Get all active flows
   */
  async getActiveFlows(): Promise<FlowData[]> {
    try {
      const response = await apiService.get<{ success: boolean; flows: FlowData[] }>('/v1/flows/active');
      return response.flows || [];
    } catch (error) {
      console.error('Error fetching active flows:', error);
      throw error;
    }
  }
  
  /**
   * Get all preset flows
   */
  async getPresetFlows(): Promise<FlowData[]> {
    try {
      console.log('Attempting to fetch preset flows');
      
      // Define the order of endpoints to try
      const endpoints = [
        '/v1/flows/presets',             // Standard endpoint with auth
        '/v1/dev/flows/presets',         // Development endpoint 
        '/v1/open/create_simple_preset'  // Last resort - creates a preset if none exist
      ];
      
      let lastError: Error | null = null;
      
      // Try each endpoint in sequence until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch preset flows using endpoint: ${endpoint}`);
          const response = await apiService.get<{ success: boolean; flows?: FlowData[]; all_presets?: FlowData[] }>(endpoint);
          
          // Handle the special case for the open endpoint
          if (endpoint.includes('open/create_simple_preset') && response.all_presets) {
            console.log(`Successfully created and fetched ${response.all_presets.length} preset flows from open endpoint`);
            return response.all_presets || [];
          }
          
          // Standard endpoint response handling
          if (response.flows && response.flows.length > 0) {
            console.log(`Successfully fetched ${response.flows.length} preset flows from ${endpoint}`);
            // Log the structure of the first flow for debugging
            if (response.flows[0]) {
              console.log('Sample preset flow structure:', {
                id: response.flows[0]._id,
                name: response.flows[0].name,
                nodeCount: response.flows[0].nodes?.length || 0,
                edgeCount: response.flows[0].edges?.length || 0
              });
              
              // Check if the node data structure is correct
              if (response.flows[0].nodes && response.flows[0].nodes.length > 0) {
                const sampleNode = response.flows[0].nodes[0];
                console.log('Sample node structure:', {
                  id: sampleNode.id,
                  type: sampleNode.type,
                  dataKeys: sampleNode.data ? Object.keys(sampleNode.data) : []
                });
              }
            }
            return response.flows;
          } else {
            console.warn(`No preset flows returned from API endpoint ${endpoint}`);
          }
        } catch (error) {
          lastError = error as Error;
          console.error(`Error fetching preset flows from ${endpoint}:`, error);
          // Continue to the next endpoint
        }
      }
      
      // If all endpoints fail, try to create default presets directly
      console.log('All preset flow fetch attempts failed, creating default presets locally');
      return this.createDefaultPresetsLocally();
    } catch (error) {
      console.error('Error fetching preset flows:', error);
      return [];  // Return empty array instead of throwing to avoid breaking UI
    }
  }
  
  /**
   * Create default preset flows locally (used when API fails)
   * This creates a simple preset flow without API access
   */
  createDefaultPresetsLocally(): FlowData[] {
    console.log('Creating local preset flows as fallback');
    
    // Generate unique IDs for nodes
    const nodeId1 = `node_${Date.now()}_1`;
    const nodeId2 = `node_${Date.now()}_2`;
    const nodeId3 = `node_${Date.now()}_3`;
    
    // Create a local preset flow
    const welcomeFlow: FlowData = {
      _id: `local_preset_${Date.now()}`,
      name: "Simple Welcome Flow",
      description: "A locally generated welcome flow template",
      nodes: [
        {
          id: nodeId1,
          type: "messageNode",
          position: { x: 250, y: 100 },
          data: {
            label: "Welcome Message",
            message: "Hello! Welcome to our service. How can I help you today?",
            type: "text"
          }
        },
        {
          id: nodeId2,
          type: "waitNode",
          position: { x: 250, y: 250 },
          data: {
            label: "Wait for Response",
            timeout: 5,
            timeoutUnit: "minutes",
            waitForReply: true
          }
        },
        {
          id: nodeId3,
          type: "messageNode",
          position: { x: 250, y: 400 },
          data: {
            label: "Response Message",
            message: "Thank you for your message. How else can I assist you?",
            type: "text"
          }
        }
      ],
      edges: [
        {
          id: `edge_${Date.now()}_1`,
          source: nodeId1,
          target: nodeId2,
          sourceHandle: null,
          targetHandle: null
        },
        {
          id: `edge_${Date.now()}_2`,
          source: nodeId2,
          target: nodeId3,
          sourceHandle: "reply",
          targetHandle: null
        }
      ],
      is_active: false,
      is_preset: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Created local preset flow:', welcomeFlow.name);
    return [welcomeFlow];
  }

  /**
   * Duplicate a flow
   * @param flowId Flow ID to duplicate
   * @param newName Optional new name for the duplicated flow
   */
  async duplicateFlow(flowId: string, newName?: string): Promise<FlowData> {
    try {
      const response = await apiService.post<{ success: boolean; flow: FlowData }>(
        `/v1/flows/${flowId}/duplicate`,
        newName ? { name: newName } : {}
      );
      return response.flow;
    } catch (error) {
      console.error(`Error duplicating flow ${flowId}:`, error);
      throw error;
    }
  }
}

export const flowService = new FlowService();
export default flowService; 