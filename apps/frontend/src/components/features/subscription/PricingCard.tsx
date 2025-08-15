import { Button } from '@/components/ui/Button';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  plan: {
    name: string;
    price: string;
    priceSubtext?: string;
    description: string;
    features: { text: string; icon: string }[];
    isFeatured?: boolean;
    ctaText: string;
    ctaVariant?: 'primary' | 'outline';
    disabled?: boolean;
  };
}

const PricingCard = ({ plan }: PricingCardProps) => {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-lg border bg-background p-6 shadow-sm',
        plan.isFeatured ? 'border-primary ring-2 ring-primary' : 'border-gray-200'
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-text-primary">{plan.name}</h3>
        {plan.isFeatured && (
          // Corrected: Added border to the badge
          <div className="rounded-full border border-primary bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            Popular
          </div>
        )}
      </div>
      
      <div className="my-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold">${plan.price}</span>
        {plan.priceSubtext && <span className="text-sm text-text-secondary">{plan.priceSubtext}</span>}
      </div>

      <p className="text-sm text-text-secondary h-12">{plan.description}</p>

      <Button variant={plan.ctaVariant || 'primary'} className="my-6 w-full" disabled={plan.disabled}>
        {plan.ctaText}
      </Button>

      <div className="flex-grow border-t pt-6">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Icon icon={feature.icon} className="h-5 w-5 flex-shrink-0 text-primary" />
              <span className="text-sm text-text-secondary">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PricingCard;