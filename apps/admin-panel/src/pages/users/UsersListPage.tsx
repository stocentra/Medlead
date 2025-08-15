import { useEffect } from 'react';
import { Typography, Box, Alert, CircularProgress } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useUserStore } from '@/store/useUserStore';
import { Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Define columns for the DataGrid
const columns: GridColDef[] = [
    { field: 'full_name', headerName: 'Full Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'professional_level', headerName: 'Level', width: 180 },
    { 
        field: 'verification_status', 
        headerName: 'Verification', 
        width: 150,
        renderCell: (params: GridRenderCellParams) => {
            const status = params.value as string;
            let color: "success" | "warning" | "error" | "default" = "default";
            if (status === 'verified') color = 'success';
            if (status === 'pending') color = 'warning';
            if (status === 'rejected') color = 'error';
            return <Chip label={status.replace('_', ' ')} color={color} size="small" variant="outlined" />;
        }
    },
    { field: 'country', headerName: 'Country', width: 120 },
    { 
        field: 'system_role',
        headerName: 'Role',
        width: 120,
        renderCell: (params: GridRenderCellParams) => {
            const role = params.value as string;
            return <Chip label={role} color={role === 'admin' ? 'primary' : 'default'} size="small" />;
        }
    },
];


const UsersListPage = () => {
    const { users, status, error, fetchUsers } = useUserStore();
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch users when the component mounts
        fetchUsers();
    }, [fetchUsers]);

    const handleRowClick = (params: any) => {
        // Navigate to the detail page when a row is clicked
        navigate(`/users/${params.id}`);
    };

    return (
        <Box sx={{ height: '80vh', width: '100%' }}>
            <Typography variant="h4" gutterBottom>
                User Management
            </Typography>

            {status === 'loading' && <CircularProgress />}
            {status === 'error' && <Alert severity="error">{error}</Alert>}
            
            {status === 'success' && (
                 <DataGrid
                    rows={users}
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

export default UsersListPage;