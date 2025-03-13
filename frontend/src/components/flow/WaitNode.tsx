import React, { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TimerIcon from '@mui/icons-material/Timer';

interface WaitNodeData {
  label: string;
  timeout?: number;
  timeoutUnit?: 'seconds' | 'minutes' | 'hours' | 'days';
  // Legacy properties for backward compatibility
  duration?: number;
  timeUnit?: 'seconds' | 'minutes' | 'hours' | 'days';
  waitTime?: number;
  waitUnit?: 'seconds' | 'minutes' | 'hours' | 'days';
  waitForReply?: boolean;
  onTimeoutChange?: (timeout: number) => void;
  onTimeoutUnitChange?: (unit: 'seconds' | 'minutes' | 'hours' | 'days') => void;
  onWaitForReplyChange?: (waitForReply: boolean) => void;
}

const timeUnits = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

const WaitNode: React.FC<NodeProps<WaitNodeData>> = ({ 
  data, 
  isConnectable,
  selected
}) => {
  // Handle different property naming in data
  const [localTimeout, setLocalTimeout] = useState<number>(0);
  const [localTimeoutUnit, setLocalTimeoutUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('minutes');
  
  // Initialize state from data on component mount or data changes
  useEffect(() => {
    // Determine which property to use for timeout value
    let timeoutValue = 0;
    let timeoutUnitValue: 'seconds' | 'minutes' | 'hours' | 'days' = 'minutes';
    
    if (data.timeout !== undefined) {
      timeoutValue = data.timeout;
    } else if (data.duration !== undefined) {
      timeoutValue = data.duration;
    } else if (data.waitTime !== undefined) {
      timeoutValue = data.waitTime;
    }
    
    if (data.timeoutUnit) {
      timeoutUnitValue = data.timeoutUnit;
    } else if (data.timeUnit) {
      timeoutUnitValue = data.timeUnit;
    } else if (data.waitUnit) {
      timeoutUnitValue = data.waitUnit;
    }
    
    setLocalTimeout(timeoutValue);
    setLocalTimeoutUnit(timeoutUnitValue);
  }, [data.timeout, data.duration, data.waitTime, data.timeoutUnit, data.timeUnit, data.waitUnit]);

  const handleTimeoutChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10) || 0;
    setLocalTimeout(value);
    
    if (data.onTimeoutChange) {
      data.onTimeoutChange(value);
    }
  };

  const handleTimeoutUnitChange = (event: SelectChangeEvent) => {
    const value = event.target.value as 'seconds' | 'minutes' | 'hours' | 'days';
    setLocalTimeoutUnit(value);
    
    if (data.onTimeoutUnitChange) {
      data.onTimeoutUnitChange(value);
    }
  };

  return (
    <Paper
      elevation={selected ? 8 : 3}
      sx={{
        padding: 2,
        borderRadius: 2,
        width: 250,
        border: selected ? '2px solid #ff9800' : 'none',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#ff9800' }}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <TimerIcon sx={{ mr: 1, color: '#ff9800' }} />
        <Typography variant="subtitle1" fontWeight="bold">
          {data.label}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <TextField
          variant="outlined"
          size="small"
          type="number"
          label="Wait for"
          value={localTimeout}
          onChange={handleTimeoutChange}
          sx={{ mr: 1, width: '40%' }}
          inputProps={{ min: 0 }}
        />
        
        <FormControl size="small" sx={{ width: '60%' }}>
          <InputLabel>Unit</InputLabel>
          <Select
            value={localTimeoutUnit}
            label="Unit"
            onChange={handleTimeoutUnitChange}
          >
            {timeUnits.map((unit) => (
              <MenuItem key={unit.value} value={unit.value}>
                {unit.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Typography variant="caption" color="text.secondary">
        Wait for a reply or continue after timeout
      </Typography>
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="reply"
        style={{ background: 'green', left: '30%' }}
        isConnectable={isConnectable}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="timeout"
        style={{ background: '#ff9800', left: '70%' }}
        isConnectable={isConnectable}
      />
    </Paper>
  );
};

export default memo(WaitNode); 