import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'

// Previews shared UI components without authentication or API requests.
export function UiPreview() {
    const [description, setDescription] = useState('')

    return (
        <main className="mx-auto max-w-[640px] space-y-6 px-4 py-12">
            <h1 className="text-page-title">UI Preview</h1>

            <Card className="space-y-4">
                <Input
                    label="Example input"
                    placeholder="Enter text"
                />

                <Button>
                    Example button
                </Button>

                <Textarea
                    label="Controlled description"
                    placeholder="Type here to update the preview"
                    value={description}
                    onChange={(event) => {
                        setDescription(event.currentTarget.value)
                    }}
                />

                <p>Current value: {description}</p>

                <Select
                    label="Transport"
                    defaultValue=""
                >
                    <option value="" disabled>Choose transport</option>
                    <option value="train">Train</option>
                    <option value="bus">Bus</option>
                </Select>

                <Select
                    label="Transport with error"
                    defaultValue=""
                    error="Please choose a transport option."
                >
                    <option value="" disabled>Choose transport</option>
                    <option value="train">Train</option>
                    <option value="bus">Bus</option>
                </Select>
            </Card>
        </main>
    )
}
