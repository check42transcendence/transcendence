import { en } from './en'

export type TranslationKey = keyof typeof en

// Return the English message for a translation key.
export function t(key: TranslationKey): string {
    return en[key]
}
