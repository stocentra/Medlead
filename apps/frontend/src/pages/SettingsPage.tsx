import ChangePasswordForm from "@/components/features/settings/ChangePasswordForm";

const SettingsPage = () => {
    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <div className="rounded-lg border bg-background p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-text-primary border-b pb-4 mb-6">
                    Settings
                </h1>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Change Password</h2>
                    <p className="text-sm text-text-secondary mb-4">
                        For your security, we recommend choosing a strong password that you don't use elsewhere.
                    </p>
                    <ChangePasswordForm />
                </div>
            </div>

            {/* Other settings sections can be added here in the future */}
        </div>
    );
};

export default SettingsPage;