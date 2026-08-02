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

export async function generateTicketReceipt(ticket: TicketReceiptData): Promise<string> {
  // Create HTML template for ticket receipt
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .ticket-receipt {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #0ea5e9;
        }
        .header h1 {
          color: #0ea5e9;
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .header p {
          color: #666;
          font-size: 16px;
        }
        .event-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 12px;
          margin-bottom: 25px;
        }
        .event-title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .info-section {
          margin-bottom: 25px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-label {
          color: #6b7280;
          font-weight: 600;
          font-size: 14px;
        }
        .info-value {
          color: #1f2937;
          font-weight: 500;
          font-size: 14px;
          text-align: right;
        }
        .qr-section {
          background: #f9fafb;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          margin: 30px 0;
          border: 3px solid #0ea5e9;
        }
        .qr-code {
          width: 250px;
          height: 250px;
          margin: 0 auto 15px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          display: inline-block;
        }
        .qr-code img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .qr-label {
          color: #1f2937;
          font-weight: bold;
          font-size: 16px;
          margin-top: 10px;
        }
        .price-section {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          margin-top: 25px;
        }
        .price-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 5px;
        }
        .price-value {
          font-size: 36px;
          font-weight: bold;
        }
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 15px;
        }
        .status-confirmed {
          background: #10b981;
          color: white;
        }
        .status-pending {
          background: #f59e0b;
          color: white;
        }
        .status-checked-in {
          background: #3b82f6;
          color: white;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="ticket-receipt">
        <div class="header">
          <h1>🎫 Ticket Hub</h1>
          <p>Ticket Receipt</p>
        </div>
        
        ${ticket.event.imageUrl ? `<img src="${ticket.event.imageUrl}" alt="${ticket.event.title}" class="event-image">` : ''}
        
        <h2 class="event-title">${ticket.event.title}</h2>
        
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Date & Time</span>
            <span class="info-value">${new Date(ticket.event.date).toLocaleString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Venue</span>
            <span class="info-value">${ticket.event.venue}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Attendee</span>
            <span class="info-value">${ticket.user.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${ticket.user.email}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Quantity</span>
            <span class="info-value">${ticket.quantity} ticket${ticket.quantity !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        ${ticket.qrCodeImage ? `
        <div class="qr-section">
          <div class="qr-code">
            <img src="${ticket.qrCodeImage}" alt="QR Code">
          </div>
          <div class="qr-label">Scan this QR code at the event entrance</div>
        </div>
        ` : ''}
        
        <div class="price-section">
          <div class="price-label">Total Amount</div>
          <div class="price-value">$${(ticket.price * ticket.quantity).toFixed(2)}</div>
          <div class="status-badge status-${ticket.status.toLowerCase().replace('_', '-')}">
            ${ticket.status}
          </div>
        </div>
        
        <div class="footer">
          <p>Ticket ID: ${ticket.id}</p>
          <p>Thank you for using Ticket Hub!</p>
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

export async function downloadTicketReceipt(ticket: TicketReceiptData) {
  try {
    // Generate HTML
    const html = await generateTicketReceipt(ticket)
    
    // Create a blob URL from the HTML
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    // Open in new window for printing/downloading
    const printWindow = window.open(url, '_blank')
    
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          // Clean up after a delay
          setTimeout(() => {
            URL.revokeObjectURL(url)
          }, 1000)
        }, 500)
      }
    } else {
      // Fallback: download as HTML file
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

