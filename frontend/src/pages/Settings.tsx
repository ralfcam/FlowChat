import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [saved, setSaved] = useState(false);

  // Profile settings
  const [profileSettings, setProfileSettings] = useState({
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '+1234567890',
  });

  // WhatsApp settings
  const [whatsappSettings, setWhatsappSettings] = useState({
    apiKey: 'wha_123456789abcdef',
    phoneNumberId: '1234567890',
    businessAccountId: '9876543210',
    webhookUrl: 'https://api.example.com/webhook/whatsapp',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    desktopNotifications: true,
    soundAlerts: true,
    newMessageNotifications: true,
    systemNotifications: false,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfileSettings({
      ...profileSettings,
      [event.target.name]: event.target.value,
    });
    setSaved(false);
  };

  const handleWhatsAppChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsappSettings({
      ...whatsappSettings,
      [event.target.name]: event.target.value,
    });
    setSaved(false);
  };

  const handleNotificationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotificationSettings({
      ...notificationSettings,
      [event.target.name]: event.target.checked,
    });
    setSaved(false);
  };

  const handleSave = () => {
    // Here you would call an API to save the settings
    console.log('Saving settings:', {
      profile: profileSettings,
      whatsapp: whatsappSettings,
      notifications: notificationSettings,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab label="Profile" {...a11yProps(0)} />
            <Tab label="WhatsApp" {...a11yProps(1)} />
            <Tab label="Notifications" {...a11yProps(2)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Profile Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={profileSettings.name}
                onChange={handleProfileChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={profileSettings.email}
                onChange={handleProfileChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={profileSettings.phone}
                onChange={handleProfileChange}
                margin="normal"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            WhatsApp API Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="API Key"
                name="apiKey"
                value={whatsappSettings.apiKey}
                onChange={handleWhatsAppChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Phone Number ID"
                name="phoneNumberId"
                value={whatsappSettings.phoneNumberId}
                onChange={handleWhatsAppChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Business Account ID"
                name="businessAccountId"
                value={whatsappSettings.businessAccountId}
                onChange={handleWhatsAppChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Webhook URL"
                name="webhookUrl"
                value={whatsappSettings.webhookUrl}
                onChange={handleWhatsAppChange}
                margin="normal"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onChange={handleNotificationChange}
                  name="emailNotifications"
                  color="primary"
                />
              }
              label="Email Notifications"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Receive notifications via email for important updates
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.desktopNotifications}
                  onChange={handleNotificationChange}
                  name="desktopNotifications"
                  color="primary"
                />
              }
              label="Desktop Notifications"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Show desktop notifications when new messages arrive
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.soundAlerts}
                  onChange={handleNotificationChange}
                  name="soundAlerts"
                  color="primary"
                />
              }
              label="Sound Alerts"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Play sound when new messages are received
            </Typography>

            <Divider sx={{ my: 2 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.newMessageNotifications}
                  onChange={handleNotificationChange}
                  name="newMessageNotifications"
                  color="primary"
                />
              }
              label="New Message Notifications"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Get notified when new messages arrive
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.systemNotifications}
                  onChange={handleNotificationChange}
                  name="systemNotifications"
                  color="primary"
                />
              }
              label="System Notifications"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Get notified about system updates and maintenance
            </Typography>
          </Box>
        </TabPanel>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings; 