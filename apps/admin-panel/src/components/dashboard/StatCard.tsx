import { Card, CardContent, Typography, Box } from '@mui/material';
import { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    color?: string;
}

const StatCard = ({ title, value, icon, color = 'primary.main' }: StatCardProps) => {
    return (
        <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{
                    mr: 2,
                    p: 1.5,
                    bgcolor: color,
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {icon}
                </Box>
                <Box>
                    <Typography color="text.secondary" variant="body2">{title}</Typography>
                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                        {value}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default StatCard;