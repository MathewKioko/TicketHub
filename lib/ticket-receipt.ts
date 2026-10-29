export interface TicketReceiptData {
  id: string
  event: {
    title: string
    date: string
    venue: string
    imageUrl?: string
  }
  user: {
    name: string
    email: string
  }
  price: number
  quantity: number
  status: string
  qrCodeImage?: string
  qrCodeData?: string
}

/** Receipt vocabulary matches the app's status language. */
const RECEIPT_STATUS: Record<string, { label: string; tone: string }> = {
  CONFIRMED: { label: 'Paid', tone: '#1C5C42' },
  CHECKED_IN: { label: 'Admitted', tone: '#1C5C42' },
  PENDING: { label: 'Payment pending', tone: '#9A6413' },
  CANCELLED: { label: 'Cancelled', tone: '#96201A' },
  REFUNDED: { label: 'Refunded', tone: '#5B5346' },
  FAILED: { label: 'Payment failed', tone: '#96201A' },
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatKes(amount: number): string {
  const value = Number.isFinite(amount) ? Math.round(amount) : 0
  return `KES ${value.toLocaleString('en-US')}`
}

function formatNairobiDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date to be confirmed'
  return `${date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  })} EAT`
}

export async function generateTicketReceipt(ticket: TicketReceiptData): Promise<string> {
  const status = RECEIPT_STATUS[ticket.status] ?? { label: ticket.status, tone: '#5B5346' }
  const total = formatKes(ticket.price * ticket.quantity)
  const unit = formatKes(ticket.price)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(ticket.event.title)} — receipt</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      background: #FAF7F2;
      color: #16130F;
      padding: 32px 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      max-width: 560px;
      margin: 0 auto;
      background: #FFFDF9;
      border: 1px solid #E3DACA;
      padding: 32px;
    }
    .wordmark {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      padding-bottom: 14px;
      border-bottom: 2px solid #16130F;
    }
    .sheet-title {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 30px;
      line-height: 1.1;
      margin-top: 22px;
    }
    .event-image {
      width: 100%;
      height: 170px;
      object-fit: cover;
      display: block;
      margin-top: 18px;
    }
    dl { margin-top: 22px; border-top: 1px solid #E3DACA; }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      padding: 11px 0;
      border-bottom: 1px solid #E3DACA;
    }
    dt {
      color: #5B5346;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      padding-top: 2px;
    }
    dd { font-size: 13px; text-align: right; }
    .qr-block {
      margin-top: 24px;
      padding: 20px;
      border: 1px dashed #E3DACA;
      text-align: center;
    }
    .qr-block img { width: 220px; height: 220px; display: block; margin: 0 auto; background: #fff; }
    .qr-note { font-size: 11px; color: #5B5346; margin-top: 12px; }
    .total {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 2px solid #16130F;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .total-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.09em;
      text-transform: uppercase;
      color: #5B5346;
    }
    .total-value { font-family: Georgia, "Times New Roman", serif; font-size: 30px; }
    .status {
      display: inline-block;
      margin-top: 14px;
      padding: 5px 10px;
      border: 1px solid ${status.tone};
      color: ${status.tone};
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .footer {
      margin-top: 26px;
      padding-top: 14px;
      border-top: 1px solid #E3DACA;
      font-size: 11px;
      color: #5B5346;
      line-height: 1.6;
      word-break: break-all;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { border: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="wordmark">TicketHub · Nairobi</div>
    <h1 class="sheet-title">${escapeHtml(ticket.event.title)}</h1>
    ${ticket.event.imageUrl ? `<img class="event-image" src="${escapeHtml(ticket.event.imageUrl)}" alt="">` : ''}

    <dl>
      <div class="row"><dt>Date</dt><dd>${escapeHtml(formatNairobiDate(ticket.event.date))}</dd></div>
      <div class="row"><dt>Venue</dt><dd>${escapeHtml(ticket.event.venue)}</dd></div>
      <div class="row"><dt>Attendee</dt><dd>${escapeHtml(ticket.user.name)}</dd></div>
      <div class="row"><dt>Email</dt><dd>${escapeHtml(ticket.user.email)}</dd></div>
      <div class="row"><dt>Quantity</dt><dd>${ticket.quantity} admission${ticket.quantity === 1 ? '' : 's'}</dd></div>
      <div class="row"><dt>Unit price</dt><dd>${unit}</dd></div>
    </dl>

    ${
      ticket.qrCodeImage
        ? `<div class="qr-block">
      <img src="${ticket.qrCodeImage}" alt="Admission QR code">
      <p class="qr-note">One scan admits one guest. Screenshots are accepted.</p>
    </div>`
        : ''
    }

    <div class="total">
      <div>
        <div class="total-label">Total paid</div>
        <div class="status">${escapeHtml(status.label)}</div>
      </div>
      <div class="total-value">${total}</div>
    </div>

    <div class="footer">
      <p>Ticket reference ${escapeHtml(ticket.id)}</p>
      <p>Issued by TicketHub. Admission requires this QR code or the ticket page. Keep this receipt for your records.</p>
    </div>
  </div>
</body>
</html>`

  return html
}

export async function downloadTicketReceipt(ticket: TicketReceiptData) {
  try {
    const html = await generateTicketReceipt(ticket)

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)

    const printWindow = window.open(url, '_blank')

    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          setTimeout(() => {
            URL.revokeObjectURL(url)
          }, 1000)
        }, 500)
      }
    } else {
      const link = document.createElement('a')
      link.href = url
      link.download = `ticket-${ticket.id}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    console.error('Error generating ticket receipt:', error)
    throw error
  }
}
