import { useAuthStore } from "@/store/useAuthStore";
import { Link, Navigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/Button";

const PendingVerificationPage = () => {
    const user = useAuthStore((state) => state.user);

    // If for some reason user data is not available, redirect to auth
    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    const statusContent = {
        not_submitted: {
            icon: "lucide:file-up",
            title: "Verification Required",
            message: "To get full access to MedLead, you need to upload your verification document.",
            ctaText: "Go to Profile to Upload",
            ctaLink: "/profile",
        },
        pending: {
            icon: "lucide:hourglass",
            title: "Your Account is Under Review",
            message: "Thank you for submitting your document. Our team will review it shortly. You will be notified via email once the process is complete.",
            ctaText: "View Profile",
            ctaLink: "/profile",
        },
        rejected: {
            icon: "lucide:x-circle",
            title: "Verification Rejected",
            message: "There was an issue with your submitted document. Please visit your profile to see the details and re-upload.",
            ctaText: "Go to Profile",
            ctaLink: "/profile",
        }
    };
    
    // Default to pending if status is somehow unexpected but not verified
    const content = statusContent[user.verification_status as keyof typeof statusContent] || statusContent.pending;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background-light p-4 text-center dark:bg-dark-background">
            <Icon icon={content.icon} className="h-24 w-24 text-primary opacity-70" />
            <h1 className="mt-8 text-3xl font-bold text-text-primary dark:text-dark-text-primary">
                {content.title}
            </h1>
            <p className="mt-4 max-w-md text-base text-text-secondary dark:text-dark-text-secondary">
                {content.message}
            </p>
            <Button asChild className="mt-8">
                <Link to={content.ctaLink}>
                    {content.ctaText}
                </Link>
            </Button>
        </div>
    );
};

export default PendingVerificationPage;