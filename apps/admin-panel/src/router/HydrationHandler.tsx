import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Box, CircularProgress } from '@mui/material';

interface HydrationHandlerProps {
    children: React.ReactNode;
}

const HydrationHandler = ({ children }: HydrationHandlerProps) => {
    const [isHydrated, setHydrated] = useState(false);

    useEffect(() => {
        // This is the official way to wait for the zustand persist middleware to finish hydration
        const unsub = useAuthStore.persist.onFinishHydration(() => {
            setHydrated(true);
        });

        // If hydration is already finished, set the state immediately
        if (useAuthStore.persist.hasHydrated()) {
            setHydrated(true);
        }

        return () => {
            unsub();
        };
    }, []);

    // While hydrating, show a full-screen loader
    if (!isHydrated) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }
    
    // Once hydrated, render the actual application
    return <>{children}</>;
};

export default HydrationHandler;