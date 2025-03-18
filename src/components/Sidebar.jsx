import React from 'react';
import { Drawer, Box, useMediaQuery, useTheme } from '@mui/material';
import SidebarContent from './SidebarContent';

const Sidebar = ({ open, onClose, onNavigate }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Drawer
      variant={isDesktop ? "persistent" : "temporary"}
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          top: '64px',
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <SidebarContent onNavigate={() => {
        if (!isDesktop) {
          onClose();
        }
        if (onNavigate) {
          onNavigate();
        }
      }} />
    </Drawer>
  );
};

export default Sidebar; 