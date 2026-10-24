import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'

// Previews shared UI components without authentication or API requests.
export function UiPreview() {
    const [description, setDescription] = useState('')

    return (
        <main className="mx-auto max-w-[640px] space-y-6 px-4 py-12">
            <h1 className="text-page-title">UI Preview</h1>

            <Card className="space-y-4">
                <Input label="Example input" placeholder="Enter text" />

                <Button>Example button</Button>

                <Textarea
                    label="Controlled description"
                    placeholder="Type here to update the preview"
                    value={description}
                    onChange={(event) => {
                        setDescription(event.currentTarget.value)
                    }}
                />

                <p>Current value: {description}</p>

                <Textarea
                    label="Description with error"
                    defaultValue="Example description"
                    error="Please provide more details."
                    rows={2}
                />

                <Textarea
                    label="Disabled description"
                    defaultValue="This field is disabled."
                    disabled
                    rows={2}
                />

                <Textarea
                    label="Read-only description"
                    defaultValue="You can read and copy this text."
                    readOnly
                    rows={2}
                />
            </Card>
        </main>
    )
}
