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
    currency: 'USD',
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10 animate-fade-in-up">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-2">
              Create <span className="gradient-text">New Event</span>
            </h1>
            <p className="text-xl text-gray-600">Share your event with the world</p>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 bg-white/90 backdrop-blur-sm transition-all duration-300 placeholder:text-gray-400 hover:border-gray-300"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 bg-white/90 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Base Price
                  </label>
                  <div className="flex">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="px-4 py-3 border-2 border-r-0 border-gray-200 rounded-l-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-gray-900 bg-white/90 backdrop-blur-sm transition-all duration-300 hover:border-gray-300"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
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
                <Button type="submit" disabled={loading} className="flex-1">
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

