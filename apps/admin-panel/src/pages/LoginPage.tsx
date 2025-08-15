import { Box, Button, Container, Paper, TextField, Typography, Alert } from '@mui/material';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form'; // Import from react-hook-form
import { AdminLoginRequest } from '@/api/authApi';

const LoginPage = () => {
    const { login, status, message, token } = useAuthStore();
    const navigate = useNavigate();
    // Setup react-hook-form
    const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginRequest>();

    const isLoading = status === 'loading';

    // Explicitly type the data parameter with SubmitHandler
    const onSubmit: SubmitHandler<AdminLoginRequest> = async (data) => {
        try {
            await login(data);
        } catch (error) {
            console.error(error);
        }
    };
    
    useEffect(() => {
        // If login is successful (token exists), redirect to dashboard
        if (token) {
            navigate('/');
        }
    }, [token, navigate]);

    return (
        <Container component="main" maxWidth="xs">
            <Paper
                elevation={3}
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 4,
                    borderRadius: 2,
                }}
            >
                <Typography component="h1" variant="h5">
                    Admin Panel Sign In
                </Typography>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 3, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        autoComplete="email"
                        autoFocus
                        // Register the field with validation rules
                        {...register('email', { required: 'Email is required' })}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        disabled={isLoading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        // Register the field with validation rules
                        {...register('password', { required: 'Password is required' })}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        disabled={isLoading}
                    />
                    {status === 'error' && message && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{message}</Alert>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isLoading}
                        sx={{ mt: 3, mb: 2 }}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default LoginPage;