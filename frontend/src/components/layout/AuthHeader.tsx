import { t } from '../../shared/i18n/translation'

// Displays the product name and tagline on authentication pages.
export function AuthHeader() {
    return (
        <header className="mb-6 text-center">
            <h1 className="text-page-title">{t('app.name')}</h1>
            <p className="text-muted mt-2">{t('app.tagline')}</p>
        </header>
    )
}
