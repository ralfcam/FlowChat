import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  IconButton,
  SelectChangeEvent
} from './MaterialImports';
import CloseIcon from '@mui/icons-material/Close';

// NodeProperties interface
export interface NodePropertiesProps {
  nodeId: string;
  nodeType: string;
  nodeData: Record<string, any>;
  onUpdate: (newData: Record<string, any>) => void;
  onClose: () => void;
}

const NodeProperties: React.FC<NodePropertiesProps> = ({
  nodeId,
  nodeType,
  nodeData,
  onUpdate,
  onClose
}) => {
  // Render properties based on node type
  const renderProperties = () => {
    switch (nodeType) {
      case 'messageNode':
        return renderMessageNodeProperties();
      case 'conditionNode':
        return renderConditionNodeProperties();
      case 'waitNode':
        return renderWaitNodeProperties();
      default:
        return (
          <Typography variant="body1" color="error">
            Unknown node type: {nodeType}
          </Typography>
        );
    }
  };

  // Message node properties
  const renderMessageNodeProperties = () => {
    return (
      <>
        <TextField
          fullWidth
          label="Label"
          value={nodeData.label || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ label: e.target.value })}
          margin="normal"
        />
        
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Message"
          value={nodeData.message || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ message: e.target.value })}
          margin="normal"
          placeholder="Enter message text..."
          helperText="Use {{variable}} for dynamic content"
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Message Type</InputLabel>
          <Select
            value={nodeData.messageType || 'text'}
            label="Message Type"
            onChange={(e: SelectChangeEvent) => onUpdate({ messageType: e.target.value })}
          >
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="image">Image</MenuItem>
            <MenuItem value="audio">Audio</MenuItem>
            <MenuItem value="document">Document</MenuItem>
            <MenuItem value="location">Location</MenuItem>
          </Select>
        </FormControl>
        
        {nodeData.messageType === 'image' && (
          <TextField
            fullWidth
            label="Image URL"
            value={nodeData.mediaUrl || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ mediaUrl: e.target.value })}
            margin="normal"
            placeholder="https://example.com/image.jpg"
          />
        )}
      </>
    );
  };

  // Condition node properties
  const renderConditionNodeProperties = () => {
    return (
      <>
        <TextField
          fullWidth
          label="Label"
          value={nodeData.label || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ label: e.target.value })}
          margin="normal"
        />
        
        <TextField
          fullWidth
          label="Variable"
          value={nodeData.variable || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ variable: e.target.value })}
          margin="normal"
          placeholder="e.g., message, contact.name"
          helperText="The variable to evaluate in the condition"
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Operator</InputLabel>
          <Select
            value={nodeData.operator || 'equals'}
            label="Operator"
            onChange={(e: SelectChangeEvent) => onUpdate({ operator: e.target.value })}
          >
            <MenuItem value="equals">Equals</MenuItem>
            <MenuItem value="contains">Contains</MenuItem>
            <MenuItem value="startsWith">Starts with</MenuItem>
            <MenuItem value="endsWith">Ends with</MenuItem>
            <MenuItem value="greaterThan">Greater than</MenuItem>
            <MenuItem value="lessThan">Less than</MenuItem>
            <MenuItem value="exists">Exists</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          label="Value"
          value={nodeData.value || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ value: e.target.value })}
          margin="normal"
          placeholder="Value to compare against"
        />
        
        <Box sx={{ display: 'flex', mt: 2, justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="caption" sx={{ color: 'green' }}>
              If TRUE
            </Typography>
            <Typography variant="body2">
              Follow "Yes" path
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="caption" sx={{ color: 'red' }}>
              If FALSE
            </Typography>
            <Typography variant="body2">
              Follow "No" path
            </Typography>
          </Box>
        </Box>
      </>
    );
  };

  // Wait node properties
  const renderWaitNodeProperties = () => {
    return (
      <>
        <TextField
          fullWidth
          label="Label"
          value={nodeData.label || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ label: e.target.value })}
          margin="normal"
        />
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <TextField
            label="Duration"
            type="number"
            value={nodeData.duration || 5}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ duration: Number(e.target.value) })}
            inputProps={{ min: 1 }}
            sx={{ flex: 1 }}
          />
          
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Unit</InputLabel>
            <Select
              value={nodeData.timeUnit || 'minutes'}
              label="Unit"
              onChange={(e: SelectChangeEvent) => onUpdate({ timeUnit: e.target.value })}
            >
              <MenuItem value="seconds">Seconds</MenuItem>
              <MenuItem value="minutes">Minutes</MenuItem>
              <MenuItem value="hours">Hours</MenuItem>
              <MenuItem value="days">Days</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Wait Type</InputLabel>
          <Select
            value={nodeData.waitType || 'fixed'}
            label="Wait Type"
            onChange={(e: SelectChangeEvent) => onUpdate({ waitType: e.target.value })}
          >
            <MenuItem value="fixed">Fixed Duration</MenuItem>
            <MenuItem value="until">Until Response</MenuItem>
            <MenuItem value="variable">Variable Duration</MenuItem>
          </Select>
        </FormControl>
        
        {nodeData.waitType === 'variable' && (
          <TextField
            fullWidth
            label="Duration Variable"
            value={nodeData.durationVariable || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ durationVariable: e.target.value })}
            margin="normal"
            placeholder="e.g., contact.waitTime"
            helperText="Variable that contains the duration value"
          />
        )}
      </>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {nodeType === 'messageNode' ? 'Message Properties' : 
           nodeType === 'conditionNode' ? 'Condition Properties' : 
           nodeType === 'waitNode' ? 'Wait Properties' : 'Node Properties'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Node ID: {nodeId}
      </Typography>
      
      {renderProperties()}
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" color="primary" onClick={onClose}>
          Done
        </Button>
      </Box>
    </Box>
  );
};

export default NodeProperties; 