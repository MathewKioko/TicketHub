import Stripe from 'stripe'

// Lazy initialization to avoid errors during build time
let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    
    if (!secretKey) {
      // During build phase, Next.js collects page data and may not have env vars
      // Use a dummy key to allow build to complete
      // At runtime, Vercel will have env vars available, so this should only happen during build
      const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
      
      if (isBuildPhase) {
        // Build phase - use dummy key to prevent build errors
        // Runtime will have access to actual env vars
        stripeInstance = new Stripe('sk_test_dummy_for_build_only', {
          apiVersion: '2025-02-24.acacia',
        })
      } else {
        // Runtime without key - throw error (shouldn't happen if env vars are configured)
        throw new Error('STRIPE_SECRET_KEY is not set. Please configure it in your environment variables.')
      }
    } else {
      stripeInstance = new Stripe(secretKey, {
        apiVersion: '2025-02-24.acacia',
      })
    }
  }
  return stripeInstance
}

// Export a function that returns stripe instance instead of creating Proxy at module load
export function getStripeInstance(): Stripe {
  return getStripe()
}

// Create a lazy proxy that only initializes when accessed
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    // Only initialize when actually accessed, not at module load
    const instance = getStripe()
    const value = instance[prop as keyof Stripe]
    // If it's a function, bind it to the instance
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})

export async function createCheckoutSession(
  ticketIds: string[],
  eventId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string,
  tickets: Array<{ id: string; price: number; event: { title: string } }>
) {
  // Store only essential metadata (ticketIds can be fetched by session ID from database)
  // Stripe metadata has a 500 character limit, so we can't store all ticket IDs
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: tickets.map((ticket) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${ticket.event.title} - Ticket`,
        },
        unit_amount: Math.round(ticket.price * 100), // Convert to cents
      },
      quantity: 1,
    })),
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      eventId,
      userId,
      ticketCount: tickets.length.toString(), // Store count instead of all IDs
    },
  })

  return session
}

