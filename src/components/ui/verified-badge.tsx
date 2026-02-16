import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4.5 h-4.5',
  lg: 'w-5.5 h-5.5',
};

export const VerifiedBadge = ({ size = 'md', className }: VerifiedBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center", className)}>
            <CheckCircle2 
              className={cn(
                sizeMap[size],
                "text-blue-500 fill-blue-500/20 shrink-0"
              )} 
            />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">حساب موثق ✓</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
