import { useId } from "react";
import type { ComponentProps } from "react";

type InputProps = ComponentProps<'input'> & {
    label: string
    error?: string
}

export function Input({
    label,
    error,
    id,
    className = '',
    ...props
}: InputProps) {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`

    const describedBy = [
        props['aria-describedby'],
        error ? errorId : undefined,
    ].filter(Boolean).join(' ') || undefined

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={inputId} className="text-small text-ink">
                {label}
            </label>

            <input
                {...props}
                id={inputId}
                aria-invalid={error ? true : props['aria-invalid']}
                aria-describedby={describedBy}
                className={`tc-focus h-control w-full rounded-control border bg-surface px-3 text-body text-ink
                    disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:opacity-50 read-only:bg-surface-secondary
                    ${error ? 'border-danger' : 'border-border'}
                    ${className}`
                }
            />

            {error && (
                <p id={errorId} className="text-small text-danger">
                    {error}
                </p>
            )}
        </div>
    )
}
