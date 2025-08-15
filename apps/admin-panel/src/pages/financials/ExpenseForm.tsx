import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, MenuItem } from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { ExpenseSubmitData } from '@/types';
import { useFinancialStore } from '@/store/useFinancialStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface ExpenseFormProps {
    open: boolean;
    onClose: () => void;
}

// Zod schema will handle the validation and type coercion
const expenseSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    amount: z.coerce.number().positive('Amount must be a positive number'),
    category: z.enum(['Hosting', 'API Costs', 'Marketing', 'Salaries', 'Other']),
    expense_date: z.string().min(1, 'Date is required'),
});

const ExpenseForm = ({ open, onClose }: ExpenseFormProps) => {
    const { addExpense } = useFinancialStore();
    const { control, handleSubmit, formState: { errors }, reset } = useForm<ExpenseSubmitData>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            description: '',
            amount: undefined,
            category: 'Other',
            expense_date: new Date().toISOString().split('T')[0],
        }
    });

    const onSubmit: SubmitHandler<ExpenseSubmitData> = async (data) => {
        await addExpense(data);
        reset();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Expense</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid item xs={12}>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => <TextField {...field} label="Description" fullWidth error={!!errors.description} helperText={errors.description?.message} />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Controller
                                name="amount"
                                control={control}
                                // THE FIX: 'valueAsNumber' rule is removed. Zod handles coercion.
                                render={({ field }) => <TextField {...field} type="number" label="Amount (USD)" fullWidth error={!!errors.amount} helperText={errors.amount?.message} />}
                            />
                        </Grid>
                         <Grid item xs={6}>
                            <Controller
                                name="category"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} select label="Category" fullWidth>
                                        <MenuItem value="Hosting">Hosting</MenuItem>
                                        <MenuItem value="API Costs">API Costs</MenuItem>
                                        <MenuItem value="Marketing">Marketing</MenuItem>
                                        <MenuItem value="Salaries">Salaries</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </TextField>
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="expense_date"
                                control={control}
                                render={({ field }) => <TextField {...field} type="date" label="Date of Expense" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.expense_date} helperText={errors.expense_date?.message} />}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained">Save Expense</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ExpenseForm;