import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ContactsIcon from '@mui/icons-material/Contacts';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }: { theme: any }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

interface SideNavProps {
  open: boolean;
  onDrawerClose: () => void;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

const SideNav: React.FC<SideNavProps> = ({ open, onDrawerClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mainNavItems: NavItem[] = [
    { title: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { title: 'Flow Editor', path: '/flow-editor', icon: <AccountTreeIcon /> },
    { title: 'Contacts', path: '/contacts', icon: <ContactsIcon /> },
    { title: 'Chat', path: '/chat', icon: <ChatIcon /> },
  ];

  const secondaryNavItems: NavItem[] = [
    { title: 'Settings', path: '/settings', icon: <SettingsIcon /> },
    { title: 'Help', path: '/help', icon: <HelpIcon /> },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader>
        {user && (
          <Box sx={{ flexGrow: 1, pl: 2 }}>
            <Typography variant="subtitle2">
              {typeof user.name === 'string' ? user.name : 'User'}
            </Typography>
          </Box>
        )}
        <IconButton onClick={onDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {mainNavItems.map((item) => (
          <ListItem key={item.title} disablePadding>
            <ListItemButton 
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {secondaryNavItems.map((item) => (
          <ListItem key={item.title} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default SideNav; 