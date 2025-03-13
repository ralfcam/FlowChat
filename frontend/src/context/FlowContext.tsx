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
  saveFlow: () => Promise<void>;
  createNewFlow: () => void;
  deleteFlow: () => Promise<void>;
  loadFlow: (flowId: string) => Promise<void>;
  loadFlows: () => Promise<void>;
  loadPresetFlows: () => Promise<void>;
  duplicateFlow: (flowId: string, newName?: string) => Promise<void>;
  createFromPreset: (presetId: string, newName?: string) => Promise<void>;
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
          console.log(`Successfully loaded ${presets.length} preset flows in FlowContext`);
          setPresetFlows(presets);
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
        
        const flowData = {
          name: flowName,
          description: flowDescription,
          nodes: flow.nodes,
          edges: flow.edges,
          is_active: isFlowActive
        };
        
        let savedFlow: FlowData;
        
        if (currentFlowId) {
          // Update existing flow
          savedFlow = await flowService.updateFlow(currentFlowId, flowData);
        } else {
          // Create new flow
          savedFlow = await flowService.createFlow(flowData);
          setCurrentFlowId(savedFlow._id as string);
        }
        
        // Update flows list
        setFlows((currentFlows) => {
          const updatedFlows = [...currentFlows.filter(f => f._id !== savedFlow._id), savedFlow];
          return updatedFlows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        });
        
        setIsDirty(false);
      } catch (error) {
        console.error('Error saving flow:', error);
      } finally {
        setIsLoading(false);
      }
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
      
      // Check if we need to save current flow
      if (isDirty && reactFlowInstance) {
        const shouldSave = window.confirm('You have unsaved changes. Would you like to save before loading a new flow?');
        if (shouldSave) {
          await saveFlow();
        }
      }
      
      const flow = await flowService.getFlowById(flowId);
      
      if (flow) {
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        setFlowName(flow.name);
        setFlowDescription(flow.description || '');
        setIsFlowActive(flow.is_active || false);
        setCurrentFlowId(flow._id as string);
        setIsDirty(false);
      }
    } catch (error) {
      console.error(`Error loading flow ${flowId}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [isDirty, reactFlowInstance, saveFlow, setNodes, setEdges]);
  
  // Duplicate a flow
  const duplicateFlow = useCallback(async (flowId: string, newName?: string) => {
    try {
      setIsLoading(true);
      const duplicatedFlow = await flowService.duplicateFlow(flowId, newName);
      
      // Add to flows list
      setFlows((currentFlows) => {
        const updatedFlows = [...currentFlows, duplicatedFlow];
        return updatedFlows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      });
      
      // Load the duplicated flow
      setNodes(duplicatedFlow.nodes || []);
      setEdges(duplicatedFlow.edges || []);
      setFlowName(duplicatedFlow.name);
      setFlowDescription(duplicatedFlow.description || '');
      setIsFlowActive(false); // Duplicated flows are inactive by default
      setCurrentFlowId(duplicatedFlow._id as string);
      setIsDirty(false);
      
    } catch (error) {
      console.error(`Error duplicating flow ${flowId}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges]);
  
  // Create flow from preset
  const createFromPreset = useCallback(async (presetId: string, newName?: string) => {
    try {
      setIsLoading(true);
      console.log(`Creating flow from preset ${presetId}`);
      
      // First make sure we have preset flows loaded
      if (!presetFlows || presetFlows.length === 0) {
        await loadPresetFlows();
      }
      
      // Try to find the preset in our loaded presets
      const preset = presetFlows.find(p => p._id === presetId);
      
      if (preset) {
        // If we found the preset in our state, create a new flow based on it
        const newFlow: Partial<FlowData> = {
          name: newName || `Copy of ${preset.name}`,
          description: preset.description,
          nodes: JSON.parse(JSON.stringify(preset.nodes)), // Deep copy
          edges: JSON.parse(JSON.stringify(preset.edges)), // Deep copy
          is_active: false
        };
        
        console.log("Creating new flow from preset:", newFlow);
        
        // Create the flow
        const createdFlow = await flowService.createFlow(newFlow);
        
        // Load the new flow
        await loadFlow(createdFlow._id!);
        
        // Refresh the flows list
        await loadFlows();
        
        return;
      }
      
      // If we didn't find the preset in our state, try to duplicate it directly
      console.log("Preset not found in state, trying direct duplication");
      await duplicateFlow(presetId, newName || 'New flow from preset');
      
    } catch (error) {
      console.error('Error creating flow from preset:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [duplicateFlow, flowService, loadFlow, loadFlows, loadPresetFlows, presetFlows]);
  
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