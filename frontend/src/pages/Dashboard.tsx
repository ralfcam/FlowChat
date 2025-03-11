import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const Item = styled(Paper)(({ theme }: { theme: any }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: '100%',
}));

const Dashboard: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Item>
            <Typography variant="h6" component="h2">
              Active Contacts
            </Typography>
            <Typography variant="h3" component="div" sx={{ mt: 2 }}>
              1,234
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Item>
            <Typography variant="h6" component="h2">
              Messages Today
            </Typography>
            <Typography variant="h3" component="div" sx={{ mt: 2 }}>
              567
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Item>
            <Typography variant="h6" component="h2">
              Active Flows
            </Typography>
            <Typography variant="h3" component="div" sx={{ mt: 2 }}>
              12
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Item>
            <Typography variant="h6" component="h2">
              Response Rate
            </Typography>
            <Typography variant="h3" component="div" sx={{ mt: 2 }}>
              92%
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12} md={8}>
          <Item>
            <Typography variant="h6" component="h2" align="left">
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              {/* Activity list would go here */}
              <Typography variant="body1">No recent activity to display</Typography>
            </Box>
          </Item>
        </Grid>
        <Grid item xs={12} md={4}>
          <Item>
            <Typography variant="h6" component="h2" align="left">
              Quick Actions
            </Typography>
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              {/* Quick action buttons would go here */}
              <Typography variant="body1">No quick actions available</Typography>
            </Box>
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 