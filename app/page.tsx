import Link from 'next/link'
import { Calendar, MapPin, Ticket, Users, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-primary-300/10 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center relative z-10">
        <div className="text-3xl font-bold text-white flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-8 h-8 text-primary-300 animate-pulse" />
          <span className="bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
            Ticket Hub
          </span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/events"
            className="px-5 py-2.5 text-white/90 hover:text-white font-medium rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
          >
            Browse Events
          </Link>
          <Link
            href="/events/create"
            className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-600 hover:to-primary-700 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Create Event
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24 md:py-32 text-center relative z-10">
        <div className="animate-fade-in-up">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold text-white mb-8 leading-tight text-shadow-xl">
            The Future of
            <br />
            <span className="gradient-text text-glow">
              Event Management
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-100/90 mb-12 max-w-3xl mx-auto leading-relaxed font-light text-shadow">
            Discover, book, and attend events with ease. Create stunning events,
            manage ticket sales, and track attendance in real time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
            <Link
              href="/events"
              className="px-10 py-5 bg-white text-primary-900 rounded-xl font-bold text-lg shadow-premium-lg hover:shadow-glow-xl hover:scale-110 transition-all duration-500 hover:bg-primary-50 w-full sm:w-auto shine card-hover"
            >
              Explore Events
            </Link>
            <Link
              href="/events/create"
              className="px-10 py-5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-primary-500/40 hover:shadow-glow-xl hover:from-primary-600 hover:to-primary-700 hover:scale-110 transition-all duration-500 w-full sm:w-auto shine card-hover"
            >
              Create Event
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <FeatureCard
            icon={<Calendar className="w-10 h-10" />}
            title="Discover Events"
            description="Browse through thousands of events by category, date, and location."
            delay="0"
          />
          <FeatureCard
            icon={<Ticket className="w-10 h-10" />}
            title="Secure Booking"
            description="Buy tickets safely with Stripe integration and instant confirmation."
            delay="100"
          />
          <FeatureCard
            icon={<MapPin className="w-10 h-10" />}
            title="Easy Booking"
            description="Quick and simple ticket booking process with instant confirmation."
            delay="200"
          />
          <FeatureCard
            icon={<Users className="w-10 h-10" />}
            title="Real-time Tracking"
            description="Track attendance and manage your events with live analytics."
            delay="300"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-primary-700/50 relative z-10">
        <div className="text-center text-primary-200/80">
          <p>&copy; 2024 Ticket Hub. Built with Next.js and modern web technologies.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  delay = "0",
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay?: string
}) {
  return (
    <div 
      className="glass-dark rounded-2xl p-8 md:p-10 hover:bg-white/20 hover:scale-110 transition-all duration-700 hover-lift group cursor-pointer card-hover premium-border"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-primary-300 mb-6 group-hover:text-primary-100 transition-all duration-500 group-hover:scale-125 inline-block transform animate-float-slow">
        {icon}
      </div>
      <h3 className="text-xl md:text-2xl font-extrabold text-white mb-4 group-hover:text-primary-50 transition-all duration-500 text-shadow">
        {title}
      </h3>
      <p className="text-primary-200/90 leading-relaxed group-hover:text-primary-100 transition-all duration-500 text-base">
        {description}
      </p>
    </div>
  )
}

