import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Re-added Link for Breadcrumbs
import { useUserStore } from '../../store/useUserStore';
import { Box, Typography, CircularProgress, Alert, Grid, Breadcrumbs } from '@mui/material'; // Corrected: Changed @mui/giza to @mui/material
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import UserInfoCard from './UserInfoCard';
import SubscriptionManagementCard from './SubscriptionManagementCard';
import VerificationDocumentCard from './VerificationDocumentCard';

const UserDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const { selectedUser, status, error, fetchUserById } = useUserStore();

    useEffect(() => {
        if (id) {
            fetchUserById(id);
        }
    }, [id, fetchUserById]);

    return (
        <Box>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
                <Link to="/users" style={{textDecoration: 'none', color: 'inherit'}}>
                    User Management
                </Link>
                <Typography color="text.primary">{selectedUser?.full_name || 'Loading...'}</Typography>
            </Breadcrumbs>

            {status === 'loading' && <CircularProgress />}
            {status === 'error' && <Alert severity="error">{error}</Alert>}
            
            {status === 'success' && selectedUser && (
                <Grid container spacing={3}>
                    {/* Column 1: User Info & Actions */}
                    <Grid item xs={12} md={5}>
                       <UserInfoCard user={selectedUser} />
                    </Grid>
                    {/* Column 2: Subscription & Document */}
                    <Grid item xs={12} md={7}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <SubscriptionManagementCard user={selectedUser} />
                            </Grid>
                            <Grid item xs={12}>
                                <VerificationDocumentCard user={selectedUser} />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default UserDetailPage;