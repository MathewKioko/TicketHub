# M-Pesa Integration Plan for Ticket Hub

## What is M-Pesa?
M-Pesa is a mobile money transfer service popular in Kenya, Tanzania, and other African countries. It allows users to pay for goods and services using their mobile phones.

## Prerequisites

### 1. M-Pesa Developer Account
- Register at: https://developer.safaricom.co.ke/
- Create an app to get:
  - **Consumer Key**
  - **Consumer Secret**
  - **Passkey** (for STK Push)
  - **Shortcode** (Business/Paybill number)

### 2. Environment Variables Needed
```env
# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=sandbox  # or 'production'
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

## Integration Steps

### Step 1: Install M-Pesa SDK (if available) or use REST API
```bash
npm install axios  # For making HTTP requests to M-Pesa API
```

### Step 2: Create M-Pesa Service Library
- Location: `lib/mpesa.ts`
- Functions needed:
  - `getAccessToken()` - Get OAuth token
  - `initiateSTKPush()` - Initiate payment request
  - `queryTransactionStatus()` - Check payment status
  - `handleCallback()` - Process M-Pesa callback

### Step 3: Update Checkout Flow
- Add payment method selection (Stripe vs M-Pesa)
- Create M-Pesa checkout endpoint
- Handle M-Pesa payment initiation

### Step 4: Create M-Pesa API Routes
- `/api/mpesa/initiate` - Start payment
- `/api/mpesa/callback` - Handle M-Pesa webhook
- `/api/mpesa/status` - Check payment status

### Step 5: Update Database Schema
- Add `mpesaTransactionId` to Ticket model
- Add `paymentMethod` field (STRIPE, MPESA)
- Store M-Pesa transaction details

### Step 6: Update UI
- Add M-Pesa payment option in checkout
- Show payment instructions
- Display payment status

## M-Pesa API Endpoints

### Sandbox (Testing)
- Base URL: `https://sandbox.safaricom.co.ke`
- OAuth: `/oauth/v1/generate?grant_type=client_credentials`
- STK Push: `/mpesa/stkpush/v1/processrequest`

### Production
- Base URL: `https://api.safaricom.co.ke`
- Same endpoints

## Payment Flow

1. User selects M-Pesa payment method
2. User enters phone number
3. System initiates STK Push (push payment to user's phone)
4. User confirms payment on phone
5. M-Pesa sends callback to our webhook
6. System updates ticket status to CONFIRMED

## Important Notes

- **Testing**: Use sandbox environment first
- **Phone Numbers**: Format as 254XXXXXXXXX (Kenya format)
- **Callbacks**: Must be publicly accessible (use ngrok for local testing)
- **Security**: Never expose Consumer Secret in frontend
- **Timeouts**: M-Pesa payments can take 1-2 minutes

## Testing Checklist

- [ ] Get access token successfully
- [ ] Initiate STK Push
- [ ] Receive callback from M-Pesa
- [ ] Update ticket status
- [ ] Handle payment failures
- [ ] Test with different phone numbers

## Resources

- M-Pesa API Documentation: https://developer.safaricom.co.ke/APIs
- STK Push API: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
- Callback Documentation: https://developer.safaricom.co.ke/APIs/MpesaExpressQuery

## Tomorrow's Tasks

1. Set up M-Pesa developer account
2. Get API credentials
3. Create `lib/mpesa.ts` service
4. Create API routes for M-Pesa
5. Update checkout to support M-Pesa
6. Test with sandbox environment






