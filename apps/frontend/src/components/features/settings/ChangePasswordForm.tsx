import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSettingsStore } from '@/store/useSettingsStore'; 
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icon } from '@iconify/react';
import { useEffect } from 'react';

const passwordSchema = z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
    message: "New passwords don't match",
    path: ['confirm_password'],
});

type PasswordFormInputs = z.infer<typeof passwordSchema>;

const ChangePasswordForm = () => {
    const { status, message, changeUserPassword, resetStatus } = useSettingsStore();
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PasswordFormInputs>({
        resolver: zodResolver(passwordSchema),
    });

    useEffect(() => {
        return () => {
            resetStatus();
        }
    }, [resetStatus]);

    const onSubmit: SubmitHandler<PasswordFormInputs> = async (data) => {
        try {
            await changeUserPassword({
                current_password: data.current_password,
                new_password: data.new_password,
            });
            reset();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
            {status === 'success' && message && (
                <div className="flex items-center gap-2 rounded-md bg-green-100 p-3 text-sm text-green-800">
                    <Icon icon="lucide:check-circle" className="h-5 w-5" />
                    <p>{message}</p>
                </div>
            )}
             {status === 'error' && message && (
                <div className="flex items-center gap-2 rounded-md bg-red-100 p-3 text-sm text-red-800">
                    <Icon icon="lucide:x-circle" className="h-5 w-5" />
                    <p>{message}</p>
                </div>
            )}
            <div>
                <label className="text-sm font-medium">Current Password</label>
                <Input type="password" {...register('current_password')} />
                {errors.current_password && <p className="text-sm text-status-error mt-1">{errors.current_password.message}</p>}
            </div>
            <div>
                <label className="text-sm font-medium">New Password</label>
                <Input type="password" {...register('new_password')} />
                {errors.new_password && <p className="text-sm text-status-error mt-1">{errors.new_password.message}</p>}
            </div>
            <div>
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input type="password" {...register('confirm_password')} />
                {errors.confirm_password && <p className="text-sm text-status-error mt-1">{errors.confirm_password.message}</p>}
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                </Button>
            </div>
        </form>
    );
};

export default ChangePasswordForm;