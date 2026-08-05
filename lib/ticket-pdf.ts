/**
 * Branded Midnight Luxe PDF ticket generator.
 * Uses @react-pdf/renderer to render a gold-and-onyx ticket with a QR code.
 */

// Lazy dynamic import so the app still builds if the package isn't installed yet.
export interface PdfTicketData {
  id: string
  ticketIdHuman: string
  eventTitle: string
  eventDate: string
  eventTime: string
  venue: string
  attendeeName: string
  attendeeEmail: string
  quantity: number
  price: number
  currency: string
  status: string
  qrCodeDataUrl?: string
}

export async function generateTicketPdfBuffer(data: PdfTicketData): Promise<Buffer | null> {
  try {
    const ReactPDF = await import('@react-pdf/renderer')
    const React = await import('react')

    const {
      Document,
      Page,
      Text,
      View,
      Image: PdfImage,
      StyleSheet,
      Font,
    } = ReactPDF

    // Register a clean serif font (built-in Helvetica fallback keeps it lightweight)
    try {
      Font.register({
        family: 'Playfair',
        fonts: [
          {
            src: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDXZNLoU2k.woff2',
          },
        ],
      })
    } catch {
      // Ignore font load failure — fallback to default
    }

    const styles = StyleSheet.create({
      page: {
        backgroundColor: '#0A0A0B',
        padding: 24,
        fontFamily: 'Helvetica',
      },
      card: {
        backgroundColor: '#17171A',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#D4AF7A',
        padding: 24,
        flexDirection: 'column',
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(212,175,122,0.25)',
        paddingBottom: 14,
        marginBottom: 18,
      },
      brand: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      brandMark: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: '#D4AF7A',
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
      },
      brandText: {
        color: '#F5F1E8',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
      },
      brandTag: {
        color: '#D4AF7A',
        fontSize: 8,
        letterSpacing: 2,
        textTransform: 'uppercase',
      },
      eventTitle: {
        color: '#F5F1E8',
        fontSize: 22,
        fontWeight: 'bold',
        lineHeight: 1.3,
        marginBottom: 2,
      },
      statusPill: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(212,175,122,0.15)',
        borderColor: '#D4AF7A',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        color: '#D4AF7A',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 16,
      },
      row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
      },
      label: {
        color: '#8A8578',
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
      },
      value: {
        color: '#F5F1E8',
        fontSize: 13,
        fontWeight: 'bold',
      },
      qrWrap: {
        marginTop: 18,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
      },
      qr: {
        width: 160,
        height: 160,
      },
      qrLabel: {
        color: '#0A0A0B',
        fontSize: 9,
        fontWeight: 'bold',
        marginTop: 6,
        textAlign: 'center',
      },
      footer: {
        marginTop: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(212,175,122,0.2)',
        paddingTop: 12,
      },
      footerText: {
        color: '#8A8578',
        fontSize: 8,
      },
      footerId: {
        color: '#D4AF7A',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
      },
    })

    const TicketDoc = React.createElement(
      Document,
      null,
React.createElement(
        Page,
        { size: [340, 560], style: styles.page },
        React.createElement(
          View,
          { style: styles.card },
          React.createElement(
            View,
            { style: styles.header },
            React.createElement(
              View,
              { style: styles.brand },
              React.createElement(View, { style: styles.brandMark }),
              React.createElement(
                View,
                null,
                React.createElement(Text, { style: styles.brandText }, 'TicketHub'),
                React.createElement(Text, { style: styles.brandTag }, 'Midnight Luxe Events')
              )
            ),
            React.createElement(
              View,
              null,
              React.createElement(Text, { style: styles.label }, 'Ticket No.'),
              React.createElement(Text, { style: styles.footerId }, data.ticketIdHuman)
            )
          ),
          React.createElement(Text, { style: styles.eventTitle }, data.eventTitle),
          React.createElement(Text, { style: styles.statusPill }, data.status),

          React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.label }, 'Date & Time'),
            React.createElement(
              Text,
              { style: styles.value },
              `${data.eventDate}${data.eventTime ? `  |  ${data.eventTime}` : ''}`
            )
          ),

          React.createElement(
            View,
            { style: { marginTop: 10 } },
            React.createElement(Text, { style: styles.label }, 'Venue'),
            React.createElement(Text, { style: styles.value }, data.venue)
          ),

          React.createElement(
            View,
            { style: { marginTop: 10 } },
            React.createElement(Text, { style: styles.label }, 'Attendee'),
            React.createElement(
              Text,
              { style: styles.value },
              `${data.attendeeName}  •  ${data.attendeeEmail}`
            )
          ),

          React.createElement(
            View,
            { style: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' } },
            React.createElement(
              View,
              null,
              React.createElement(Text, { style: styles.label }, 'Qty'),
              React.createElement(Text, { style: styles.value }, String(data.quantity))
            ),
            React.createElement(
              View,
              null,
              React.createElement(Text, { style: styles.label }, 'Total'),
              React.createElement(
                Text,
                { style: styles.value },
                `${data.currency || 'KES'} ${(data.price * data.quantity).toLocaleString()}`
              )
            )
          ),

          data.qrCodeDataUrl
            ? React.createElement(
                View,
                { style: styles.qrWrap },
                React.createElement(PdfImage, { src: data.qrCodeDataUrl, style: styles.qr }),
                React.createElement(
                  Text,
                  { style: styles.qrLabel },
                  'Scan this QR code at the event entrance'
                )
              )
            : null,

          React.createElement(
            View,
            { style: styles.footer },
            React.createElement(
              View,
              null,
              React.createElement(Text, { style: styles.footerText }, 'TicketHub Kenya'),
              React.createElement(Text, { style: styles.footerText }, 'Powered by Paystack')
            ),
            React.createElement(
              View,
              { style: { alignItems: 'flex-end' } },
              React.createElement(Text, { style: styles.footerText }, 'Entry Pass'),
              React.createElement(Text, { style: styles.footerId }, data.id)
            )
          )
        )
      )
    )

    const { pdf } = ReactPDF
    const blobPromise = pdf(TicketDoc).toBuffer() as unknown as Promise<Buffer>
    return await blobPromise
  } catch (error) {
    console.warn('PDF generation unavailable (is @react-pdf/renderer installed?):', error)
    return null
  }
}
