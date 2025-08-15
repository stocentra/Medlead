import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 240;

const AdminLayout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Topbar drawerWidth={DRAWER_WIDTH} />
      <Sidebar drawerWidth={DRAWER_WIDTH} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar /> {/* Spacer for the Topbar */}
        <Outlet /> {/* Renders the active child route */}
      </Box>
    </Box>
  );
};

export default AdminLayout;