import { Link } from "react-router";

// Shows a fallback page for unknown URLs.
export function NotFoundPage() {
    return (
        <main className="mx-auto max-w-[440px] space-y-4 px-4 py-12">
            <h1 className="text-page-title">Page not found</h1>
            <p>The page you requested does not exist.</p>
            <Link className="tc-focus text-brand underline" to="/login">
                Go to login
            </Link>
        </main>
    )
}
