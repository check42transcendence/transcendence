import type { ComponentProps } from "react";

type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ButtonProps = ComponentProps<'button'> & {
    variant?: ButtonVariant
    isLoading?: boolean
}

const baseStyles =
    'tc-focus h-control rounded-control border px-5 text-small transition-colors duration-(--tc-duration-fast) motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50'

const variantStyles = {
    primary:
        'border-transparent bg-brand text-surface enabled:hover:bg-brand-hover',
    secondary:
        'border-border bg-surface text-ink',
    danger:
        'border-transparent bg-danger text-surface',
}

export function Button({
    children,
    type = 'button',
    variant = 'primary',
    isLoading = false,
    disabled = false,
    className = '',
    ...props
}: ButtonProps) {
    const isDisabled = disabled || isLoading

    return (
        <button
            {...props}
            type={type}
            disabled={isDisabled}
            aria-busy={isLoading || undefined}
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        >
            {children}
        </button>
    )
}
