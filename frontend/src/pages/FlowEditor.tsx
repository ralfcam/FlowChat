import React, { useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Paper, Typography, Divider, IconButton } from '../components/flow/MaterialImports';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

// Import custom nodes
import MessageNode from '../components/flow/MessageNode';
import ConditionNode from '../components/flow/ConditionNode';
import WaitNode from '../components/flow/WaitNode';

// Import custom components
import FlowHeader from '../components/flow/FlowHeader';
import NodeProperties from '../components/flow/NodeProperties';

// Import context
import { FlowProvider, useFlow } from '../context/FlowContext';

// Node types for ReactFlow
const nodeTypes = {
  messageNode: MessageNode,
  conditionNode: ConditionNode,
  waitNode: WaitNode
};

// NodePalette component for adding new nodes
const NodePalette = () => {
  const { addNode } = useFlow();
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: 80, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        p: 1,
        overflowY: 'auto'
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Nodes</Typography>
      <Divider sx={{ width: '100%', mb: 1 }} />
      
      <IconButton 
        color="primary" 
        sx={{ mb: 1 }} 
        onClick={() => addNode('messageNode')}
        title="Message Node"
      >
        <AddIcon />
      </IconButton>
      
      <IconButton 
        color="secondary" 
        sx={{ mb: 1 }} 
        onClick={() => addNode('conditionNode')}
        title="Condition Node"
      >
        <AddIcon />
      </IconButton>
      
      <IconButton 
        color="warning" 
        sx={{ mb: 1 }} 
        onClick={() => addNode('waitNode')}
        title="Wait Node"
      >
        <AddIcon />
      </IconButton>
    </Paper>
  );
};

// FlowControls component for flow operations
const FlowControls = () => {
  const { 
    reactFlowInstance, 
    isFlowActive, 
    toggleFlowActive, 
    saveFlow, 
    createNewFlow 
  } = useFlow();
  
  return (
    <Panel position="top-right">
      <Box sx={{ display: 'flex', gap: 1 }}>
        <IconButton 
          size="small" 
          onClick={() => reactFlowInstance?.zoomIn()}
          title="Zoom In"
        >
          <ZoomInIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => reactFlowInstance?.zoomOut()}
          title="Zoom Out"
        >
          <ZoomOutIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => console.log('Undo')}
          title="Undo"
        >
          <UndoIcon />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => console.log('Redo')}
          title="Redo"
        >
          <RedoIcon />
        </IconButton>
        <IconButton 
          size="small" 
          color="primary"
          onClick={() => saveFlow()}
          title="Save Flow"
        >
          <SaveIcon />
        </IconButton>
        <IconButton 
          size="small" 
          color={isFlowActive ? 'success' : 'default'}
          onClick={toggleFlowActive}
          title={isFlowActive ? "Deactivate Flow" : "Activate Flow"}
        >
          <PlayArrowIcon />
        </IconButton>
        <IconButton 
          size="small" 
          color="error"
          onClick={createNewFlow}
          title="Clear Flow"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Panel>
  );
};

// Flow Canvas component
const FlowCanvas = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    setReactFlowInstance,
    setSelectedNode
  } = useFlow();
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={setReactFlowInstance}
      onNodeClick={(_, node) => setSelectedNode(node)}
      onPaneClick={() => setSelectedNode(null)}
      nodeTypes={nodeTypes}
      fitView
      attributionPosition="bottom-right"
    >
      <Background 
        variant={BackgroundVariant.Dots} 
        gap={12} 
        size={1} 
        color="#f0f0f0" 
      />
      <Controls />
      <MiniMap />
      <FlowControls />
    </ReactFlow>
  );
};

// Properties panel component
const PropertiesPanel = () => {
  const { selectedNode, updateNodeData, setSelectedNode } = useFlow();
  
  if (!selectedNode) return null;
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: 320, 
        p: 2,
        overflowY: 'auto'
      }}
    >
      <NodeProperties 
        nodeId={selectedNode.id}
        nodeType={selectedNode.type || ''}
        nodeData={selectedNode.data || {}}
        onUpdate={(newData) => updateNodeData(selectedNode.id, newData)} 
        onClose={() => setSelectedNode(null)}
      />
    </Paper>
  );
};

// FlowEditorContent component that uses the FlowContext
const FlowEditorContent = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    flowName, 
    flowDescription, 
    isFlowActive, 
    isDirty,
    setFlowName,
    setFlowDescription,
    toggleFlowActive,
    saveFlow,
    createNewFlow,
    deleteFlow
  } = useFlow();
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Flow Header */}
      <FlowHeader 
        flowName={flowName}
        flowDescription={flowDescription}
        isActive={isFlowActive}
        isDirty={isDirty}
        onFlowNameChange={setFlowName}
        onFlowDescriptionChange={setFlowDescription}
        onToggleActive={toggleFlowActive}
        onSave={() => saveFlow()}
        onNew={createNewFlow}
        onDelete={() => deleteFlow()}
      />
      
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Node Palette */}
        <NodePalette />
        
        {/* Flow Canvas */}
        <Box 
          ref={reactFlowWrapper} 
          sx={{ 
            flexGrow: 1, 
            height: '100%' 
          }}
        >
          <ReactFlowProvider>
            <FlowCanvas />
          </ReactFlowProvider>
        </Box>
        
        {/* Node Properties Panel */}
        <PropertiesPanel />
      </Box>
    </Box>
  );
};

// Main FlowEditor component
const FlowEditor: React.FC = () => {
  return (
    <FlowProvider>
      <FlowEditorContent />
    </FlowProvider>
  );
};

export default FlowEditor; 