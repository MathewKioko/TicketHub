interface CalendarEvent {
  title: string
  description: string
  location: string
  startDate: Date
  endDate?: Date
  organizer?: {
    name: string
    email: string
  }
}

export function generateICSFile(event: CalendarEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
  }

  const startDate = formatDate(event.startDate)
  const endDate = event.endDate ? formatDate(event.endDate) : formatDate(new Date(event.startDate.getTime() + 2 * 60 * 60 * 1000)) // Default 2 hours if no end date

  let ics = 'BEGIN:VCALENDAR\r\n'
  ics += 'VERSION:2.0\r\n'
  ics += 'PRODID:-//Ticket Hub//Event Management//EN\r\n'
  ics += 'CALSCALE:GREGORIAN\r\n'
  ics += 'METHOD:PUBLISH\r\n'
  ics += 'BEGIN:VEVENT\r\n'
  ics += `UID:${Date.now()}-${Math.random().toString(36).substring(7)}@Ticket Hub.com\r\n`
  ics += `DTSTAMP:${formatDate(new Date())}\r\n`
  ics += `DTSTART:${startDate}\r\n`
  ics += `DTEND:${endDate}\r\n`
  ics += `SUMMARY:${escapeText(event.title)}\r\n`
  ics += `DESCRIPTION:${escapeText(event.description)}\r\n`
  ics += `LOCATION:${escapeText(event.location)}\r\n`
  
  if (event.organizer) {
    ics += `ORGANIZER;CN=${escapeText(event.organizer.name)}:MAILTO:${event.organizer.email}\r\n`
  }
  
  ics += 'STATUS:CONFIRMED\r\n'
  ics += 'SEQUENCE:0\r\n'
  ics += 'END:VEVENT\r\n'
  ics += 'END:VCALENDAR\r\n'

  return ics
}

export function downloadCalendarFile(event: CalendarEvent, filename?: string): void {
  const icsContent = generateICSFile(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

