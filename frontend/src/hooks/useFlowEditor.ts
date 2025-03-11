import { useState, useCallback } from 'react';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

// Node types
export enum NodeType {
  START = 'start',
  MESSAGE = 'message',
  WAIT = 'wait',
  CONDITION = 'condition',
  INPUT = 'input',
  END = 'end',
}

// Default node data by type
const defaultNodeData = {
  [NodeType.START]: { label: 'Start' },
  [NodeType.MESSAGE]: { label: 'Send Message', message: '' },
  [NodeType.WAIT]: { label: 'Wait for Reply', timeout: 86400 }, // 24 hours in seconds
  [NodeType.CONDITION]: { label: 'Condition', condition: '' },
  [NodeType.INPUT]: { label: 'Collect Input', variable: '' },
  [NodeType.END]: { label: 'End' },
};

interface UseFlowEditorOptions {
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

export const useFlowEditor = (options: UseFlowEditorOptions = {}) => {
  const { initialNodes = [], initialEdges = [] } = options;

  // Flow metadata
  const [flowName, setFlowName] = useState<string>('New Flow');
  const [flowDescription, setFlowDescription] = useState<string>('');
  const [isFlowActive, setIsFlowActive] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Selected elements
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, id: `e-${uuidv4()}` }, eds));
      setIsDirty(true);
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setSelectedEdge(null);
    },
    []
  );

  // Handle edge selection
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge);
      setSelectedNode(null);
    },
    []
  );

  // Add a new node
  const addNode = useCallback(
    (type: NodeType, position: { x: number; y: number }) => {
      const newNode: Node = {
        id: `node-${uuidv4()}`,
        type: type === NodeType.START ? 'input' : type === NodeType.END ? 'output' : 'default',
        position,
        data: { ...defaultNodeData[type], type },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNode(newNode);
      setIsDirty(true);
      return newNode;
    },
    [setNodes]
  );

  // Update a node
  const updateNode = useCallback(
    (id: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            const updatedNode = {
              ...node,
              data: { ...node.data, ...data },
            };
            if (selectedNode?.id === id) {
              setSelectedNode(updatedNode);
            }
            return updatedNode;
          }
          return node;
        })
      );
      setIsDirty(true);
    },
    [setNodes, selectedNode]
  );

  // Delete a node
  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== id && edge.target !== id)
      );
      if (selectedNode?.id === id) {
        setSelectedNode(null);
      }
      setIsDirty(true);
    },
    [setNodes, setEdges, selectedNode]
  );

  // Delete an edge
  const deleteEdge = useCallback(
    (id: string) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== id));
      if (selectedEdge?.id === id) {
        setSelectedEdge(null);
      }
      setIsDirty(true);
    },
    [setEdges, selectedEdge]
  );

  // Clear the selection
  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Reset the flow
  const resetFlow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedEdge(null);
    setFlowName('New Flow');
    setFlowDescription('');
    setIsFlowActive(false);
    setIsDirty(false);
  }, [setNodes, setEdges]);

  // Load a flow
  const loadFlow = useCallback(
    (flow: {
      name: string;
      description?: string;
      nodes: Node[];
      edges: Edge[];
      isActive: boolean;
    }) => {
      setFlowName(flow.name);
      setFlowDescription(flow.description || '');
      setNodes(flow.nodes);
      setEdges(flow.edges);
      setIsFlowActive(flow.isActive);
      setSelectedNode(null);
      setSelectedEdge(null);
      setIsDirty(false);
    },
    [setNodes, setEdges]
  );

  // Get the current flow data
  const getFlowData = useCallback(() => {
    return {
      name: flowName,
      description: flowDescription,
      nodes,
      edges,
      isActive: isFlowActive,
    };
  }, [flowName, flowDescription, nodes, edges, isFlowActive]);

  return {
    // Flow metadata
    flowName,
    setFlowName,
    flowDescription,
    setFlowDescription,
    isFlowActive,
    setIsFlowActive,
    isDirty,
    setIsDirty,

    // React Flow state
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,

    // Selection
    selectedNode,
    selectedEdge,
    onNodeClick,
    onEdgeClick,
    clearSelection,

    // Node operations
    addNode,
    updateNode,
    deleteNode,
    deleteEdge,

    // Flow operations
    resetFlow,
    loadFlow,
    getFlowData,
  };
};

export default useFlowEditor; 