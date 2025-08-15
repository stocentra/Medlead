import { useEffect } from 'react';
import { Typography, Box, Grid, CircularProgress, Alert, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider } from '@mui/material';
import { useDashboardStore } from '../store/useDashboardStore';
import StatCard from '../components/dashboard/StatCard';
import StatusWidget from '../components/dashboard/StatusWidget'; // New Import
import PeopleIcon from '@mui/icons-material/People';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import BlockIcon from '@mui/icons-material/Block';

const DashboardPage = () => {
    const { stats, recentUsers, status, fetchDashboardData } = useDashboardStore();

    useEffect(() => {
        if (status === 'idle') {
            fetchDashboardData();
        }
    }, [status, fetchDashboardData]);

    if (status === 'loading' || status === 'idle') {
        return <CircularProgress />;
    }

    if (status === 'error') {
        return <Alert severity="error">Failed to load dashboard data.</Alert>;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Total Users" value={stats.totalUsers} icon={<PeopleIcon />} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Pending Verifications" value={stats.pendingVerifications} icon={<PendingActionsIcon />} color="warning.main" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Active Subscriptions" value={stats.activeSubscriptions} icon={<CardMembershipIcon />} color="success.main" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Suspended Accounts" value={stats.suspendedUsers} icon={<BlockIcon />} color="error.main" /></Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Recent Users Section */}
                <Grid item xs={12} md={8}>
                    <Paper>
                        <Box sx={{ p: 2 }}>
                            <Typography variant="h6">Recent Registrations</Typography>
                        </Box>
                        <List>
                            {recentUsers.map((user, index) => (
                                <div key={user.id}>
                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar>{user.full_name.charAt(0)}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary={user.full_name} 
                                            secondary={user.email} 
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </Typography>
                                    </ListItem>
                                    {index < recentUsers.length - 1 && <Divider component="li" />}
                                </div>
                            ))}
                        </List>
                    </Paper>
                </Grid>
                {/* Live Status Widget */}
                <Grid item xs={12} md={4}>
                    <StatusWidget />
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;