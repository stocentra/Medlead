import { useState } from 'react';
import PricingCard from "@/components/features/subscription/PricingCard";
import { cn } from '@/lib/utils';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// Function to calculate discounted price
const calculateDiscount = (price: number, percentage: number) => {
    const discount = (price * percentage) / 100;
    return (price - discount).toFixed(2);
};

const SubscriptionPage = () => {
    const [activeTab, setActiveTab] = useState<'individual' | 'business'>('individual');
    const [discountCodeInput, setDiscountCodeInput] = useState('');
    const { 
        status, 
        message, 
        appliedCode, 
        discountPercentage, 
        applyDiscountCode, 
        removeDiscountCode 
    } = useSubscriptionStore();

    const handleApplyCode = async () => {
        if (discountCodeInput.trim()) {
            try {
                await applyDiscountCode(discountCodeInput.trim());
            } catch (error) {
                console.error(error);
            }
        }
    };

    // We define base plans here
    const baseIndividualPlans = [
        {
            name: 'Free',
            price: '0',
            description: 'A glimpse into the future of clinical assistance.',
            features: [
                { icon: 'lucide:flask-conical', text: 'Access to Medlead1-mini model' },
                { icon: 'lucide:history', text: 'Standard conversation memory' },
                { icon: 'lucide:beaker', text: 'Limited to basic clinical queries' },
            ],
            ctaText: 'In Development',
            ctaVariant: 'outline' as 'outline',
            disabled: true,
        },
        {
            name: 'Plus',
            price: '10',
            priceSubtext: '/ month',
            description: 'For residents & practitioners with moderate needs.',
            features: [
                { icon: 'lucide:database', text: '30 Clinical Case Credits per month' },
                { icon: 'lucide:zap', text: 'Unlimited access to Medlead1-mini (upon release)' },
                { icon: 'lucide:brain-circuit', text: 'Advanced conversation memory' },
                { icon: 'lucide:globe', text: 'Unlimited Grounding with Google Search' },
            ],
            ctaText: 'Contact Us',
            ctaVariant: 'outline' as 'outline',
            isFeatured: true,
        },
        {
            name: 'Pro',
            price: '30',
            priceSubtext: '/ month',
            description: 'For specialists & researchers with high-volume demands.',
            features: [
                { icon: 'lucide:database', text: '120 Clinical Case Credits per month' },
                { icon: 'lucide:zap', text: 'Unlimited access to Medlead1-mini (upon release)' },
                { icon: 'lucide:users', text: 'Early access to team features (Beta)' },
                { icon: 'lucide:shield-check', text: 'Dedicated specialist support' },
            ],
            ctaText: 'Contact Us',
            ctaVariant: 'outline' as 'outline',
        }
    ];

    const baseBusinessPlan = {
        name: 'Business',
        price: '25',
        priceSubtext: '/ user / month',
        description: 'For teams, clinics, and hospitals operating at scale.',
        features: [
            { icon: 'lucide:building', text: 'Everything in Pro, plus:' },
            { icon: 'lucide:database-zap', text: 'Shared credit pool for the entire team' },
            { icon: 'lucide:user-cog', text: 'Centralized user and billing management' },
            { icon: 'lucide:shield-half', text: 'HIPAA compliance readiness' },
            { icon: 'lucide:key-round', text: 'Early access to API' },
        ],
        ctaText: 'Contact Sales',
        ctaVariant: 'outline' as 'outline',
    };

    // Dynamically calculate prices based on discount
    const individualPlans = baseIndividualPlans.map(plan => ({
        ...plan,
        price: (plan.name !== 'Free' && discountPercentage > 0) ? calculateDiscount(Number(plan.price), discountPercentage) : plan.price,
    }));

    const businessPlan = {
        ...baseBusinessPlan,
        price: discountPercentage > 0 ? calculateDiscount(Number(baseBusinessPlan.price), discountPercentage) : baseBusinessPlan.price,
    };
    
    return (
        <div className="mx-auto max-w-7xl py-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary sm:text-4xl">Plans that grow with you</h1>
                <p className="mt-4 text-lg text-text-secondary dark:text-dark-text-secondary">
                    From individual practitioners to large-scale hospitals.
                </p>
            </div>

            <div className="mt-10 flex justify-center">
                <div className="flex rounded-full bg-gray-200 p-1 dark:bg-dark-background-light">
                    <button
                        onClick={() => setActiveTab('individual')}
                        className={cn(
                            'rounded-full px-6 py-2 text-sm font-medium transition-colors',
                            activeTab === 'individual' ? 'bg-white text-primary shadow dark:bg-dark-background' : 'text-gray-600 dark:text-dark-text-secondary'
                        )}
                    >
                        Individual
                    </button>
                    <button
                        onClick={() => setActiveTab('business')}
                        className={cn(
                            'rounded-full px-6 py-2 text-sm font-medium transition-colors',
                            activeTab === 'business' ? 'bg-white text-primary shadow dark:bg-dark-background' : 'text-gray-600 dark:text-dark-text-secondary'
                        )}
                    >
                        Business
                    </button>
                </div>
            </div>
            
            <div className="mt-12">
                {activeTab === 'individual' ? (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {individualPlans.map(plan => (
                            <PricingCard key={plan.name} plan={plan} />
                        ))}
                    </div>
                ) : (
                    <div className="mx-auto max-w-2xl">
                        <PricingCard plan={businessPlan} />
                    </div>
                )}
            </div>

            <div className="mx-auto mt-12 max-w-md text-center">
                <h3 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Have a discount code?</h3>
                <div className="mt-4 flex items-center gap-2">
                    <Input 
                        placeholder="Enter your code"
                        value={discountCodeInput}
                        onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                        disabled={!!appliedCode}
                    />
                    {appliedCode ? (
                        <Button variant="outline" onClick={removeDiscountCode}>Remove</Button>
                    ) : (
                        <Button onClick={handleApplyCode} disabled={status === 'loading'}>
                            {status === 'loading' ? 'Verifying...' : 'Apply'}
                        </Button>
                    )}
                </div>
                {message && (
                    <p className={`mt-2 text-sm ${status === 'success' ? 'text-status-success' : 'text-status-error'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

export default SubscriptionPage;