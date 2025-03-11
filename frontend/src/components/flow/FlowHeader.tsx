import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface FlowHeaderProps {
  flowName: string;
  flowDescription: string;
  isFlowActive: boolean;
  isDirty: boolean;
  onFlowNameChange: (name: string) => void;
  onFlowDescriptionChange: (description: string) => void;
  onToggleFlowActive: (active: boolean) => void;
  onSaveFlow: () => void;
  onNewFlow: () => void;
  onDeleteFlow: () => void;
}

const FlowHeader: React.FC<FlowHeaderProps> = ({
  flowName,
  flowDescription,
  isFlowActive,
  isDirty,
  onFlowNameChange,
  onFlowDescriptionChange,
  onToggleFlowActive,
  onSaveFlow,
  onNewFlow,
  onDeleteFlow,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleFlowNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFlowNameChange(event.target.value);
  };

  const handleFlowDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFlowDescriptionChange(event.target.value);
  };

  const handleToggleActive = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggleFlowActive(event.target.checked);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    onDeleteFlow();
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  return (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Flow Name"
          variant="outlined"
          size="small"
          value={flowName}
          onChange={handleFlowNameChange}
          sx={{ mr: 2, flexGrow: 1 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={isFlowActive}
                onChange={handleToggleActive}
                color={isFlowActive ? 'success' : 'default'}
              />
            }
            label={
              <Typography variant="body2" color={isFlowActive ? 'success.main' : 'text.secondary'}>
                {isFlowActive ? 'Active' : 'Inactive'}
              </Typography>
            }
            sx={{ mr: 2 }}
          />

          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={onSaveFlow}
            disabled={!isDirty}
            sx={{ mr: 1 }}
          >
            Save
          </Button>

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={onNewFlow}
            sx={{ mr: 1 }}
          >
            New
          </Button>

          <Tooltip title="Delete Flow">
            <IconButton color="error" onClick={handleDeleteClick}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          label="Description"
          variant="outlined"
          size="small"
          value={flowDescription}
          onChange={handleFlowDescriptionChange}
          fullWidth
          multiline
          maxRows={2}
        />

        <Tooltip title="Flow tips">
          <IconButton sx={{ ml: 1 }}>
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Flow?</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this flow? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FlowHeader; 