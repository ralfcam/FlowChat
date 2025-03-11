import React from 'react';
import { Node, Edge } from 'reactflow';
import {
  Paper,
  Typography,
  TextField,
  Box,
  Divider,
  Button,
} from '@mui/material';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import DeleteIcon from '@mui/icons-material/Delete';
import { NodeType } from '../../hooks/useFlowEditor';

interface NodePropertiesProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onUpdateNode: (id: string, data: any) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
}

const NodeProperties: React.FC<NodePropertiesProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onDeleteNode,
  onDeleteEdge,
}) => {
  if (!selectedNode && !selectedEdge) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 2,
          width: '100%',
          height: '100%',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Select a node or edge to view properties
        </Typography>
      </Paper>
    );
  }

  if (selectedEdge) {
    return (
      <Paper
        elevation={3}
        sx={{
          p: 2,
          width: '100%',
          height: '100%',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Edge Properties
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            ID: {selectedEdge.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Source: {selectedEdge.source}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Target: {selectedEdge.target}
          </Typography>
          {selectedEdge.sourceHandle && (
            <Typography variant="body2" color="text.secondary">
              Source Handle: {selectedEdge.sourceHandle}
            </Typography>
          )}
          {selectedEdge.targetHandle && (
            <Typography variant="body2" color="text.secondary">
              Target Handle: {selectedEdge.targetHandle}
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 'auto' }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => onDeleteEdge(selectedEdge.id)}
            fullWidth
          >
            Delete Edge
          </Button>
        </Box>
      </Paper>
    );
  }

  // Node properties
  const nodeType = selectedNode?.data?.type || 'default';
  const handleLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNode(selectedNode!.id, { label: event.target.value });
  };

  const renderNodeSpecificProperties = () => {
    switch (nodeType) {
      case NodeType.MESSAGE:
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message Text"
            value={selectedNode?.data?.message || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateNode(selectedNode!.id, { message: e.target.value })}
            margin="normal"
          />
        );

      case NodeType.WAIT:
        return (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Timeout"
                type="number"
                value={selectedNode?.data?.timeout || 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateNode(selectedNode!.id, { timeout: parseInt(e.target.value, 10) || 0 })
                }
                margin="normal"
                sx={{ width: '50%' }}
                inputProps={{ min: 0 }}
              />

              <FormControl margin="normal" sx={{ width: '50%' }}>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={selectedNode?.data?.timeoutUnit || 'minutes'}
                  label="Unit"
                  onChange={(e: SelectChangeEvent) =>
                    onUpdateNode(selectedNode!.id, { timeoutUnit: e.target.value as string })
                  }
                >
                  <MenuItem value="seconds">Seconds</MenuItem>
                  <MenuItem value="minutes">Minutes</MenuItem>
                  <MenuItem value="hours">Hours</MenuItem>
                  <MenuItem value="days">Days</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={selectedNode?.data?.waitForReply || false}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onUpdateNode(selectedNode!.id, { waitForReply: e.target.checked })
                  }
                />
              }
              label="Wait for reply"
            />
          </>
        );

      case NodeType.CONDITION:
        return (
          <>
            <TextField
              fullWidth
              label="Variable"
              value={selectedNode?.data?.variable || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateNode(selectedNode!.id, { variable: e.target.value })}
              margin="normal"
              placeholder="e.g., message, name"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Operator</InputLabel>
              <Select
                value={selectedNode?.data?.operator || 'equals'}
                label="Operator"
                onChange={(e: SelectChangeEvent) => onUpdateNode(selectedNode!.id, { operator: e.target.value as string })}
              >
                <MenuItem value="equals">Equals</MenuItem>
                <MenuItem value="contains">Contains</MenuItem>
                <MenuItem value="startsWith">Starts with</MenuItem>
                <MenuItem value="endsWith">Ends with</MenuItem>
                <MenuItem value="greaterThan">Greater than</MenuItem>
                <MenuItem value="lessThan">Less than</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Value"
              value={selectedNode?.data?.value || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateNode(selectedNode!.id, { value: e.target.value })}
              margin="normal"
              placeholder="Value to compare against"
            />
          </>
        );

      case NodeType.INPUT:
        return (
          <>
            <TextField
              fullWidth
              label="Variable Name"
              value={selectedNode?.data?.variable || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateNode(selectedNode!.id, { variable: e.target.value })}
              margin="normal"
              placeholder="e.g., name, email, phone"
            />

            <TextField
              fullWidth
              label="Prompt"
              value={selectedNode?.data?.prompt || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateNode(selectedNode!.id, { prompt: e.target.value })}
              margin="normal"
              placeholder="e.g., Please enter your name"
              multiline
              rows={2}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Validation</InputLabel>
              <Select
                value={selectedNode?.data?.validation || 'none'}
                label="Validation"
                onChange={(e: SelectChangeEvent) => onUpdateNode(selectedNode!.id, { validation: e.target.value as string })}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="phone">Phone Number</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="custom">Custom Regex</MenuItem>
              </Select>
            </FormControl>

            {selectedNode?.data?.validation === 'custom' && (
              <TextField
                fullWidth
                label="Custom Regex"
                value={selectedNode?.data?.validationRegex || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdateNode(selectedNode!.id, { validationRegex: e.target.value })
                }
                margin="normal"
                placeholder="e.g., ^[a-zA-Z0-9]+$"
              />
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        width: '100%',
        height: '100%',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Node Properties
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          ID: {selectedNode?.id}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Type: {nodeType}
        </Typography>
      </Box>

      <TextField
        fullWidth
        label="Label"
        value={selectedNode?.data?.label || ''}
        onChange={handleLabelChange}
        margin="normal"
      />

      {renderNodeSpecificProperties()}

      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => onDeleteNode(selectedNode!.id)}
          fullWidth
        >
          Delete Node
        </Button>
      </Box>
    </Paper>
  );
};

export default NodeProperties; 