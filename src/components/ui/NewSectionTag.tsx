import { cn } from '../../utils/cn';

interface NewSectionTagProps {
  label?: string;
  /** "outline" (default) is the quiet version for menus and filters; "solid" for headers. */
  variant?: 'outline' | 'solid';
  /** Outline tag placed on an inverted surface (e.g. an active menu row). */
  inverted?: boolean;
  className?: string;
}

/** Discreet «Nueva sección» label for recently added catalog sections. */
export function NewSectionTag({ label = 'Nueva sección', variant = 'outline', inverted = false, className }: NewSectionTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2 py-[3px] text-[9px] font-semibold uppercase leading-none tracking-[0.14em]',
        variant === 'solid'
          ? 'border-transparent bg-gray-900 text-white dark:bg-white dark:text-gray-900'
          : inverted
            ? 'border-white/30 text-white dark:border-gray-900/25 dark:text-gray-900'
            : 'border-gray-300 text-gray-600 dark:border-white/20 dark:text-white/70',
        className
      )}
    >
      {label}
    </span>
  );
}
