import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Paper, Typography, Box, TextField } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

interface MessageNodeData {
  label: string;
  message?: string;
  content?: string; // For backward compatibility
  type?: string;
  onMessageChange?: (message: string) => void;
}

const MessageNode: React.FC<NodeProps<MessageNodeData>> = ({ 
  data, 
  isConnectable,
  selected
}) => {
  const [localMessage, setLocalMessage] = useState<string>('');
  
  // Initialize message from either message or content property
  useEffect(() => {
    const messageContent = data.message !== undefined ? data.message : 
                           data.content !== undefined ? data.content : '';
    setLocalMessage(messageContent);
  }, [data.message, data.content]);

  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = event.target.value;
    setLocalMessage(newMessage);
    
    if (data.onMessageChange) {
      data.onMessageChange(newMessage);
    }
  };

  return (
    <Paper
      elevation={selected ? 8 : 3}
      sx={{
        padding: 2,
        borderRadius: 2,
        width: 250,
        border: selected ? '2px solid #1976d2' : 'none',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#1976d2' }}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <ChatIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="subtitle1" fontWeight="bold">
          {data.label}
        </Typography>
      </Box>
      
      <TextField
        fullWidth
        multiline
        rows={3}
        variant="outlined"
        size="small"
        placeholder="Enter message text..."
        value={localMessage}
        onChange={handleMessageChange}
        sx={{ mb: 1 }}
      />
      
      <Typography variant="caption" color="text.secondary">
        Variables: Use {'{{'}{'{name}'}{'}}'} to insert contact variables
      </Typography>
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#1976d2' }}
      />
    </Paper>
  );
};

export default memo(MessageNode); 