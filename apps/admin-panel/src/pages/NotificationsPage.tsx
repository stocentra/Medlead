import { useEffect } from 'react';
import { Box, Typography, Grid, Paper, TextField, Button, List, ListItem, ListItemText, Divider, CircularProgress, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useNotificationStore } from '../store/useNotificationStore';
import { NotificationSubmitData } from '@/types';

const NotificationsPage = () => {
    const { notifications, status, error, fetchNotifications, sendNotification } = useNotificationStore();
    const { control, handleSubmit, formState: { isSubmitting, errors }, reset } = useForm<NotificationSubmitData>({
        defaultValues: { title: '', message: '' }
    });

    useEffect(() => {
        if (status === 'idle') {
            fetchNotifications();
        }
    }, [status, fetchNotifications]);

    const onSubmit: SubmitHandler<NotificationSubmitData> = async (data) => {
        // THE FIX: The second argument (adminName) is now removed to match the store's function signature.
        const success = await sendNotification(data);
        if (success) {
            reset(); 
            alert('Notification sent successfully to all users!');
        } else {
            alert('Failed to send notification. Please try again.');
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Broadcast Notifications</Typography>
            <Grid container spacing={4}>
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Compose New Message</Typography>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Controller
                                name="title"
                                control={control}
                                rules={{ required: 'Title is required' }}
                                render={({ field }) => (
                                    <TextField 
                                        {...field}
                                        label="Title"
                                        fullWidth
                                        margin="normal"
                                        error={!!errors.title}
                                        helperText={errors.title?.message}
                                    />
                                )}
                            />
                            <Controller
                                name="message"
                                control={control}
                                rules={{ required: 'Message is required' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Message"
                                        fullWidth
                                        multiline
                                        rows={6}
                                        margin="normal"
                                        error={!!errors.message}
                                        helperText={errors.message?.message}
                                    />
                                )}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<SendIcon />}
                                disabled={isSubmitting}
                                sx={{ mt: 2 }}
                                fullWidth
                            >
                                {isSubmitting ? 'Sending...' : 'Send to All Users'}
                            </Button>
                        </form>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={7}>
                     <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Sent History</Typography>
                        {status === 'loading' && <CircularProgress />}
                        {status === 'error' && <Alert severity="error">{error}</Alert>}
                        {status === 'success' && (
                            <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                                {notifications.map((notif, index) => (
                                    <div key={notif.id}>
                                        <ListItem alignItems="flex-start">
                                            <ListItemText
                                                primary={notif.title}
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="text.primary">
                                                            {notif.message}
                                                        </Typography>
                                                        <Typography component="span" variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                                            {`Sent by ${notif.sent_by} on ${new Date(notif.created_at).toLocaleString()}`}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        {index < notifications.length - 1 && <Divider component="li" />}
                                    </div>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default NotificationsPage;