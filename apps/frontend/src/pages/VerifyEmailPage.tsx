import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '@/api/authApi';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/Button';

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Verification token is missing. Please check your link.');
            return;
        }

        const doVerification = async () => {
            try {
                const responseMessage = await verifyEmail(token);
                setStatus('success');
                setMessage(responseMessage);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data || 'An unknown error occurred.');
            }
        };

        doVerification();
    }, [token]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <>
                        <Icon icon="lucide:loader" className="h-16 w-16 animate-spin text-primary" />
                        <h1 className="mt-8 text-2xl font-semibold">Verifying your email...</h1>
                    </>
                );
            case 'success':
                return (
                    <>
                        <Icon icon="lucide:check-circle" className="h-16 w-16 text-status-success" />
                        <h1 className="mt-8 text-2xl font-semibold">Verification Successful!</h1>
                        <p className="mt-2 text-text-secondary">{message}</p>
                        <Button asChild className="mt-8">
                            <Link to="/auth">Proceed to Login</Link>
                        </Button>
                    </>
                );
            case 'error':
                return (
                    <>
                        <Icon icon="lucide:x-circle" className="h-16 w-16 text-status-error" />
                        <h1 className="mt-8 text-2xl font-semibold">Verification Failed</h1>
                        <p className="mt-2 text-text-secondary">{message}</p>
                    </>
                );
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background-light p-4 text-center">
            {renderContent()}
        </div>
    );
};

export default VerifyEmailPage;