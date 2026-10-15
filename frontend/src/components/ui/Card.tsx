import type { ComponentProps } from "react";

type CardProps = ComponentProps<'div'>

export function Card({
    children,
    className = '',
    ...props
}: CardProps) {
    return (
        <div
            {...props}
            className={`rounded-card border border-border bg-surface p-5 text-ink shadow-subtle ${className}`}
        >
            {children}
        </div>
    )
}
