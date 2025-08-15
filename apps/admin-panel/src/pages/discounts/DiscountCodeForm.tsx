// In: apps/admin-panel/src/pages/discounts/DiscountCodeForm.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { DiscountCode, DiscountCodeSubmitData, SubscriptionPlan } from '../../types';
import { getSubscriptionPlans } from '../../api/plansApi';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DiscountCodeSubmitData | Partial<DiscountCodeSubmitData>) => void;
  initialData?: DiscountCode | null;
}

const DiscountCodeForm: React.FC<Props> = ({ open, onClose, onSubmit, initialData }) => {
  const isEditing = !!initialData;
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [value, setValue] = useState<number | ''>('');
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [planId, setPlanId] = useState<number | ''>(''); // State for the selected plan

  // State for fetching plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  useEffect(() => {
    // Fetch subscription plans when the dialog opens
    if (open) {
      setIsLoadingPlans(true);
      getSubscriptionPlans()
        .then(setPlans)
        .catch(console.error) // Error is already logged in the API function
        .finally(() => setIsLoadingPlans(false));
    }
  }, [open]);

  useEffect(() => {
    // Populate form with initial data when editing
    if (initialData) {
      setCode(initialData.code);
      setType(initialData.type);
      setValue(initialData.value);
      setMaxUses(initialData.max_uses ?? '');
      setExpiresAt(initialData.expires_at ? initialData.expires_at.split('T')[0] : '');
      setIsActive(initialData.status === 'active');
      setPlanId(initialData.plan_id ?? '');
    } else {
      // Reset form when opening for creation
      setCode('');
      setType('percentage');
      setValue('');
      setMaxUses('');
      setExpiresAt('');
      setIsActive(true);
      setPlanId('');
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      code,
      type,
      value: Number(value),
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt || null,
      // For editing, we don't send status directly, it's handled via is_active in backend
      ...(isEditing ? {} : { status: isActive ? 'active' : 'expired' }),
      plan_id: planId ? Number(planId) : null,
      // We don't submit these fields
      // assigned_to_user_id: null,
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Discount Code' : 'Create New Discount Code'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Discount Code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                fullWidth
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Type</InputLabel>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value as typeof type)}
                  label="Type"
                >
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="fixed_amount">Fixed Amount</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={type === 'percentage' ? 'Percentage' : 'Amount'}
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                fullWidth
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Assign to a specific plan (Optional)</InputLabel>
                {isLoadingPlans ? (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '16.5px 14px' }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <span>Loading plans...</span>
                  </div>
                ) : (
                  <Select
                    value={planId}
                    onChange={(e) => setPlanId(Number(e.target.value))}
                    label="Assign to a specific plan (Optional)"
                  >
                    <MenuItem value="">
                      <em>No specific plan (General)</em>
                    </MenuItem>
                    {plans.map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Usage Limit (Optional)"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Expiration Date (Optional)"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {isEditing ? 'Save Changes' : 'Create Code'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DiscountCodeForm;