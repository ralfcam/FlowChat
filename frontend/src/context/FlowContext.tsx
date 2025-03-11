import React, { createContext, useState, useCallback, useContext, ReactNode } from 'react';
import { 
  Node, 
  Edge, 
  ReactFlowInstance, 
  Connection, 
  addEdge,
  useNodesState,
  useEdgesState
} from 'reactflow';

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
  
  // Node handlers
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNode: (node: Node | null) => void;
  updateNodeData: (nodeId: string, newData: Record<string, any>) => void;
  addNode: (type: string) => void;
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
  const addNode = useCallback((type: string) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type,
      position: {
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
      const flow = reactFlowInstance.toObject();
      console.log('Saving flow:', flow);
      // TODO: Implement API call to save flow
      setIsDirty(false);
    }
  }, [reactFlowInstance]);
  
  // Create new flow
  const createNewFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setFlowName('New Workflow');
    setFlowDescription('');
    setIsFlowActive(false);
    setIsDirty(false);
    setSelectedNode(null);
  }, [setNodes, setEdges]);
  
  // Delete flow
  const deleteFlow = useCallback(async () => {
    // TODO: Implement API call to delete flow
    createNewFlow();
  }, [createNewFlow]);
  
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