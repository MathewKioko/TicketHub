# M-Pesa Integration Guide for Ticket Hub

## 📋 Overview
This guide will help you integrate M-Pesa (Safaricom's mobile money payment system) into your Ticket Hub platform. M-Pesa is widely used in Kenya and other African countries.

## 🔑 Prerequisites

### 1. M-Pesa Developer Account
- Register at: https://developer.safaricom.co.ke/
- Create an app to get your credentials:
  - **Consumer Key**
  - **Consumer Secret**
  - **Passkey** (for STK Push)
  - **Shortcode** (Business Shortcode)

### 2. Environment Variables
Add these to your `.env` file:

```env
# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=sandbox  # or 'production'
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

### 3. Testing
- Use **Sandbox** environment for testing
- Test phone numbers: https://developer.safaricom.co.ke/test_credentials
- Use test credentials provided by Safaricom

## 🏗️ Architecture

### Payment Flow:
1. User selects M-Pesa as payment method
2. User enters phone number (format: 254712345678)
3. System initiates STK Push to user's phone
4. User enters M-Pesa PIN on their phone
5. M-Pesa sends callback to your webhook
6. System updates ticket status to CONFIRMED

## 📚 M-Pesa API Endpoints

### 1. Authentication (OAuth)
- **URL**: `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`
- **Method**: GET
- **Purpose**: Get access token

### 2. STK Push (Initiate Payment)
- **URL**: `https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest`
- **Method**: POST
- **Purpose**: Send payment request to user's phone

### 3. Query Transaction Status
- **URL**: `https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query`
- **Method**: POST
- **Purpose**: Check payment status

## 🔐 Security Notes
- Never expose Consumer Secret in frontend
- Always validate callbacks from M-Pesa
- Use HTTPS in production
- Store sensitive data securely

## 📦 Required Packages
```bash
npm install axios crypto
```

## 🚀 Implementation Steps

1. **Create M-Pesa utility library** (`lib/mpesa.ts`)
2. **Create M-Pesa checkout API** (`app/api/mpesa/checkout/route.ts`)
3. **Create M-Pesa callback webhook** (`app/api/mpesa/callback/route.ts`)
4. **Update checkout route** to support payment method selection
5. **Update database schema** to store M-Pesa transaction IDs
6. **Update frontend** to show payment method selection

## 📝 Important Notes

- M-Pesa uses **KES (Kenyan Shillings)** as currency
- Phone numbers must be in format: `254712345678` (no +, no spaces)
- Transaction amounts are in **whole shillings** (not cents)
- Callbacks may take 10-30 seconds to arrive
- Always implement timeout/retry logic for status checks

## 🔗 Resources
- Official Docs: https://developer.safaricom.co.ke/APIs
- API Reference: https://developer.safaricom.co.ke/api-reference
- Support: https://developer.safaricom.co.ke/support

## ✅ Testing Checklist
- [ ] Get access token successfully
- [ ] Initiate STK Push
- [ ] Receive callback from M-Pesa
- [ ] Update ticket status correctly
- [ ] Handle failed payments
- [ ] Handle timeout scenarios
- [ ] Test with different phone numbers

