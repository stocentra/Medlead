import { useEffect } from 'react';
import { Typography, Box, Alert, CircularProgress, Chip } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useAuditLogStore } from '@/store/useAuditLogStore';
import { AuditLog } from '@/types';

const columns: GridColDef<AuditLog>[] = [
    { 
        field: 'timestamp', 
        headerName: 'Date & Time',
        width: 200,
        renderCell: (params: GridRenderCellParams) => new Date(params.value).toLocaleString()
    },
    { field: 'admin_name', headerName: 'Admin', width: 200 },
    { 
        field: 'action', 
        headerName: 'Action Type', 
        width: 180,
        renderCell: (params: GridRenderCellParams) => <Chip label={params.value} size="small" />
    },
    { field: 'details', headerName: 'Details', width: 500 },
];

const AuditLogPage = () => {
    const { logs, status, error, fetchLogs } = useAuditLogStore();

    useEffect(() => {
        if (status === 'idle') {
            fetchLogs();
        }
    }, [status, fetchLogs]);

    return (
        <Box sx={{ height: '80vh', width: '100%' }}>
            <Typography variant="h4" gutterBottom>
                Admin Activity Log
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                A record of all important administrative actions performed in the panel.
            </Typography>

            {status === 'loading' && <CircularProgress />}
            {status === 'error' && <Alert severity="error">{error}</Alert>}
            
            {status === 'success' && (
                 <DataGrid
                    rows={logs}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 20 },
                        },
                        sorting: {
                            sortModel: [{ field: 'timestamp', sort: 'desc' }],
                        },
                    }}
                    pageSizeOptions={[20, 50, 100]}
                />
            )}
        </Box>
    );
};

export default AuditLogPage;