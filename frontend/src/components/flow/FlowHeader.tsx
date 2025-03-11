import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper
} from './MaterialImports';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export interface FlowHeaderProps {
  flowName: string;
  flowDescription: string;
  isActive: boolean;
  isDirty: boolean;
  onFlowNameChange: (name: string) => void;
  onFlowDescriptionChange: (description: string) => void;
  onToggleActive: () => void;
  onSave: () => void;
  onNew: () => void;
  onDelete: () => void;
}

const FlowHeader: React.FC<FlowHeaderProps> = ({
  flowName,
  flowDescription,
  isActive,
  isDirty,
  onFlowNameChange,
  onFlowDescriptionChange,
  onToggleActive,
  onSave,
  onNew,
  onDelete
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        gap: 2
      }}
    >
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <TextField
          label="Flow Name"
          value={flowName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFlowNameChange(e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          sx={{ maxWidth: { md: 300 } }}
        />
        <TextField
          label="Description"
          value={flowDescription}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFlowDescriptionChange(e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          multiline
          rows={2}
        />
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        alignItems: 'center',
        gap: 2,
        ml: { md: 2 }
      }}>
        <FormControlLabel
          control={
            <Switch
              checked={isActive}
              onChange={onToggleActive}
              color="success"
            />
          }
          label={isActive ? "Active" : "Inactive"}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Save Flow">
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={!isDirty}
            >
              Save
            </Button>
          </Tooltip>
          
          <Tooltip title="New Flow">
            <IconButton
              color="primary"
              onClick={onNew}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete Flow">
            <IconButton
              color="error"
              onClick={handleOpenDeleteDialog}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Flow</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this flow? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FlowHeader; 