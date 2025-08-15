import { useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { useSystemHealthStore } from '../store/useSystemHealthStore';
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import DeveloperBoardIcon from '@mui/icons-material/DeveloperBoard';
import StatCard from '../components/dashboard/StatCard';

const SystemHealthPage = () => {
    const { stats, status, error, fetchSystemHealth } = useSystemHealthStore();

    useEffect(() => {
        // Fetch initially when the component mounts
        fetchSystemHealth();

        // Set up a polling interval to refresh the data periodically
        const intervalId = setInterval(fetchSystemHealth, 30000); // Refresh every 30 seconds

        // Cleanup interval on component unmount to prevent memory leaks
        return () => clearInterval(intervalId);
    }, [fetchSystemHealth]);

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                System Health & Monitoring
            </Typography>
            
            {status === 'loading' && !stats && <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>}
            {status === 'error' && <Alert severity="error">{error}</Alert>}
            
            {stats && (
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {/* Current Usage Cards */}
                    <Grid item xs={12} md={4}>
                        <StatCard title="Current CPU Usage" value={`${stats.currentCpu.toFixed(1)}%`} icon={<MemoryIcon />} color="primary.main" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StatCard title="Current RAM Usage" value={`${stats.currentRam.toFixed(2)} GB`} icon={<SpeedIcon />} color="success.main" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <StatCard title="Current GPU Usage" value={`${stats.currentGpu.toFixed(1)}%`} icon={<DeveloperBoardIcon />} color="secondary.main" />
                    </Grid>

                    {/* Chart Placeholders */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3, height: '350px' }}>
                            <Typography variant="h6" gutterBottom>CPU Usage (%) Over Time</Typography>
                            <Box sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography color="text.secondary">[Future Chart: CPU Usage - Recharts LineChart with `stats.cpuUsage` data]</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                     <Grid item xs={12}>
                        <Paper sx={{ p: 3, height: '350px' }}>
                            <Typography variant="h6" gutterBottom>RAM Usage (GB) Over Time</Typography>
                             <Box sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography color="text.secondary">[Future Chart: RAM Usage - Recharts LineChart with `stats.ramUsage` data]</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                     <Grid item xs={12}>
                        <Paper sx={{ p: 3, height: '350px' }}>
                            <Typography variant="h6" gutterBottom>GPU Usage (%) Over Time</Typography>
                            <Box sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography color="text.secondary">[Future Chart: GPU Usage - Recharts LineChart with `stats.gpuUsage` data]</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default SystemHealthPage;