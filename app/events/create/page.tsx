'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue: '',
    date: '',
    endDate: '',
    category: '',
    imageUrl: '',
    basePrice: '',
    currency: 'KES',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          basePrice: parseFloat(formData.basePrice) || 0,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create event')
      }

      toast.success('Event created successfully!')
      router.push(`/events/${data.event.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    'Music',
    'Sports',
    'Theater',
    'Conference',
    'Festival',
    'Workshop',
    'Other',
  ]

  return (
    <div className="min-h-screen bg-luxe">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 animate-fade-in-up">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-ivory mb-2">
              Create <span className="gradient-text italic">New Event</span>
            </h1>
            <p className="text-taupe text-lg">Share your event with the world</p>
          </div>

          <Card variant="elevated" className="animate-scale-in-bounce premium-border shine">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Event Title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Summer Music Festival"
              />

              <div>
                <label className="block text-sm font-semibold text-ivory/70 mb-2 tracking-wide">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-coal/70 border border-white/10 rounded-xl focus:ring-4 focus:ring-gold/20 focus:border-gold/40 outline-none text-ivory bg-white/90 backdrop-blur-sm transition-all duration-300 placeholder-taupe/50 hover:border-gold/30"
                  placeholder="Describe your event..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Venue"
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  required
                  placeholder="Madison Square Garden"
                />

                <div>
                  <label className="block text-sm font-semibold text-ivory/70 mb-2 tracking-wide">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-coal/70 border border-white/10 rounded-xl focus:ring-4 focus:ring-gold/20 focus:border-gold/40 outline-none text-ivory transition-all duration-300 hover:border-gold/30"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Start Date & Time"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />

                <Input
                  label="End Date & Time (Optional)"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ivory/70 mb-2 tracking-wide">
                    Base Price
                  </label>
                  <div className="flex">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="px-4 py-3 border border-r-0 border-white/10 rounded-l-xl focus:ring-4 focus:ring-gold/20 focus:border-gold/40 outline-none text-ivory bg-coal/70 transition-all duration-300 hover:border-gold/30"
                    >
                      <option value="KES">KES (Kenyan Shilling)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </select>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      required
                      className="rounded-l-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <Input
                  label="Image URL (Optional)"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button variant="gold" type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

