import { cn } from '@/lib/utils';

interface BadgeProps {
  label: string;
  className?: string;
}

/* 상태 배지 — className으로 색상 커스터마이즈 가능 */
export function Badge({ label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        className
      )}
    >
      {label}
    </span>
  );
}
