import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Tabs } from '../components/ui/Tabs'
import { Toast } from '../components/ui/Toast'

// Previews shared UI components without authentication or API requests.
export function UiPreview() {
    const [description, setDescription] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')
    const [toastOpen, setToastOpen] = useState(false)

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

                <Button onClick={() => setModalOpen(true)}>
                    Open modal
                </Button>
                <Modal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title="Example modal"
                    footer={
                        <Button
                            variant="secondary"
                            onClick={() => setModalOpen(false)}
                        >
                            Close
                        </Button>
                    }
                >
                    <p>This is the modal content.</p>
                </Modal>

                <Tabs
                    label="Example tabs"
                    value={activeTab}
                    onValueChange={setActiveTab}
                    items={[
                        {
                            value: 'overview',
                            label: 'Overview',
                            content: <p>This is the overview.</p>,
                        },
                        {
                            value: 'members',
                            label: 'Members',
                            content: <p>This is the members list.</p>,
                        },
                    ]}
                />

                <Button onClick={() => setToastOpen(true)}>
                    Show notification
                </Button>

                <Toast
                    open={toastOpen}
                    message="Danger."
                    variant="danger"
                    onClose={() => setToastOpen(false)}
                    autoCloseMs={5000}
                />
            </Card>
        </main>
    )
}
