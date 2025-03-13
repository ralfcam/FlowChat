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
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Tabs,
  Tab,
  Divider
} from './MaterialImports';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { FlowData } from '../../services/flowService';

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
  onLoad?: () => void;
  onFlowSelect?: (e: React.ChangeEvent<{ value: unknown }>) => void;
  onCreateFromPreset?: (presetId: string) => void;
  isLoading?: boolean;
  flows?: FlowData[];
  presetFlows?: FlowData[];
  currentFlowId?: string | null;
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
  onDelete,
  onLoad,
  onFlowSelect,
  onCreateFromPreset,
  isLoading = false,
  flows = [],
  presetFlows = [],
  currentFlowId = null
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [loadDialogTab, setLoadDialogTab] = useState<number>(0);
  const [presetNameDialogOpen, setPresetNameDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

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

  const handleOpenLoadDialog = () => {
    if (onLoad) {
      onLoad();
    }
    setLoadDialogOpen(true);
  };

  const handleCloseLoadDialog = () => {
    setLoadDialogOpen(false);
    setLoadDialogTab(0);
  };
  
  const handleLoadTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setLoadDialogTab(newValue);
  };
  
  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
  };
  
  const handleOpenPresetNameDialog = () => {
    setNewPresetName(`Copy of ${presetFlows.find(p => p._id === selectedPresetId)?.name || 'Preset'}`);
    setPresetNameDialogOpen(true);
  };
  
  const handleClosePresetNameDialog = () => {
    setPresetNameDialogOpen(false);
  };
  
  const handleCreateFromPreset = () => {
    if (onCreateFromPreset && selectedPresetId) {
      onCreateFromPreset(selectedPresetId);
      setLoadDialogOpen(false);
      setPresetNameDialogOpen(false);
    }
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
          label={<Typography>{isActive ? "Active" : "Inactive"}</Typography>}
        />
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Save Flow">
            <span>
              <Button
                variant="contained"
                color="primary"
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={onSave}
                disabled={!isDirty || isLoading}
              >
                Save
              </Button>
            </span>
          </Tooltip>
          
          {onLoad && (
            <Tooltip title="Load Flow or Preset">
              <IconButton
                color="primary"
                onClick={handleOpenLoadDialog}
                disabled={isLoading}
              >
                <FolderOpenIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="New Flow">
            <IconButton
              color="primary"
              onClick={onNew}
              disabled={isLoading}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete Flow">
            <IconButton
              color="error"
              onClick={handleOpenDeleteDialog}
              disabled={isLoading}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Delete Dialog */}
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

      {/* Load Dialog */}
      {onFlowSelect && (
        <Dialog
          open={loadDialogOpen}
          onClose={handleCloseLoadDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Load Flow</DialogTitle>
          <DialogContent>
            <Box sx={{ width: '100%', mb: 2 }}>
              <Tabs value={loadDialogTab} onChange={handleLoadTabChange} centered>
                <Tab label="My Flows" />
                <Tab label="Preset Flows" />
              </Tabs>
            </Box>
            
            {loadDialogTab === 0 && (
              <>
                <DialogContentText>
                  Select one of your flows to load. Any unsaved changes will be lost.
                </DialogContentText>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="flow-select-label">Select Flow</InputLabel>
                  <Select
                    labelId="flow-select-label"
                    value={currentFlowId || ''}
                    label="Select Flow"
                    onChange={(e) => {
                      if (onFlowSelect) {
                        onFlowSelect(e as any);
                        handleCloseLoadDialog();
                      }
                    }}
                  >
                    {flows.length === 0 && (
                      <MenuItem disabled>No flows available</MenuItem>
                    )}
                    {flows.map((flow) => (
                      <MenuItem key={flow._id} value={flow._id}>
                        {flow.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
            
            {loadDialogTab === 1 && (
              <>
                <DialogContentText>
                  Select a preset flow as a starting point for a new flow.
                </DialogContentText>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="preset-select-label">Select Preset</InputLabel>
                  <Select
                    labelId="preset-select-label"
                    value={selectedPresetId}
                    label="Select Preset"
                    onChange={(e) => handlePresetSelect(e.target.value as string)}
                  >
                    {presetFlows.length === 0 && (
                      <MenuItem disabled>No preset flows available</MenuItem>
                    )}
                    {presetFlows.map((flow) => (
                      <MenuItem key={flow._id} value={flow._id}>
                        {flow.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ContentCopyIcon />}
                    disabled={!selectedPresetId || !onCreateFromPreset}
                    onClick={handleCreateFromPreset}
                  >
                    Use This Preset
                  </Button>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseLoadDialog} color="primary">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}
      
      {/* Preset Name Dialog */}
      <Dialog
        open={presetNameDialogOpen}
        onClose={handleClosePresetNameDialog}
      >
        <DialogTitle>New Flow from Preset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a name for your new flow based on the selected preset.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Flow Name"
            type="text"
            fullWidth
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePresetNameDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateFromPreset} 
            color="primary"
            disabled={!newPresetName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FlowHeader; 