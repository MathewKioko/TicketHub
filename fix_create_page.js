const fs = require('fs');
const path = 'c:\\Users\\ZBOOK\\Documents\\TicketHub\\app\\events\\create\\page.tsx';
let c = fs.readFileSync(path, 'utf8');

// Add importing clsx for conditional classes if not present
if (!c.includes("import { clsx } from '@/lib/cn'")) {
  c = c.replace("import { formatMoney } from '@/lib/format'", "import { formatMoney } from '@/lib/format'\\nimport { clsx } from '@/lib/cn'");
}

// Replace the entire component function
const oldComponent = c.substring(c.indexOf("export default function CreateEventPage()"), c.lastIndexOf("}") + 1);

const newComponent = `export default function CreateEventPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)  // NEW: success state
  const [isAutoPublish, setIsAutoPublish] = useState(false)  // NEW: show if auto-published

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.title.trim()) next.title = 'Give the event a name guests will recognise.'
    if (!form.venue.trim()) next.venue = 'Where is it happening?'
    if (!form.date) next.date = 'Pick the start date and time.'
    if (form.date && form.endDate && new Date(form.endDate) <= new Date(form.date)) {
      next.endDate = 'The end time must be after the start.'
    }
    if (form.basePrice !== '' && Number(form.basePrice) < 0) next.basePrice = 'Price cannot be negative.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setFormError(null)
    if (!validate()) return

    setSubmitting(true)
    setSuccess(false)
    try {
      const price = form.basePrice === '' ? 0 : Number(form.basePrice)
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          venue: form.venue.trim(),
          date: new Date(form.date).toISOString(),
          endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
          category: form.category,
          imageUrl: form.imageUrl.trim() || undefined,
          basePrice: price,
          currency: form.currency,
        }),
      })
      const data = (await response.json()) as { error?: string; event?: { id: string; status?: string } }

      if (!response.ok) {
        if (response.status === 401) throw new Error('Sign in again to create an event.')
        throw new Error(data.error ?? 'The event could not be created.')
      }

      // Show success state
      setSuccess(true)
      setSubmitting(false)

      // Redirect after 2 seconds to event page
      setTimeout(() => {
        router.push(data.event?.id ? \`/events/\${data.event.id}\` : '/dashboard/organizer')
      }, 2000)
    } catch (error) {
      setPayError(error instanceof Error ? error.message : 'The event could not be created.')
      setSubmitting(false)
    }
  }`;

c = c.replace(oldComponent, newComponent);

fs.writeFileSync(path, c, 'utf8');
console.log('SUCCESS: Create event page updated with auto-publish success state');