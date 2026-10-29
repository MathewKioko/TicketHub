import type { Metadata } from 'next'
import { FocusedHeader } from '@/components/layout/FocusedHeader'
import { TicketDocument } from '@/components/tickets/TicketDocument'

export const metadata: Metadata = {
  title: 'Your ticket',
  description: 'Your admission ticket and QR code.',
  robots: { index: false, follow: false },
}

export default function TicketPage({ params }: { params: { id: string } }) {
  return (
    <>
      <FocusedHeader rightLabel="My tickets" rightHref="/dashboard/attendee" maxWidth="max-w-[560px]" />
      <TicketDocument ticketId={params.id} />
    </>
  )
}
