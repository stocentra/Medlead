import { Card, CardContent, Typography, Box, Chip, Button, TextField, MenuItem, Grid, Alert } from '@mui/material';
import { User } from '@/types';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useUserStore } from '../../store/useUserStore';
import { useEffect } from 'react';

interface SubscriptionManagementCardProps {
    user: User;
}

interface SubscriptionFormData {
    plan: 'plus' | 'pro' | 'free'; 
    duration: number;
}

const SubscriptionManagementCard = ({ user }: SubscriptionManagementCardProps) => {
    const { updateUser } = useUserStore();
    // THE FIX: Destructure 'dirtyFields' to get fine-grained control over the form's state.
    const { control, handleSubmit, formState: { isDirty, dirtyFields }, reset } = useForm<SubscriptionFormData>({
        defaultValues: {
            plan: user.subscription_plan || 'plus',
            duration: 1,
        }
    });

    // This useEffect will reset the form state whenever the user prop changes
    // ensuring the 'dirty' state is always accurate after an update.
    useEffect(() => {
        reset({
            plan: user.subscription_plan || 'plus',
            duration: 1,
        });
    }, [user, reset]);


    const hasSubscription = !!user.subscription_plan;
    const isExpired = user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date();

    const onSubmit: SubmitHandler<SubscriptionFormData> = (data) => {
        let newExpirationDate: string;

        // THE FIX: Check if the duration field was actually changed by the admin.
        if (dirtyFields.duration) {
            // If duration was changed, calculate the new date.
            const baseDate = (hasSubscription && !isExpired) 
                ? new Date(user.subscription_expires_at!) 
                : new Date();
            
            const durationAsNumber = parseInt(String(data.duration), 10);
            baseDate.setMonth(baseDate.getMonth() + durationAsNumber);
            newExpirationDate = baseDate.toISOString();
        } else {
            // If only the plan was changed, keep the existing expiration date.
            // If there's no date, this will correctly pass undefined.
            newExpirationDate = user.subscription_expires_at!;
        }

        updateUser(user.id, {
            subscription_plan: data.plan,
            subscription_expires_at: newExpirationDate,
        });
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>Subscription Management</Typography>
                
                {hasSubscription ? (
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="body1">Current Plan:</Typography>
                            <Chip label={user.subscription_plan} color="primary" sx={{ textTransform: 'capitalize' }} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">Expires At:</Typography>
                            <Chip 
                                label={new Date(user.subscription_expires_at!).toLocaleDateString()}
                                color={isExpired ? 'error' : 'success'}
                            />
                         </Box>
                    </Box>
                ) : (
                    <Alert severity="info" sx={{ mb: 3 }}>This user does not have an active subscription.</Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>{hasSubscription ? 'Extend or Change Plan' : 'Grant New Subscription'}</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Controller
                                name="plan"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select label="Subscription Plan" fullWidth>
                                        <MenuItem value="plus">Plus</MenuItem>
                                        <MenuItem value="pro">Pro</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Controller
                                name="duration"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} type="number" label="Duration (Months)" fullWidth InputProps={{ inputProps: { min: 1 } }} />
                                )}
                            />
                        </Grid>
                    </Grid>
                    {/* THE FIX: The button is now enabled if ANY field is dirty. */}
                    <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={!isDirty}>
                        {hasSubscription ? 'Update Subscription' : 'Grant Subscription'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default SubscriptionManagementCard;