import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import CallSplitIcon from '@mui/icons-material/CallSplit';

interface ConditionNodeData {
  label: string;
  condition: string;
  variable: string;
  operator: string;
  value: string;
  onConditionChange?: (condition: string) => void;
  onVariableChange?: (variable: string) => void;
  onOperatorChange?: (operator: string) => void;
  onValueChange?: (value: string) => void;
}

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'greaterThan', label: 'Greater than' },
  { value: 'lessThan', label: 'Less than' },
];

const ConditionNode: React.FC<NodeProps<ConditionNodeData>> = ({ 
  data, 
  isConnectable,
  selected
}) => {
  const handleVariableChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onVariableChange) {
      data.onVariableChange(event.target.value);
    }
  };

  const handleOperatorChange = (event: any) => {
    if (data.onOperatorChange) {
      data.onOperatorChange(event.target.value);
    }
  };

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (data.onValueChange) {
      data.onValueChange(event.target.value);
    }
  };

  return (
    <Paper
      elevation={selected ? 8 : 3}
      sx={{
        padding: 2,
        borderRadius: 2,
        width: 280,
        border: selected ? '2px solid #dc004e' : 'none',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#dc004e' }}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <CallSplitIcon color="secondary" sx={{ mr: 1 }} />
        <Typography variant="subtitle1" fontWeight="bold">
          {data.label}
        </Typography>
      </Box>
      
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        label="Variable"
        placeholder="e.g., message, name"
        value={data.variable || ''}
        onChange={handleVariableChange}
        sx={{ mb: 1 }}
      />
      
      <FormControl fullWidth size="small" sx={{ mb: 1 }}>
        <InputLabel>Operator</InputLabel>
        <Select
          value={data.operator || 'equals'}
          label="Operator"
          onChange={handleOperatorChange}
        >
          {operators.map((op) => (
            <MenuItem key={op.value} value={op.value}>
              {op.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        label="Value"
        placeholder="Value to compare against"
        value={data.value || ''}
        onChange={handleValueChange}
        sx={{ mb: 1 }}
      />
      
      <Typography variant="caption" color="text.secondary">
        If true, follow the "Yes" path
      </Typography>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ background: 'green', left: '30%' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ background: 'red', left: '70%' }}
        isConnectable={isConnectable}
      />
    </Paper>
  );
};

export default memo(ConditionNode); 