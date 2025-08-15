import { useProfileStore } from "@/store/useProfileStore";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@iconify/react";

const documentSchema = z.object({
    document: z.instanceof(FileList).refine(files => files.length > 0, 'A file is required.'),
});
type DocumentFormInputs = z.infer<typeof documentSchema>;

// Define a specific type for the verification status to help TypeScript
type VerificationStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

const VerificationSection = () => {
    // Corrected: Removed unused 'status' variable from destructuring
    const { profile, error, uploadDocument } = useProfileStore();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DocumentFormInputs>({
        resolver: zodResolver(documentSchema)
    });

    const onSubmit: SubmitHandler<DocumentFormInputs> = async (data) => {
        if (data.document[0]) {
            try {
                await uploadDocument(data.document[0]);
            } catch (uploadError) {
                console.error("Upload failed:", uploadError);
            }
        }
    };

    const renderContent = () => {
        if (!profile) return null;

        const currentStatus = profile.verification_status as VerificationStatus;
        const statusText = currentStatus.replace(/_/g, ' ');

        // Corrected: Added an index signature to the object to solve the TypeScript error
        const statusStyles: { [key in VerificationStatus]: string } = {
            not_submitted: 'bg-gray-200 text-gray-800',
            pending: 'bg-yellow-200 text-yellow-800',
            verified: 'bg-green-200 text-green-800',
            rejected: 'bg-red-200 text-red-800',
        };

        if (currentStatus === 'not_submitted' || currentStatus === 'rejected') {
            return (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {currentStatus === 'rejected' && (
                        <p className="text-sm text-status-error">Your previous submission was rejected. Please upload a new document.</p>
                    )}
                    <div>
                        <label className="text-sm font-medium">Upload Document</label>
                        <p className="text-xs text-text-secondary mb-2">Please upload your Student ID or Medical License card.</p>
                        <Input type="file" {...register('document')} />
                        {errors.document && <p className="text-sm text-status-error mt-1">{errors.document.message as string}</p>}
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Uploading...' : 'Submit for Verification'}
                        </Button>
                    </div>
                </form>
            );
        }

        return (
             <div className="text-center bg-gray-50 p-6 rounded-md">
                <Icon icon="lucide:check-circle" className="mx-auto h-12 w-12 text-status-success mb-4" />
                <p className="text-lg font-medium text-text-primary">
                    Your verification status is: 
                    <span className={`ml-2 px-3 py-1 text-sm font-semibold rounded-full ${statusStyles[currentStatus]}`}>
                        {statusText}
                    </span>
                </p>
                {currentStatus === 'pending' && <p className="mt-2 text-sm text-text-secondary">Our team will review your document shortly.</p>}
             </div>
        );
    };

    return (
        <div className="rounded-lg border bg-background p-6 shadow-sm">
            <h2 className="text-xl font-semibold border-b pb-4 mb-6">Verification Status</h2>
            {/* The main error from the store is for fetching/updating profile, not document upload status */}
            {error && profile?.verification_status === 'not_submitted' && <p className="text-status-error text-center my-4">{error}</p>}
            {renderContent()}
        </div>
    );
};

export default VerificationSection;