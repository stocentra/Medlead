import { useEffect, useState } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { professionalLevelLabels } from '@/lib/constants';
import { Icon } from '@iconify/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UpdateUserPayload } from '@/types';
import VerificationSection from '@/components/features/profile/VerificationSection';

// Validation schema for the edit form
const profileSchema = z.object({
    full_name: z.string().min(3, "Full name is required"),
    phone_number: z.string().optional(),
    national_id: z.string().optional(),
    // Add other editable fields here as needed
});

type ProfileFormInputs = z.infer<typeof profileSchema>;

const ProfilePage = () => {
    const { profile, status, error, fetchProfile, updateProfile } = useProfileStore();
    const [isEditing, setIsEditing] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormInputs>({
        resolver: zodResolver(profileSchema)
    });

    useEffect(() => {
        // Fetch profile only if it hasn't been fetched before
        if (status === 'idle') {
            fetchProfile();
        }
        // When profile data is loaded or updated, populate the form with it
        if (profile) {
            reset({
                full_name: profile.full_name,
                phone_number: profile.phone_number || '',
                national_id: profile.national_id || '',
            });
        }
    }, [status, fetchProfile, profile, reset]);

    const onSubmit: SubmitHandler<ProfileFormInputs> = async (data) => {
        try {
            await updateProfile(data as UpdateUserPayload);
            setIsEditing(false); // Exit edit mode on success
        } catch (updateError) {
            console.error("Update failed:", updateError);
            // Error will be shown via the store's error state
        }
    };

    const renderDetail = (label: string, value: string | undefined | null) => {
        return (
            <div className="py-2">
                <dt className="text-sm font-medium text-text-secondary">{label}</dt>
                <dd className="mt-1 text-base text-text-primary capitalize">{value ? value.replace(/_/g, ' ') : '-'}</dd>
            </div>
        );
    };

    if (status === 'loading' && !profile) {
        return <div className="flex justify-center items-center h-full"><Icon icon="lucide:loader" className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            {/* --- Profile Details Section --- */}
            <div className="rounded-lg border bg-background p-6 shadow-sm">
                <div className="flex items-center justify-between border-b pb-4">
                    <h1 className="text-2xl font-semibold text-text-primary">My Profile</h1>
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)} size="sm">
                            <Icon icon="lucide:edit" className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>

                {error && <p className="text-status-error text-center my-4">{error}</p>}

                {isEditing ? (
                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <Input {...register('full_name')} />
                            {errors.full_name && <p className="text-sm text-status-error mt-1">{errors.full_name.message}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium">Phone Number</label>
                            <Input {...register('phone_number')} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">National ID</label>
                            <Input {...register('national_id')} />
                        </div>
                        
                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={() => { setIsEditing(false); reset(profile || {}); }}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <dl className="mt-6 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        {renderDetail("Full Name", profile?.full_name)}
                        {renderDetail("Email Address", profile?.email)}
                        {renderDetail("Professional Level", profile ? professionalLevelLabels[profile.professional_level] : '')}
                        {renderDetail("Country", profile?.country)}
                        {renderDetail("Phone Number", profile?.phone_number)}
                        {renderDetail("National ID", profile?.national_id)}
                        {renderDetail("University", profile?.university)}
                        {renderDetail("Student ID", profile?.student_id)}
                        {renderDetail("Medical License Number", profile?.medical_license_number)}
                    </dl>
                )}
            </div>

            {/* --- Verification Section --- */}
            <VerificationSection />
        </div>
    );
};

export default ProfilePage;