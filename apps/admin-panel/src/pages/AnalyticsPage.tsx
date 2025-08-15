import { useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import GroupsIcon from '@mui/icons-material/Groups';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import SchoolIcon from '@mui/icons-material/School';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AttachmentIcon from '@mui/icons-material/Attachment';
import StatCard from '../components/dashboard/StatCard';

const AnalyticsPage = () => {
    const { stats, status, error, fetchStats } = useAnalyticsStore();

    useEffect(() => {
        if (status === 'idle') {
            fetchStats();
        }
    }, [status, fetchStats]);

    if (status === 'loading' || status === 'idle') {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    if (status === 'error' || !stats) {
        return <Alert severity="error">{error || 'Could not load analytics data.'}</Alert>;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Platform Analytics
            </Typography>
            
            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>User & Subscription Overview</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Total Users" value={stats.totalUsers} icon={<PeopleIcon />} /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Pro Members" value={stats.proMembers} icon={<WorkspacePremiumIcon />} color="secondary.main" /></Grid>
                <Grid item xs={12} sm={6} md={3}><StatCard title="Plus Members" value={stats.plusMembers} icon={<StarIcon />} color="primary.main" /></Grid>
                 <Grid item xs={12} sm={6} md={3}><StatCard title="Free Members" value={stats.freeMembers} icon={<PeopleIcon />} color="grey.500" /></Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>User Engagement</Typography>
             <Grid container spacing={3}>
                <Grid item xs={12} sm={4}><StatCard title="Daily Active Users" value={stats.dailyActiveUsers} icon={<GroupsIcon />} color="success.main" /></Grid>
                <Grid item xs={12} sm={4}><StatCard title="Weekly Active Users" value={stats.weeklyActiveUsers} icon={<GroupsIcon />} color="info.main" /></Grid>
                <Grid item xs={12} sm={4}><StatCard title="Monthly Active Users" value={stats.monthlyActiveUsers} icon={<GroupsIcon />} color="warning.main" /></Grid>
            </Grid>
            
            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>User Behavior & Activation</Typography>
             <Grid container spacing={3}>
                <Grid item xs={12} sm={4}><StatCard title="Activation Rate" value={`${stats.activationRate}%`} icon={<RocketLaunchIcon />} color="#c51162" /></Grid>
                <Grid item xs={12} sm={4}><StatCard title="File Upload Adoption" value={`${stats.featureAdoption_Fileupload}%`} icon={<AttachmentIcon />} color="#00b8d4" /></Grid>
                <Grid item xs={12} sm={4}><StatCard title="Avg. Chat Length" value={`${stats.averageConversationLength} msgs`} icon={<QuestionAnswerIcon />} color="#ff6d00" /></Grid>
            </Grid>
            <Grid container spacing={3} sx={{ mt: 1 }}>
                 {/* THE FIX: Replaced '->' with 'to' to avoid JSX parsing issues. */}
                 <Grid item xs={12}><Paper sx={{ p: 2, textAlign: 'center', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">[Future Chart: User Activation Funnel (Signup to First Chat to File Upload)]</Typography></Paper></Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>AI & Data Flywheel</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}><StatCard title="Training Datasets" value={`${stats.trainingDataCollected.toLocaleString()}`} icon={<DataUsageIcon />} color="#6a1b9a" /></Grid>
                <Grid item xs={12} sm={6}><StatCard title="Google Search Tool Usage" value={`${stats.googleSearchToolUsage}%`} icon={<TravelExploreIcon />} color="#00695c" /></Grid>
            </Grid>

             <Divider sx={{ my: 4 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>User Demographics</Typography>
             <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="subtitle1" gutterBottom>Users by Professional Level</Typography>
                        <List dense>
                            {Object.entries(stats.userByProfessionalLevel).map(([level, count]) => (
                                <ListItem key={level} disablePadding>
                                    <ListItemIcon sx={{minWidth: '40px'}}><SchoolIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary={level} />
                                    <Typography variant="body2" fontWeight="bold">{count}</Typography>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>
                 <Grid item xs={12} md={6}><Paper sx={{ p: 2, textAlign: 'center', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography color="text.secondary">[Future Map: User Geographic Distribution]</Typography></Paper></Grid>
            </Grid>
        </Box>
    );
};

export default AnalyticsPage;