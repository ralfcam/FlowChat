import React, { createContext, useState, useCallback, useContext, ReactNode, useEffect } from 'react';
import { 
  Node, 
  Edge, 
  ReactFlowInstance, 
  Connection, 
  addEdge,
  useNodesState,
  useEdgesState
} from 'reactflow';
import flowService, { FlowData } from '../services/flowService';

// Define initial nodes
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'messageNode',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Welcome Message', 
      message: 'Hello! Welcome to our service. How can we help you today?'
    }
  },
  {
    id: '2',
    type: 'conditionNode',
    position: { x: 250, y: 250 },
    data: { 
      label: 'Check Response',
      condition: '',
      variable: 'message',
      operator: 'contains',
      value: 'help'
    }
  },
  {
    id: '3',
    type: 'messageNode',
    position: { x: 100, y: 400 },
    data: { 
      label: 'Help Message', 
      message: 'Here are some ways we can help you...'
    }
  },
  {
    id: '4',
    type: 'waitNode',
    position: { x: 400, y: 400 },
    data: { 
      label: 'Wait for Response',
      duration: 5,
      timeUnit: 'minutes'
    }
  }
];

// Define initial edges
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3', sourceHandle: 'yes' },
  { id: 'e2-4', source: '2', target: '4', sourceHandle: 'no' }
];

// Define the context interface
interface FlowContextType {
  // Flow state
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  reactFlowInstance: ReactFlowInstance | null;
  
  // Flow metadata
  flowName: string;
  flowDescription: string;
  isFlowActive: boolean;
  isDirty: boolean;
  currentFlowId: string | null;
  
  // Flow list
  flows: FlowData[];
  presetFlows: FlowData[];
  isLoading: boolean;
  
  // Node handlers
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNode: (node: Node | null) => void;
  updateNodeData: (nodeId: string, newData: Record<string, any>) => void;
  addNode: (type: string, position?: { x: number, y: number }) => void;
  duplicateNode: (node: Node) => void;
  deleteNode: (nodeId: string) => void;
  
  // Flow handlers
  setReactFlowInstance: (instance: ReactFlowInstance | null) => void;
  setFlowName: (name: string) => void;
  setFlowDescription: (description: string) => void;
  toggleFlowActive: () => void;
  saveFlow: () => Promise<FlowData | undefined>;
  createNewFlow: () => void;
  deleteFlow: () => Promise<void>;
  loadFlow: (flowId: string) => Promise<void>;
  loadFlows: () => Promise<void>;
  loadPresetFlows: () => Promise<void>;
  duplicateFlow: (flowId: string, newName?: string) => Promise<FlowData | undefined>;
  createFromPreset: (presetId: string, newName?: string) => Promise<FlowData | undefined>;
}

// Create the context
export const FlowContext = createContext<FlowContextType | undefined>(undefined);

// Create the provider component
interface FlowProviderProps {
  children: ReactNode;
}

export const FlowProvider: React.FC<FlowProviderProps> = ({ children }) => {
  // React Flow states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Flow metadata
  const [flowName, setFlowName] = useState<string>('New Workflow');
  const [flowDescription, setFlowDescription] = useState<string>('A workflow for handling customer inquiries');
  const [isFlowActive, setIsFlowActive] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  
  // Flow list
  const [flows, setFlows] = useState<FlowData[]>([]);
  const [presetFlows, setPresetFlows] = useState<FlowData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Load all flows
  const loadFlows = useCallback(async () => {
    try {
      setIsLoading(true);
      const flowsList = await flowService.getAllFlows(false);
      setFlows(flowsList);
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load preset flows
  const loadPresetFlows = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading preset flows from FlowContext...');
      
      try {
        const presets = await flowService.getPresetFlows();
        
        if (presets && presets.length > 0) {
          console.log(`Loaded ${presets.length} preset flows from API, filtering duplicates...`);
          
          // Find the first "Welcome Flow Template" or similar preset
          let welcomeFlowTemplate = presets.find(flow => 
            flow.name.includes("Welcome Flow Template") || 
            flow.name.includes("Simple Welcome Flow")
          );
          
          // If no welcome template is found, use the first preset
          if (!welcomeFlowTemplate && presets.length > 0) {
            welcomeFlowTemplate = presets[0];
            console.log(`No specific welcome template found, using first preset: ${welcomeFlowTemplate.name}`);
          }
          
          // Set only this single preset
          if (welcomeFlowTemplate) {
            console.log(`Using single preset flow: ${welcomeFlowTemplate.name}`);
            setPresetFlows([welcomeFlowTemplate]);
          } else {
            console.warn('No valid preset flows were found');
            setPresetFlows([]);
          }
        } else {
          console.warn('No preset flows were returned in FlowContext loadPresetFlows');
          // Still update state with empty array to prevent repeated attempts
          setPresetFlows([]);
        }
      } catch (error) {
        console.error('Error in FlowContext loadPresetFlows:', error);
        // Don't clear existing presets on error
      }
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load flows and presets on component mount
  useEffect(() => {
    loadFlows();
    loadPresetFlows();
  }, [loadFlows, loadPresetFlows]);
  
  // Handle connections between nodes
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
    setIsDirty(true);
  }, [setEdges]);
  
  // Update node data
  const updateNodeData = useCallback((nodeId: string, newData: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          node.data = { ...node.data, ...newData };
        }
        return node;
      })
    );
    setIsDirty(true);
  }, [setNodes]);
  
  // Add a new node
  const addNode = useCallback((type: string, position?: { x: number, y: number }) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      position: position || {
        x: 250,
        y: 200,
      },
      data: {
        label: type === 'messageNode' 
          ? 'New Message' 
          : type === 'conditionNode' 
            ? 'New Condition' 
            : 'New Wait',
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
    setIsDirty(true);
  }, [setNodes]);
  
  // Duplicate a node
  const duplicateNode = useCallback((node: Node) => {
    const newNode = {
      ...node,
      id: `node_${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
    };
    
    setNodes((nds) => nds.concat(newNode));
    setIsDirty(true);
  }, [setNodes]);
  
  // Delete a node
  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ));
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    
    setIsDirty(true);
  }, [setNodes, setEdges, selectedNode]);
  
  // Toggle flow active state
  const toggleFlowActive = useCallback(() => {
    setIsFlowActive((current) => !current);
    setIsDirty(true);
  }, []);
  
  // Save flow
  const saveFlow = useCallback(async () => {
    if (reactFlowInstance) {
      try {
        setIsLoading(true);
        const flow = reactFlowInstance.toObject();
        
        console.log(`Saving flow "${flowName}" with ${flow.nodes.length} nodes and ${flow.edges.length} edges`);
        
        // Verify node structure before saving
        if (flow.nodes.length > 0) {
          console.log('Sample node data:', JSON.stringify(flow.nodes[0]));
        }
        
        const flowData = {
          name: flowName,
          description: flowDescription,
          nodes: flow.nodes,
          edges: flow.edges,
          is_active: isFlowActive
        };
        
        let savedFlow: FlowData | undefined;
        
        try {
          if (currentFlowId) {
            // Update existing flow
            console.log(`Updating existing flow with ID: ${currentFlowId}`);
            savedFlow = await flowService.updateFlow(currentFlowId, flowData);
          } else {
            // Create new flow
            console.log('Creating new flow');
            savedFlow = await flowService.createFlow(flowData);
          }
        } catch (apiError) {
          console.warn('API error when saving flow. Creating flow locally:', apiError);
          
          // Create a local flow with a temporary ID
          const tempId = currentFlowId || `temp-${Date.now()}`;
          savedFlow = {
            _id: tempId,
            name: flowName,
            description: flowDescription,
            nodes: flow.nodes,
            edges: flow.edges,
            is_active: isFlowActive,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        // Check if we got a valid response
        if (!savedFlow || typeof savedFlow !== 'object') {
          console.warn('API returned invalid flow data, using local flow');
          savedFlow = {
            _id: currentFlowId || `temp-${Date.now()}`,
            name: flowName,
            description: flowDescription,
            nodes: flow.nodes,
            edges: flow.edges,
            is_active: isFlowActive,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        
        console.log('Flow saved successfully:', savedFlow);
        
        // Update currentFlowId if we have a valid ID
        if (savedFlow && savedFlow._id) {
          setCurrentFlowId(savedFlow._id);
          
          // Update flows list - sort by most recently updated
          setFlows((currentFlows: FlowData[]) => {
            // If we have no flows yet, just return the new flow as a single-item array
            if (!currentFlows || currentFlows.length === 0) {
              return [savedFlow as FlowData];
            }
            
            // Otherwise, update the existing flows list
            // We know savedFlow is defined here because of the outer if condition
            const flowId = (savedFlow as FlowData)._id;
            const updatedFlows: FlowData[] = [...currentFlows.filter(f => f._id !== flowId), savedFlow as FlowData];
            
            // Sort by most recently updated
            return updatedFlows.sort((a, b) => {
              const dateA = new Date(a.updated_at || 0).getTime();
              const dateB = new Date(b.updated_at || 0).getTime();
              return dateB - dateA; // Sort by most recent first
            });
          });
        } else {
          console.warn('Saved flow is missing _id property');
        }
        
        setIsDirty(false);
        return savedFlow; // Return the saved flow for chaining
      } catch (error) {
        console.error('Error saving flow:', error);
        throw error; // Rethrow to allow handling by callers
      } finally {
        setIsLoading(false);
      }
    } else {
      console.error('Cannot save flow: React Flow instance is not available');
      throw new Error('Cannot save flow: React Flow instance is not available');
    }
  }, [reactFlowInstance, flowName, flowDescription, isFlowActive, currentFlowId, setFlows]);
  
  // Create new flow
  const createNewFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setFlowName('New Workflow');
    setFlowDescription('');
    setIsFlowActive(false);
    setIsDirty(false);
    setSelectedNode(null);
    setCurrentFlowId(null);
  }, [setNodes, setEdges]);
  
  // Delete flow
  const deleteFlow = useCallback(async () => {
    if (currentFlowId) {
      try {
        setIsLoading(true);
        await flowService.deleteFlow(currentFlowId);
        
        // Remove from flows list
        setFlows(prevFlows => prevFlows.filter(f => f._id !== currentFlowId));
        
        // Create new empty flow
        createNewFlow();
      } catch (error) {
        console.error('Error deleting flow:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentFlowId, createNewFlow]);
  
  // Load a flow by ID
  const loadFlow = useCallback(async (flowId: string) => {
    try {
      setIsLoading(true);
      console.log(`Loading flow with ID: ${flowId}`);
      
      // Check if we need to save current flow
      if (isDirty && reactFlowInstance) {
        const shouldSave = window.confirm('You have unsaved changes. Would you like to save before loading a new flow?');
        if (shouldSave) {
          await saveFlow();
        }
      }
      
      const flow = await flowService.getFlowById(flowId);
      
      if (flow) {
        console.log(`Successfully loaded flow: ${flow.name}`, {
          nodeCount: flow.nodes?.length || 0,
          edgeCount: flow.edges?.length || 0
        });
        
        // First reset state to prevent stale data
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        
        // Process nodes and edges to ensure correct structure
        let processedNodes: Node[] = [];
        let processedEdges: Edge[] = [];
        
        if (flow.nodes && Array.isArray(flow.nodes)) {
          processedNodes = flow.nodes.map((node: any) => {
            // Ensure node has all required fields
            if (!node.id) {
              console.log(`Node missing ID, generating a new one for node at index ${flow.nodes.indexOf(node)}`);
              node.id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            }
            
            // Deep copy node data to avoid reference issues
            const nodeCopy = { ...node, data: { ...node.data } };
            
            if (nodeCopy.data) {
              // Convert 'content' to 'message' if needed
              if (nodeCopy.data.content && !nodeCopy.data.message) {
                console.log(`Converting 'content' to 'message' for node ${nodeCopy.id}`);
                nodeCopy.data.message = nodeCopy.data.content;
                // Keep content for backward compatibility
              }
              
              // Convert 'waitTime' to 'timeout' if needed
              if (nodeCopy.data.waitTime !== undefined && nodeCopy.data.timeout === undefined) {
                console.log(`Converting 'waitTime' to 'timeout' for node ${nodeCopy.id}`);
                nodeCopy.data.timeout = nodeCopy.data.waitTime;
                // Keep waitTime for backward compatibility
              }
              
              // Convert 'waitUnit' to 'timeoutUnit' if needed
              if (nodeCopy.data.waitUnit && !nodeCopy.data.timeoutUnit) {
                console.log(`Converting 'waitUnit' to 'timeoutUnit' for node ${nodeCopy.id}`);
                nodeCopy.data.timeoutUnit = nodeCopy.data.waitUnit;
                // Keep waitUnit for backward compatibility
              }
              
              // Convert 'duration' to 'timeout' if needed (from NodeProperties)
              if (nodeCopy.data.duration !== undefined && nodeCopy.data.timeout === undefined) {
                console.log(`Converting 'duration' to 'timeout' for node ${nodeCopy.id}`);
                nodeCopy.data.timeout = nodeCopy.data.duration;
                // Keep duration for backward compatibility
              }
              
              // Convert 'timeUnit' to 'timeoutUnit' if needed (from NodeProperties)
              if (nodeCopy.data.timeUnit && !nodeCopy.data.timeoutUnit) {
                console.log(`Converting 'timeUnit' to 'timeoutUnit' for node ${nodeCopy.id}`);
                nodeCopy.data.timeoutUnit = nodeCopy.data.timeUnit;
                // Keep timeUnit for backward compatibility
              }
            }
            
            return nodeCopy;
          });
        }
        
        if (flow.edges && Array.isArray(flow.edges)) {
          processedEdges = flow.edges.map((edge: any) => {
            // Ensure edge has all required fields
            if (!edge.id) {
              console.log(`Edge missing ID, generating a new one for edge connecting ${edge.source} to ${edge.target}`);
              edge.id = `edge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            }
            
            // Deep copy to avoid reference issues
            return { ...edge };
          });
        }
        
        // Log sample node and edge structure
        if (processedNodes.length > 0) {
          console.log('Sample node structure:', JSON.stringify(processedNodes[0]));
        }
        
        if (processedEdges.length > 0) {
          console.log('Sample edge structure:', JSON.stringify(processedEdges[0]));
        }
        
        // Update state with the processed data in a sequence to ensure proper React rendering
        setTimeout(() => {
          // First update nodes and edges
          setNodes(processedNodes);
          setEdges(processedEdges);
          
          // Then update metadata
          setFlowName(flow.name);
          setFlowDescription(flow.description || '');
          setIsFlowActive(flow.is_active || false);
          setCurrentFlowId(flow._id as string);
          setIsDirty(false);
          
          // Force React Flow to update by notifying it of the change
          setTimeout(() => {
            if (reactFlowInstance) {
              console.log('Fitting view to loaded flow');
              reactFlowInstance.fitView({ padding: 0.2 });
            }
          }, 300);
        }, 100);
      } else {
        console.warn(`Flow with ID ${flowId} not found`);
      }
    } catch (error) {
      console.error(`Error loading flow ${flowId}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [isDirty, reactFlowInstance, saveFlow, setNodes, setEdges, setSelectedNode]);
  
  // Duplicate a flow
  const duplicateFlow = useCallback(async (flowId: string, newName?: string) => {
    try {
      setIsLoading(true);
      console.log(`Duplicating flow with ID: ${flowId}`);
      const duplicatedFlow = await flowService.duplicateFlow(flowId, newName);
      
      // Add to flows list
      setFlows((currentFlows) => {
        const updatedFlows = [...currentFlows, duplicatedFlow];
        return updatedFlows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      });
      
      // Load the duplicated flow
      console.log(`Flow duplicated successfully: ${duplicatedFlow.name}`);
      setNodes(duplicatedFlow.nodes || []);
      setEdges(duplicatedFlow.edges || []);
      setFlowName(duplicatedFlow.name);
      setFlowDescription(duplicatedFlow.description || '');
      setIsFlowActive(false); // Duplicated flows are inactive by default
      setCurrentFlowId(duplicatedFlow._id as string | null);
      setIsDirty(false);
      
      return duplicatedFlow;
    } catch (error) {
      console.error(`Error duplicating flow ${flowId}:`, error);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);
  
  // Create flow from preset
  const createFromPreset = useCallback(async (presetId: string, newName?: string) => {
    try {
      setIsLoading(true);
      console.log(`Creating flow from preset ${presetId}`);
      
      // Validate presetId
      if (!presetId) {
        console.error('No preset ID provided');
        throw new Error('No preset ID provided');
      }
      
      // First make sure we have preset flows loaded
      if (!presetFlows || presetFlows.length === 0) {
        console.log('No preset flows found, loading them first');
        await loadPresetFlows();
      }
      
      // Try to find the preset in our loaded presets
      const preset = presetFlows.find(p => p._id === presetId);
      
      if (!preset) {
        console.error(`Preset with ID ${presetId} not found in loaded presets`);
        console.log('Available presets:', presetFlows.map(p => ({ id: p._id, name: p.name })));
        throw new Error(`Preset flow not found`);
      }
      
      console.log('Found preset in state:', preset.name);
      console.log('Preset data structure:', {
        nodes: preset.nodes ? preset.nodes.slice(0, 1) : 'No nodes',
        edges: preset.edges ? preset.edges.slice(0, 1) : 'No edges'
      });
      
      // First, clear the canvas to avoid any render artifacts
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      
      // If we found the preset in our state, create a new flow based on it
      // Ensure nodes and edges are properly structured
      let nodes: Node[] = [];
      let edges: Edge[] = [];
      
      if (preset.nodes && Array.isArray(preset.nodes)) {
        // Deep copy and ensure each node has the correct structure
        nodes = JSON.parse(JSON.stringify(preset.nodes)).map((node: any) => {
          // Ensure node has all required fields
          if (!node.id) {
            console.warn('Node missing ID, generating a new one');
            node.id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          }
          
          // Fix node data structure issues
          if (node.data) {
            // Convert 'content' to 'message' if needed
            if (node.data.content && !node.data.message) {
              console.log(`Converting 'content' to 'message' for node ${node.id}`);
              node.data = { ...node.data, message: node.data.content };
              // Keep content for backward compatibility
            }
            
            // Convert 'waitTime' to 'timeout' if needed
            if (node.data.waitTime !== undefined && node.data.timeout === undefined) {
              console.log(`Converting 'waitTime' to 'timeout' for node ${node.id}`);
              node.data = { ...node.data, timeout: node.data.waitTime };
              // Keep waitTime for backward compatibility
            }
            
            // Convert 'waitUnit' to 'timeoutUnit' if needed
            if (node.data.waitUnit && !node.data.timeoutUnit) {
              console.log(`Converting 'waitUnit' to 'timeoutUnit' for node ${node.id}`);
              node.data = { ...node.data, timeoutUnit: node.data.waitUnit };
              // Keep waitUnit for backward compatibility
            }
          }
          
          return node;
        });
        
        console.log(`Processed ${nodes.length} nodes for the new flow`);
      } else {
        console.warn('No valid nodes array found in preset');
      }
      
      if (preset.edges && Array.isArray(preset.edges)) {
        // Deep copy and ensure each edge has the correct structure
        edges = JSON.parse(JSON.stringify(preset.edges)).map((edge: any) => {
          // Ensure edge has all required fields
          if (!edge.id) {
            console.warn('Edge missing ID, generating a new one');
            edge.id = `edge-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          }
          
          return edge;
        });
        
        console.log(`Processed ${edges.length} edges for the new flow`);
      } else {
        console.warn('No valid edges array found in preset');
      }
      
      const newFlow: Partial<FlowData> = {
        name: newName || `Copy of ${preset.name}`,
        description: preset.description || '',
        nodes: nodes,
        edges: edges,
        is_active: false
      };
      
      console.log("Creating new flow from preset with data:", {
        name: newFlow.name,
        nodeCount: newFlow.nodes?.length || 0,
        edgeCount: newFlow.edges?.length || 0
      });
      
      // Log the first node and edge for debugging
      if (newFlow.nodes && newFlow.nodes.length > 0) {
        console.log("Sample node data:", JSON.stringify(newFlow.nodes[0]));
      }
      
      if (newFlow.edges && newFlow.edges.length > 0) {
        console.log("Sample edge data:", JSON.stringify(newFlow.edges[0]));
      }
      
      try {
        // Create the flow
        const createdFlow = await flowService.createFlow(newFlow);
        
        // Check if we have a valid response with _id
        if (!createdFlow || !createdFlow._id) {
          console.error('API returned invalid flow data:', createdFlow);
          throw new Error('Failed to create flow from preset: Missing flow ID');
        }
        
        console.log("Flow created successfully with ID:", createdFlow._id);
        
        // Update state in sequence with small delays to ensure React Flow updates properly
        setTimeout(() => {
          // Update with the new flow data after a short delay for React to process the cleared state
          setNodes(createdFlow.nodes || []);
          setEdges(createdFlow.edges || []);
          setFlowName(createdFlow.name || '');
          setFlowDescription(createdFlow.description || '');
          setIsFlowActive(false);
          setCurrentFlowId(createdFlow._id as string);
          setIsDirty(false);
          
          // Force React Flow to fit view after nodes are updated
          if (reactFlowInstance) {
            setTimeout(() => {
              reactFlowInstance.fitView({ padding: 0.2 });
            }, 300);
          }
          
          console.log("Flow state updated in UI with node count:", createdFlow.nodes?.length || 0);
        }, 100);
        
        // Also reload the flows list to ensure everything is synced
        await loadFlows();
        
        return createdFlow;
      } catch (error) {
        // If there's an error with the API, try a local approach
        console.warn('API error when creating flow. Creating flow locally:', error);
        
        // Create a new flow locally and assign a temporary ID
        const tempId = `temp-${Date.now()}`;
        const localFlow: FlowData = {
          _id: tempId,
          name: newName || `Copy of ${preset.name}`,
          description: preset.description || '',
          nodes: nodes,
          edges: edges,
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Update UI with the local flow
        setNodes(localFlow.nodes);
        setEdges(localFlow.edges);
        setFlowName(localFlow.name);
        setFlowDescription(localFlow.description);
        setIsFlowActive(false);
        setCurrentFlowId(null);  // Set to null to indicate unsaved state
        setIsDirty(true);  // Mark as dirty for saving
        
        if (reactFlowInstance) {
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2 });
          }, 300);
        }
        
        console.log("Created flow locally without API (will require saving)");
        
        return localFlow;
      }
    } catch (error) {
      console.error('Error creating flow from preset:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadFlows, loadPresetFlows, presetFlows, setNodes, setEdges, reactFlowInstance, setSelectedNode]);
  
  // Create the context value
  const contextValue: FlowContextType = {
    nodes,
    edges,
    selectedNode,
    reactFlowInstance,
    flowName,
    flowDescription,
    isFlowActive,
    isDirty,
    currentFlowId,
    flows,
    presetFlows,
    isLoading,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    updateNodeData,
    addNode,
    duplicateNode,
    deleteNode,
    setReactFlowInstance,
    setFlowName,
    setFlowDescription,
    toggleFlowActive,
    saveFlow,
    createNewFlow,
    deleteFlow,
    loadFlow,
    loadFlows,
    loadPresetFlows,
    duplicateFlow,
    createFromPreset
  };
  
  return (
    <FlowContext.Provider value={contextValue}>
      {children}
    </FlowContext.Provider>
  );
};

// Custom hook to use the flow context
export const useFlow = (): FlowContextType => {
  const context = useContext(FlowContext);
  
  if (context === undefined) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  
  return context;
}; 