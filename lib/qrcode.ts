import QRCode from 'qrcode'
import crypto from 'crypto'

export function generateTicketId(): string {
  return crypto.randomBytes(16).toString('hex')
}

export async function generateQRCode(data: string): Promise<string> {
  try {
    // Generate high-quality QR code optimized for scanning apps like Google Lens
    // Using larger size and better error correction for maximum compatibility
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M', // Medium error correction (better for scanning apps)
      margin: 2, // Standard margin (too large can confuse some scanners)
      width: 1000, // Much larger size for better scanning
      color: {
        dark: '#000000', // Pure black
        light: '#FFFFFF', // Pure white
      },
    })
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

