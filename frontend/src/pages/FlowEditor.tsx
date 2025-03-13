import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  IconButton, 
  Snackbar,
  Alert,
  Tooltip,
  CircularProgress
} from '../components/flow/MaterialImports';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import SettingsIcon from '@mui/icons-material/Settings';

// Import custom nodes
import MessageNode from '../components/flow/MessageNode';
import ConditionNode from '../components/flow/ConditionNode';
import WaitNode from '../components/flow/WaitNode';

// Import custom components
import FlowHeader from '../components/flow/FlowHeader';
import NodeProperties from '../components/flow/NodeProperties';
import NodeToolbar from '../components/flow/NodeToolbar';

// Import context
import { FlowProvider, useFlow } from '../context/FlowContext';

// Node types for ReactFlow
const nodeTypes = {
  messageNode: MessageNode,
  conditionNode: ConditionNode,
  waitNode: WaitNode
};

// Node categories for sidebar
const nodeCategories = [
  {
    title: 'Messages',
    items: [
      {
        type: 'messageNode',
        label: 'Message',
        description: 'Send a WhatsApp message',
        color: 'primary' as const
      }
    ]
  },
  {
    title: 'Flow Control',
    items: [
      {
        type: 'conditionNode',
        label: 'Condition',
        description: 'Branch based on conditions',
        color: 'secondary' as const
      },
      {
        type: 'waitNode',
        label: 'Wait',
        description: 'Wait for a specified time',
        color: 'warning' as const
      }
    ]
  }
];

// NodePalette component for adding new nodes
const NodePalette = () => {
  const { addNode } = useFlow();
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: 250, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: 2,
        overflowY: 'auto'
      }}
    >
      <Typography variant="h6" gutterBottom>Node Palette</Typography>
      <Divider sx={{ mb: 2 }} />
      
      {nodeCategories.map((category, categoryIdx) => (
        <Box key={`category-${categoryIdx}-${category.title}`} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
            {category.title}
          </Typography>
          
          {category.items.map((item, itemIdx) => (
            <Paper 
              key={`item-${category.title}-${itemIdx}-${item.type}`}
              elevation={1}
              sx={{ 
                p: 1.5, 
                mb: 1, 
                cursor: 'grab',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', item.type);
                event.dataTransfer.effectAllowed = 'move';
              }}
              draggable
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton 
                  size="small" 
                  color={item.color || 'default'}
                  sx={{ mr: 1 }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      ))}
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Drag nodes onto the canvas or click to add
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {nodeCategories.map((category, categoryIdx) => (
          // Use fragment to avoid adding extra DOM elements
          <React.Fragment key={`button-group-${categoryIdx}-${category.title}`}>
            {category.items.map((item, itemIdx) => (
              <Tooltip key={`button-${category.title}-${itemIdx}-${item.type}`} title={item.label}>
                <IconButton 
                  size="small"
                  color={item.color || 'default'}
                  onClick={() => addNode(item.type)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ))}
          </React.Fragment>
        ))}
      </Box>
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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullScreen(true);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
      });
    }
  };
  
  const toggleLock = () => {
    setIsLocked(!isLocked);
    // Logic to lock nodes position would go here
  };
  
  return (
    <Panel position="top-right">
      <Paper 
        elevation={2}
        sx={{ 
          p: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1, 
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Tooltip title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}>
          <IconButton size="small" onClick={toggleFullScreen}>
            {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title={isLocked ? "Unlock Elements" : "Lock Elements"}>
          <IconButton size="small" onClick={toggleLock}>
            {isLocked ? <LockIcon /> : <LockOpenIcon />}
          </IconButton>
        </Tooltip>
        
        <Divider flexItem sx={{ my: 0.5 }} />
        
        <Tooltip title="Zoom In">
          <IconButton size="small" onClick={() => reactFlowInstance?.zoomIn()}>
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Zoom Out">
          <IconButton size="small" onClick={() => reactFlowInstance?.zoomOut()}>
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        
        <Divider flexItem sx={{ my: 0.5 }} />
        
        <Tooltip title="Undo">
          <IconButton size="small" onClick={() => console.log('Undo')}>
            <UndoIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Redo">
          <IconButton size="small" onClick={() => console.log('Redo')}>
            <RedoIcon />
          </IconButton>
        </Tooltip>
        
        <Divider flexItem sx={{ my: 0.5 }} />
        
        <Tooltip title="Auto Layout">
          <IconButton size="small" onClick={() => console.log('Auto Layout')}>
            <ShuffleIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Flow Settings">
          <IconButton size="small" onClick={() => console.log('Flow Settings')}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        
        <Divider flexItem sx={{ my: 0.5 }} />
        
        <Tooltip title="Save Flow">
          <IconButton size="small" color="primary" onClick={() => saveFlow()}>
            <SaveIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={isFlowActive ? "Deactivate Flow" : "Activate Flow"}>
          <IconButton 
            size="small" 
            color={isFlowActive ? 'success' : 'default'}
            onClick={toggleFlowActive}
          >
            <PlayArrowIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Clear Flow">
          <IconButton size="small" color="error" onClick={createNewFlow}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Paper>
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
    setSelectedNode,
    addNode,
    duplicateNode,
    deleteNode
  } = useFlow();
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'warning' | 'error'
  });
  
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type || !reactFlowBounds || !setReactFlowInstance) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      addNode(type, position);
      
      setNotification({
        open: true,
        message: `Added new ${type} node`,
        severity: 'success'
      });
    },
    [addNode, setReactFlowInstance]
  );
  
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, [setSelectedNode]);
  
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  const onNodeToolbarAction = useCallback((action: string, node: Node) => {
    switch (action) {
      case 'edit':
        setSelectedNode(node);
        break;
      case 'duplicate':
        duplicateNode(node);
        setNotification({
          open: true,
          message: 'Node duplicated',
          severity: 'info'
        });
        break;
      case 'delete':
        deleteNode(node.id);
        setNotification({
          open: true,
          message: 'Node deleted',
          severity: 'info'
        });
        break;
      default:
        break;
    }
  }, [setSelectedNode, duplicateNode, deleteNode]);
  
  return (
    <>
      <Box 
        ref={reactFlowWrapper} 
        sx={{ 
          flexGrow: 1, 
          height: '100%' 
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedNode(null)}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={12} 
            size={1} 
            color="#f0f0f0" 
          />
          <Controls />
          <MiniMap 
            nodeStrokeWidth={3}
            nodeColor={(node) => {
              switch(node.type) {
                case 'messageNode':
                  return '#1976d2';
                case 'conditionNode':
                  return '#dc004e';
                case 'waitNode':
                  return '#ff9800';
                default:
                  return '#ccc';
              }
            }}
          />
          <FlowControls />
          
          {/* Node toolbar for each node */}
          {nodes.map((node) => {
            return (
              <NodeToolbar
                key={`toolbar-${node.id}`}
                node={node}
                onDelete={() => onNodeToolbarAction('delete', node)}
                onDuplicate={() => onNodeToolbarAction('duplicate', node)}
                onEdit={() => onNodeToolbarAction('edit', node)}
              />
            );
          })}
        </ReactFlow>
      </Box>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
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
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    setReactFlowInstance,
    reactFlowInstance,
    setSelectedNode,
    addNode,
    duplicateNode,
    deleteNode,
    flowName,
    flowDescription,
    isFlowActive,
    isDirty,
    setFlowName,
    setFlowDescription,
    toggleFlowActive,
    saveFlow,
    createNewFlow,
    deleteFlow,
    flows,
    presetFlows,
    loadFlow,
    loadFlows,
    currentFlowId,
    isLoading,
    createFromPreset,
    loadPresetFlows
  } = useFlow();
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'warning' | 'error'
  });
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  
  // Load flows and preset flows on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPresets(true);
      try {
        console.log('FlowEditor: Starting to load flows and presets');
        
        // First load user flows
        await loadFlows();
        console.log('FlowEditor: User flows loaded');
        
        // Then manually trigger preset flows load
        if (!presetFlows || presetFlows.length === 0) {
          console.log('FlowEditor: No preset flows found, loading them explicitly');
          await loadPresetFlows();
          console.log('FlowEditor: Preset flows loading complete');
        } else {
          console.log(`FlowEditor: ${presetFlows.length} preset flows already loaded`);
        }
      } catch (error) {
        console.error('FlowEditor: Error loading flows or presets:', error);
        setNotification({
          open: true,
          message: 'Failed to load flows or presets',
          severity: 'error'
        });
      } finally {
        setIsLoadingPresets(false);
      }
    };
    
    fetchData();
  }, [loadFlows, loadPresetFlows, presetFlows]);
  
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type || !reactFlowBounds || !setReactFlowInstance) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      addNode(type, position);
      
      setNotification({
        open: true,
        message: `Added new ${type} node`,
        severity: 'success'
      });
    },
    [addNode, setReactFlowInstance]
  );
  
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, [setSelectedNode]);
  
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  const onNodeToolbarAction = useCallback((action: string, node: Node) => {
    switch (action) {
      case 'edit':
        setSelectedNode(node);
        break;
      case 'duplicate':
        duplicateNode(node);
        setNotification({
          open: true,
          message: 'Node duplicated',
          severity: 'info'
        });
        break;
      case 'delete':
        deleteNode(node.id);
        setNotification({
          open: true,
          message: 'Node deleted',
          severity: 'info'
        });
        break;
      default:
        break;
    }
  }, [setSelectedNode, duplicateNode, deleteNode]);
  
  const handleFlowSelect = (e: React.ChangeEvent<{ value: unknown }>) => {
    const flowId = e.target.value as string;
    loadFlow(flowId);
  };
  
  const handleCreateFromPreset = useCallback((presetId: string) => {
    if (!presetId) {
      console.error('No preset ID provided');
      setNotification({
        open: true,
        message: 'Cannot create flow: No preset selected',
        severity: 'error'
      });
      return;
    }

    // Set local loading state
    setIsLoadingPresets(true);
    console.log('Creating flow from preset', presetId);
    
    createFromPreset(presetId)
      .then((createdFlow) => {
        setIsLoadingPresets(false);
        
        // Verify we have a valid flow object
        if (!createdFlow) {
          throw new Error('No flow was returned');
        }
        
        // Verify the flow has an ID
        if (!createdFlow._id) {
          throw new Error('Created flow is missing _id property');
        }
        
        console.log('Flow created successfully from preset:', {
          id: createdFlow._id,
          name: createdFlow.name,
          nodeCount: createdFlow.nodes?.length || 0,
          edgeCount: createdFlow.edges?.length || 0
        });
        
        // Force React Flow to re-render with the new flow
        if (reactFlowInstance) {
          setTimeout(() => {
            console.log('Fitting view to display the new flow');
            reactFlowInstance.fitView({ padding: 0.2 });
          }, 300); // Small delay to ensure state has updated
        }
        
        setNotification({
          open: true,
          message: `Flow "${createdFlow.name}" created from preset`,
          severity: 'success'
        });
      })
      .catch(err => {
        setIsLoadingPresets(false);
        console.error('Error creating flow from preset:', err);
        
        // Determine the error message to show
        let errorMessage = 'Failed to create flow from preset';
        
        if (err instanceof Error) {
          errorMessage += ': ' + err.message;
        } else if (typeof err === 'string') {
          errorMessage += ': ' + err;
        }
        
        // Show error notification
        setNotification({
          open: true,
          message: errorMessage,
          severity: 'error'
        });
      });
  }, [createFromPreset, reactFlowInstance, setNotification]);
  
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
        onSave={saveFlow}
        onNew={createNewFlow}
        onDelete={deleteFlow}
        onLoad={loadFlows}
        onFlowSelect={handleFlowSelect}
        onCreateFromPreset={handleCreateFromPreset}
        isLoading={isLoading || isLoadingPresets}
        flows={flows}
        presetFlows={presetFlows || []}
        currentFlowId={currentFlowId}
      />
      
      {/* Display a loading indicator when presets are being loaded */}
      {isLoadingPresets && (
        <Box sx={{ 
          position: 'absolute', 
          top: '70px', 
          right: '20px', 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'background.paper',
          p: 1,
          borderRadius: 1,
          boxShadow: 1
        }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="caption">Loading presets...</Typography>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Node Palette */}
        <NodePalette />
        
        {/* Flow Canvas */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            height: '100%',
            position: 'relative'
          }}
        >
          <ReactFlowProvider>
            <FlowCanvas />
          </ReactFlowProvider>
        </Box>
        
        {/* Node Properties Panel */}
        <PropertiesPanel />
      </Box>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({...notification, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setNotification({...notification, open: false})} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Main FlowEditor component
const FlowEditor: React.FC = () => {
  // Debug info in development mode
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('FlowEditor running in development mode');
      console.log('Authentication bypass should be enabled');
    }
  }, []);
  
  return (
    <FlowProvider>
      <FlowEditorContent />
    </FlowProvider>
  );
};

export default FlowEditor; 