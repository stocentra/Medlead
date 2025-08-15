import { Link, useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Icon } from '@iconify/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface ErrorDetails {
    animationSrc: string;
    title: string;
    message: string;
}

const errorMappings: { [key: string]: ErrorDetails } = {
    '403': {
        animationSrc: 'https://lottie.host/ed4e7a18-994c-4dca-82c8-239a501f32f3/POJgbh3QSq.lottie',
        title: 'Access Denied',
        message: 'Looks like your credentials haven\'t been cleared for this ward yet. Let\'s get you back to the main lobby.'
    },
    '404': {
        animationSrc: 'https://lottie.host/fe0ce402-3c03-4a99-b77f-447a6f879668/3P3AxEIv7a.lottie',
        title: 'Patient Record Not Found',
        message: 'We searched the archives, but this case file doesn\'t seem to exist. Let\'s find you a different chart.'
    },
    '500': {
        animationSrc: 'https://lottie.host/c0295198-74ac-4a93-80a3-6e5018ea5860/h09cq8BHwR.lottie',
        title: 'Emergency in the Server Room',
        message: 'Our digital heart monitor is showing some arrhythmias. We\'ve paged the tech team for immediate consultation.'
    },
    '502': {
        animationSrc: 'https://lottie.host/2d6af690-64ef-4dc0-bca7-de8dcd591d38/nVIblu5tfK.lottie',
        title: 'Consultation Failed',
        message: 'We couldn\'t get a clear line to the specialist server. It seems there\'s some interference in the network.'
    },
    '503': {
        animationSrc: 'https://lottie.host/805e61da-d2b9-44cd-b086-0628c3cd370b/QQfxGJKRyQ.lottie',
        title: 'The Clinic is Overwhelmed',
        message: 'Our servers are currently attending to a high volume of cases. Please wait a moment before trying again.'
    },
    '504': {
        animationSrc: 'https://lottie.host/805e61da-d2b9-44cd-b086-0628c3cd370b/QQfxGJKRyQ.lottie',
        title: 'The Specialist is Delayed',
        message: 'Sometimes even the best consultants get stuck in traffic. We waited, but didn\'t get a timely response.'
    },
    'default': {
        animationSrc: 'https://lottie.host/d4659c6e-0fe9-4741-bbe4-14c97725fa3f/FIwQSHUhTM.lottie',
        title: 'An Unknown Anomaly',
        message: 'We\'ve encountered a rare condition that isn\'t in our textbooks yet. Our team is analyzing the case.'
    }
};


interface ErrorPageProps {
    statusCode?: number;
}

const ErrorPage = ({ statusCode }: ErrorPageProps) => {
    const routeError = useRouteError() as any;
    const finalStatusCode = statusCode || routeError?.status || 500;
    
    // Select the correct error details based on the status code
    const details = errorMappings[finalStatusCode.toString()] || errorMappings['default'];

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background-light p-4 text-center">
            <div className="w-full max-w-sm">
                <DotLottieReact
                    src={details.animationSrc}
                    loop
                    autoplay
                />
            </div>
            <h1 className="mt-8 text-4xl font-bold text-text-primary">{details.title}</h1>
            <p className="mt-4 max-w-md text-base text-text-secondary">{details.message}</p>

            <Button asChild className="mt-10">
                <Link to="/">
                    <Icon icon="lucide:home" className="mr-2 h-5 w-5" />
                    Return to Clinic
                </Link>
            </Button>
        </div>
    );
};

export default ErrorPage;