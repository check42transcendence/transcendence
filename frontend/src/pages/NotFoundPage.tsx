import { Link } from "react-router";
import { t } from '../shared/i18n/translation'

// Shows a fallback page for unknown URLs.
export function NotFoundPage() {
    return (
        <main className="mx-auto max-w-[440px] space-y-4 px-4 py-12">
            <h1 className="text-page-title">{t('notFound.title')}</h1>
            <p>{t('notFound.description')}</p>
            <Link className="tc-focus text-brand underline" to="/login">
                {t('notFound.actions.goToLogin')}
            </Link>
        </main>
    )
}
