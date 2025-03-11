import React from 'react';
import { Box, IconButton, Tooltip } from './MaterialImports';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import EditIcon from '@mui/icons-material/Edit';
import { Node } from 'reactflow';

interface NodeToolbarProps {
  node: Node;
  onDelete: (nodeId: string) => void;
  onDuplicate: (node: Node) => void;
  onEdit: (node: Node) => void;
}

const NodeToolbar: React.FC<NodeToolbarProps> = ({
  node,
  onDelete,
  onDuplicate,
  onEdit
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: -45,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 1,
        boxShadow: 2,
        padding: 0.5,
        display: 'flex',
        gap: 0.5,
        zIndex: 10
      }}
    >
      <Tooltip title="Edit">
        <IconButton 
          size="small" 
          onClick={() => onEdit(node)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Duplicate">
        <IconButton 
          size="small" 
          onClick={() => onDuplicate(node)}
        >
          <FileCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Delete">
        <IconButton 
          size="small" 
          color="error"
          onClick={() => onDelete(node.id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default NodeToolbar; 