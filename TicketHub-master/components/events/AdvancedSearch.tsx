'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Search, Calendar, DollarSign, MapPin, X, Filter } from 'lucide-react'

interface SearchFilters {
  query: string
  minDate: string
  maxDate: string
  minPrice: string
  maxPrice: string
  location: string
  radius: string
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void
  filters: SearchFilters
}

export function AdvancedSearch({ onFiltersChange, filters }: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters)

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }, [localFilters, onFiltersChange])

  const clearFilters = useCallback(() => {
    const emptyFilters: SearchFilters = {
      query: '',
      minDate: '',
      maxDate: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      radius: '',
    }
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }, [onFiltersChange])

  const hasActiveFilters = Object.values(localFilters).some(v => v !== '')

  return (
    <Card variant="elevated" className="mb-8">
      <div className="p-4">
        {/* Main Search Bar */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search events by title, description, or venue..."
              value={localFilters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                {Object.values(localFilters).filter(v => v !== '').length}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Filters (Expandable) */}
        {isExpanded && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200 animate-fade-in">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="From"
                  value={localFilters.minDate}
                  onChange={(e) => handleFilterChange('minDate', e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={localFilters.maxDate}
                  onChange={(e) => handleFilterChange('maxDate', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price Range
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min $"
                  value={localFilters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="text-sm"
                  min="0"
                  step="0.01"
                />
                <Input
                  type="number"
                  placeholder="Max $"
                  value={localFilters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="text-sm"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Location Search */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="City or venue..."
                  value={localFilters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="text-sm flex-1"
                />
                <Input
                  type="number"
                  placeholder="Radius (km)"
                  value={localFilters.radius}
                  onChange={(e) => handleFilterChange('radius', e.target.value)}
                  className="text-sm w-24"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

