import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Chip } from '@mui/material';
import { DataGrid, GridActionsCellItem, GridRenderCellParams } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useDiscountStore } from '../../store/useDiscountStore';
import { AppDataGridColumns, DiscountCode, DiscountCodeSubmitData } from '../../types';
import DiscountCodeForm from './DiscountCodeForm';

const DiscountCodesPage: React.FC = () => {
  const {
    discountCodes,
    plans,
    isLoading,
    error,
    fetchDiscountCodes,
    fetchSubscriptionPlans,
    addDiscountCode,
    editDiscountCode,
    removeDiscountCode,
  } = useDiscountStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);

  useEffect(() => {
    fetchDiscountCodes();
    fetchSubscriptionPlans();
  }, [fetchDiscountCodes, fetchSubscriptionPlans]);

  const handleOpenForm = (code: DiscountCode | null = null) => {
    setEditingCode(code);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCode(null);
  };

  const handleSubmit = async (data: DiscountCodeSubmitData | Partial<DiscountCodeSubmitData>) => {
    try {
      if (editingCode) {
        await editDiscountCode(editingCode.id, data);
      } else {
        await addDiscountCode(data as DiscountCodeSubmitData);
      }
      handleCloseForm();
    } catch (apiError) {
      console.error('Failed to save discount code:', apiError);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this discount code?')) {
      removeDiscountCode(id);
    }
  };

  const columns: AppDataGridColumns<DiscountCode> = [
    { field: 'code', headerName: 'Code', flex: 1.5 },
    {
      field: 'plan_id',
      headerName: 'Assigned Plan',
      flex: 1.5,
      valueGetter: (value) => { // Using valueGetter as params.value is directly the plan_id
        const plan = plans.find((p) => p.id === value);
        return plan ? plan.name : 'General (All Plans)';
      },
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 1,
      renderCell: (params: GridRenderCellParams<DiscountCode, string>) => (
        <Typography sx={{ textTransform: 'capitalize' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'value',
      headerName: 'Value',
      flex: 1,
      renderCell: (params: GridRenderCellParams<DiscountCode, number>) => {
        // Accessing the full row data safely
        const { type, value } = params.row;
        return type === 'percentage' ? `${value}%` : `$${(Number(value) / 100).toFixed(2)}`;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params: GridRenderCellParams<DiscountCode, DiscountCode['status']>) => {
        const status = params.value;
        let color: 'success' | 'warning' | 'default' = 'default';
        if (status === 'active') color = 'success';
        if (status === 'expired') color = 'warning';
        return <Chip label={status?.replace('_', ' ')} color={color} size="small" sx={{ textTransform: 'capitalize' }} />;
      },
    },
    {
      field: 'expires_at',
      headerName: 'Expires At',
      flex: 1,
      valueFormatter: (value) => (value ? new Date(value).toLocaleDateString() : 'Never'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Edit />}
          label="Edit"
          onClick={() => handleOpenForm(params.row as DiscountCode)}
        />,
        <GridActionsCellItem
          icon={<Delete />}
          label="Delete"
          onClick={() => handleDelete(params.id as string)}
        />,
      ],
    },
  ];

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Discount Codes Management
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenForm()}>
          Create New Code
        </Button>
      </Box>
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={discountCodes}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          getRowId={(row) => row.id} // Ensure DataGrid knows how to get the unique ID
        />
      </Box>
      <DiscountCodeForm open={isFormOpen} onClose={handleCloseForm} onSubmit={handleSubmit} initialData={editingCode} />
    </Box>
  );
};

export default DiscountCodesPage;