import { Card, CardContent, Typography, Box, Chip, Divider, Button } from '@mui/material';
import { User } from '@/types';
import { specialties } from '../../lib/constants';
import { useUserStore } from '../../store/useUserStore';

const getSpecialtyName = (id: number | undefined) => {
    if (!id) return '-';
    return specialties.find(s => s.id === id)?.name || 'Unknown';
};

interface UserInfoCardProps {
    user: User;
}

const UserInfoCard = ({ user }: UserInfoCardProps) => {
    const { updateUser } = useUserStore();

    const DetailItem = ({ label, value }: { label: string; value: string | undefined | null }) => (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>{value || '-'}</Typography>
        </Box>
    );

    const handleSuspendToggle = () => {
        const newStatus = user.account_status === 'active' ? 'suspended' : 'active';
        const actionText = newStatus === 'suspended' ? 'suspend' : 'reactivate';
        if (window.confirm(`Are you sure you want to ${actionText} ${user.full_name}?`)) {
            updateUser(user.id, { account_status: newStatus });
        }
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h5" gutterBottom>
                        {user.full_name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        {user.email}
                    </Typography>
                    <Chip
                        label={user.verification_status.replace(/_/g, ' ')}
                        color={user.verification_status === 'verified' ? 'success' : user.verification_status === 'pending' ? 'warning' : 'error'}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                    />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" sx={{ mb: 1 }}>Personal Details</Typography>
                <DetailItem label="User ID" value={user.id} />
                <DetailItem label="Phone Number" value={user.phone_number} />
                <DetailItem label="Country / City" value={`${user.country} / ${user.city || ''}`} />
                <DetailItem label="National ID" value={user.national_id} />
                <DetailItem label="Gender" value={user.gender} />

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" sx={{ mb: 1 }}>Professional Profile</Typography>
                <DetailItem label="Level" value={user.professional_level.replace(/_/g, ' ')} />
                <DetailItem label="System Role" value={user.system_role} />
                <DetailItem label="University" value={user.university} />
                <DetailItem label="Student ID" value={user.student_id} />
                <DetailItem label="Medical License #" value={user.medical_license_number} />
                <DetailItem label="Specialty" value={getSpecialtyName(user.specialty_id)} />
                <DetailItem label="Registered On" value={new Date(user.created_at).toLocaleDateString()} />

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" sx={{ mb: 2 }}>Admin Actions</Typography>
                <Button
                    variant="contained"
                    color={user.account_status === 'active' ? 'error' : 'success'}
                    onClick={handleSuspendToggle}
                    fullWidth
                >
                    {user.account_status === 'active' ? 'Suspend User Account' : 'Reactivate User Account'}
                </Button>
            </CardContent>
        </Card>
    );
};

export default UserInfoCard;