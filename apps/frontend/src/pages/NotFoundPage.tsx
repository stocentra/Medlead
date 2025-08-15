import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Icon } from '@iconify/react';

const NotFoundPage = () => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background-light text-center">
            <Icon icon="lucide:frown" className="h-24 w-24 text-primary opacity-50" />
            <h1 className="mt-8 text-4xl font-bold text-text-primary">404 - Page Not Found</h1>
            <p className="mt-4 text-lg text-text-secondary">
                Sorry, the page you are looking for does not exist.
            </p>
            <Button asChild className="mt-8">
                <Link to="/">
                    <Icon icon="lucide:home" className="mr-2 h-5 w-5" />
                    Go Back Home
                </Link>
            </Button>
        </div>
    );
};

// We need to add the 'asChild' prop to our Button component to make it work with Links.
export default NotFoundPage;