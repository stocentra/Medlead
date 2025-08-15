import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useFinancialStore } from '../store/useFinancialStore';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AddIcon from '@mui/icons-material/Add';
import StatCard from '../components/dashboard/StatCard';
import ExpenseForm from '@/pages/financials/ExpenseForm';

const FinancialPage = () => {
    const { report, expenses, status, error, fetchFinancialData } = useFinancialStore();
    const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchFinancialData(period);
    }, [period, fetchFinancialData]);

    const handlePeriodChange = (_event: React.MouseEvent<HTMLElement>, newPeriod: 'monthly' | 'yearly' | null) => {
        if (newPeriod !== null) {
            setPeriod(newPeriod);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };
    
    return (
        <>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="h4" gutterBottom>Financial Report</Typography>
                        {report && <Typography variant="subtitle2" color="text.secondary">
                            Data for period: {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                        </Typography>}
                    </Box>
                    <ToggleButtonGroup value={period} exclusive onChange={handlePeriodChange}>
                        <ToggleButton value="monthly">This Month</ToggleButton>
                        <ToggleButton value="yearly">This Year</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {status === 'loading' && <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>}
                {status === 'error' && <Alert severity="error">{error}</Alert>}
                
                {status === 'success' && report && (
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        {/* THE FIX: All key metrics are now displayed correctly */}
                        <Grid item xs={12} sm={6} md={3}><StatCard title={`Total Revenue (${period})`} value={formatCurrency(report.totalRevenue)} icon={<AttachMoneyIcon />} color="success.main" /></Grid>
                        <Grid item xs={12} sm={6} md={3}><StatCard title={`Total Expenses (${period})`} value={formatCurrency(report.totalExpenses)} icon={<TrendingDownIcon />} color="error.main" /></Grid>
                        <Grid item xs={12} sm={6} md={3}><StatCard title={`Net Profit (${period})`} value={formatCurrency(report.netProfit)} icon={<AccountBalanceIcon />} color={report.netProfit >= 0 ? 'primary.main' : 'error.main'} /></Grid>
                        <Grid item xs={12} sm={6} md={3}><StatCard title="Profit Margin" value={`${report.profitMargin.toFixed(2)}%`} icon={<TrendingUpIcon />} color="secondary.main" /></Grid>

                        <Grid item xs={12}>
                            <Paper sx={{ p: 3, textAlign: 'center', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography color="text.secondary">[Future Chart: Revenue vs. Expenses for the selected period]</Typography>
                            </Paper>
                        </Grid>
                        
                        {/* THE FIX: Breakdown and Projections section is now correctly implemented and displayed */}
                        <Grid item xs={12} md={6} lg={4}>
                            <Paper sx={{ p: 2, height: '100%' }}>
                                <Typography variant="h6" gutterBottom>Revenue Breakdown ({period})</Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead><TableRow><TableCell>Plan</TableCell><TableCell align="right">Revenue</TableCell></TableRow></TableHead>
                                        <TableBody>
                                            <TableRow><TableCell sx={{fontWeight: 'bold'}}>Pro Plan</TableCell><TableCell align="right">{formatCurrency(report.revenueByPlan.pro)}</TableCell></TableRow>
                                            <TableRow><TableCell sx={{fontWeight: 'bold'}}>Plus Plan</TableCell><TableCell align="right">{formatCurrency(report.revenueByPlan.plus)}</TableCell></TableRow>
                                            <TableRow><TableCell>Total</TableCell><TableCell align="right" sx={{fontWeight: 'bold'}}>{formatCurrency(report.revenueByPlan.pro + report.revenueByPlan.plus)}</TableCell></TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                         <Grid item xs={12} md={6} lg={4}>
                            <Paper sx={{ p: 2, height: '100%' }}>
                                 <Typography variant="h6" gutterBottom>Revenue Projections</Typography>
                                 <Box sx={{p: 2}}>
                                    <StatCard title="Projected Monthly Revenue" value={formatCurrency(report.projectedMonthlyRevenue)} icon={<TrendingUpIcon />} />
                                    <Box sx={{mt: 2}} />
                                    <StatCard title="Projected Annual Revenue (ARR)" value={formatCurrency(report.projectedAnnualRevenue)} icon={<TrendingUpIcon />} />
                                 </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} lg={4}>
                            <Paper sx={{ p: 2, height: '100%' }}>
                                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                                    <Typography variant="h6" gutterBottom>Recent Expenses</Typography>
                                    <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setIsModalOpen(true)}>Add Expense</Button>
                                </Box>
                                <TableContainer sx={{maxHeight: 250}}>
                                    <Table stickyHeader size="small">
                                        <TableHead><TableRow><TableCell>Description</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
                                        <TableBody>
                                            {expenses.map((expense) => (
                                                <TableRow key={expense.id}><TableCell>{expense.description}</TableCell><TableCell align="right">{formatCurrency(expense.amount)}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Box>
            <ExpenseForm open={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};

export default FinancialPage;