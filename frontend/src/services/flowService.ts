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
      
      console.error('All preset flow fetch attempts failed');
      if (lastError) throw lastError;
      return [];
    } catch (error) {
      console.error('Error fetching preset flows:', error);
      return [];  // Return empty array instead of throwing to avoid breaking UI
    }
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

  /**
   * Create default preset flows (development mode only)
   * This is a direct way to create preset flows if the other methods fail
   */
  async createDefaultPresets(): Promise<FlowData[]> {
    try {
      if (process.env.NODE_ENV !== 'development') {
        console.warn('createDefaultPresets should only be used in development mode');
        return [];
      }
      
      console.log('Manually triggering creation of default preset flows');
      
      // Create a simple welcome flow preset
      const welcomeFlow: Partial<FlowData> = {
        name: "Welcome Flow Template",
        description: "A simple welcome flow to get started",
        nodes: [
          {
            id: `node_${Date.now()}_1`,
            type: "messageNode",
            position: { x: 250, y: 100 },
            data: {
              label: "Welcome Message",
              content: "Hello! Welcome to our service. How can we help you today?",
              type: "text"
            }
          },
          {
            id: `node_${Date.now()}_2`,
            type: "waitNode",
            position: { x: 250, y: 250 },
            data: {
              label: "Wait for Response",
              waitTime: 0,
              waitUnit: "minutes"
            }
          }
        ],
        edges: [],
        is_active: false,
        is_preset: true
      };
      
      // Add an edge connecting the nodes
      if (welcomeFlow.nodes && welcomeFlow.nodes.length >= 2) {
        welcomeFlow.edges = [
          {
            id: `edge_${Date.now()}_1`,
            source: welcomeFlow.nodes[0].id,
            target: welcomeFlow.nodes[1].id
          }
        ];
      }
      
      // Create the preset flow via direct POST
      const response = await apiService.post<{ success: boolean; flow: FlowData }>('/v1/dev/flows/create_preset', welcomeFlow);
      
      if (response && response.success) {
        console.log('Successfully created manual preset flow');
        return await this.getPresetFlows();
      }
      
      return [];
    } catch (error) {
      console.error('Error creating default preset flows:', error);
      return [];
    }
  }
}

export const flowService = new FlowService();
export default flowService; 