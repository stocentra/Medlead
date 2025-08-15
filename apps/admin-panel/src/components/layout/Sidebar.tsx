import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import DnsIcon from '@mui/icons-material/Dns';
import HistoryIcon from '@mui/icons-material/History'; // New Icon
import { NavLink } from 'react-router-dom';

interface SidebarProps {
    drawerWidth: number;
}

const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', end: true },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics', end: false },
    { text: 'Financials', icon: <MonetizationOnIcon />, path: '/financials', end: false },
    { text: 'System Health', icon: <DnsIcon />, path: '/system-health', end: false },
    { text: 'Verification', icon: <FactCheckIcon />, path: '/verification', end: false },
    { text: 'Users', icon: <PeopleIcon />, path: '/users', end: false },
    { text: 'Discount Codes', icon: <ConfirmationNumberIcon />, path: '/discounts', end: false },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications', end: false },
    { text: 'Audit Log', icon: <HistoryIcon />, path: '/audit-log', end: false }, // New Item
];

const Sidebar = ({ drawerWidth }: SidebarProps) => {
    // ... (rest of the component remains the same)
    const drawerContent = (
        <div>
            <Toolbar />
            <Divider />
            <List>
                {navItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            component={NavLink}
                            to={item.path}
                            end={item.end}
                            sx={{
                                '&.active': {
                                    backgroundColor: 'primary.main',
                                    color: 'primary.contrastText',
                                    '& .MuiSvgIcon-root': {
                                        color: 'primary.contrastText',
                                    },
                                    '&:hover': {
                                        backgroundColor: 'primary.dark',
                                    }
                                },
                            }}
                        >
                            <ListItemIcon>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Drawer
            variant="permanent"
            sx={{
                display: { xs: 'none', sm: 'block' },
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default Sidebar;