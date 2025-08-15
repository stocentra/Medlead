import { useEffect } from 'react';
import { Paper, Typography, Box, List, ListItem, ListItemIcon, ListItemText, CircularProgress, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { useStatusStore } from '@/store/useStatusStore';

const statusMap = {
    Operational: {
        icon: <CheckCircleIcon color="success" />,
        color: 'success.main',
    },
    'Degraded Performance': {
        icon: <WarningIcon color="warning" />,
        color: 'warning.main',
    },
    Outage: {
        icon: <ErrorIcon color="error" />,
        color: 'error.main',
    },
};

const StatusWidget = () => {
    const { services, status, lastUpdated, fetchStatuses } = useStatusStore();

    useEffect(() => {
        fetchStatuses(); // Fetch on initial render
        const intervalId = setInterval(fetchStatuses, 60000); // Refresh every 60 seconds
        return () => clearInterval(intervalId);
    }, [fetchStatuses]);

    return (
        <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Live System Status</Typography>
                {status === 'loading' && <CircularProgress size={20} />}
            </Box>
             <Typography variant="caption" color="text.secondary">
                {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
            </Typography>
            <List sx={{ mt: 1 }}>
                {services.map((service) => (
                    <Tooltip title={service.description} placement="left" key={service.name}>
                        <ListItem disablePadding>
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                {statusMap[service.status].icon}
                            </ListItemIcon>
                            <ListItemText 
                                primary={service.name} 
                                secondary={service.status}
                                secondaryTypographyProps={{ color: statusMap[service.status].color, fontWeight: 'bold' }}
                            />
                        </ListItem>
                    </Tooltip>
                ))}
            </List>
        </Paper>
    );
};

export default StatusWidget;