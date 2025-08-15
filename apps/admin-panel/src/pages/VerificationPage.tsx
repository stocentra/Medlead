import { useEffect } from 'react';
import { Typography, Box, Alert, CircularProgress } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useUserStore } from '@/store/useUserStore';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';

// Define columns for the DataGrid
const columns: GridColDef<User>[] = [
    { field: 'full_name', headerName: 'Full Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'professional_level', headerName: 'Level', width: 180 },
    { field: 'country', headerName: 'Country', width: 120 },
    { 
        field: 'created_at', 
        headerName: 'Registration Date',
        width: 180,
        renderCell: (params: GridRenderCellParams) => new Date(params.value).toLocaleDateString()
    },
];

const VerificationPage = () => {
    const { pendingVerificationUsers, status, error, fetchPendingVerificationUsers } = useUserStore();
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch users when the component mounts
        fetchPendingVerificationUsers();
    }, [fetchPendingVerificationUsers]);

    const handleRowClick = (params: any) => {
        // Navigate to the detail page when a row is clicked
        navigate(`/users/${params.id}`);
    };

    return (
        <Box sx={{ height: '80vh', width: '100%' }}>
            <Typography variant="h4" gutterBottom>
                Verification Queue
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Users who have submitted their documents and are waiting for approval.
            </Typography>

            {status === 'loading' && <CircularProgress />}
            {status === 'error' && <Alert severity="error">{error}</Alert>}
            
            {status === 'success' && (
                 <DataGrid
                    rows={pendingVerificationUsers}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 20 },
                        },
                    }}
                    pageSizeOptions={[10, 20, 50]}
                    onRowClick={handleRowClick}
                    sx={{
                        '& .MuiDataGrid-row:hover': {
                            cursor: 'pointer',
                        },
                    }}
                />
            )}
        </Box>
    );
};

export default VerificationPage;