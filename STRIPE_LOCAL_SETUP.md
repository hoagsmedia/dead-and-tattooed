# Stripe Local Development Setup

For local development, you need to set up Stripe webhooks to test the complete payment flow. Stripe webhooks require HTTPS, but you can use Stripe CLI to forward webhooks to your local server.

## Setup Steps

### 1. Install Stripe CLI

Install the Stripe CLI from: https://stripe.com/docs/stripe-cli

**macOS:**

```bash
brew install stripe/stripe-cli/stripe
```

**Other platforms:**
See https://stripe.com/docs/stripe-cli/install

### 2. Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate with your Stripe account.

### 3. Forward Webhooks to Local Server

In a separate terminal, run:

```bash
stripe listen --forward-to localhost:5173/api/stripe/webhook
```

This will:

- Forward webhook events from Stripe to your local server
- Output a webhook signing secret (starts with `whsec_`)

### 4. Add Webhook Secret to .env

Copy the webhook signing secret from the CLI output and add it to your `.env` file:

```
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 5. Restart Your Dev Server

Restart your SvelteKit dev server to pick up the new environment variable.

## Testing Payments

1. Use Stripe test cards: https://stripe.com/docs/testing
   - Success: `4242 4242 4242 4242`
   - Requires 3D Secure: `4000 0025 0000 3155`
   - Any future expiry date, any CVC

2. Complete a test checkout
3. Check the Stripe CLI terminal for webhook events
4. Verify the order status in your database

## Troubleshooting

### Payment Intent Shows as "Incomplete"

If the payment intent shows as "incomplete" in Stripe Dashboard:

1. **Check payment status in console**: The browser console will log the payment intent status
2. **Verify webhook is running**: Make sure `stripe listen` is running
3. **Check webhook secret**: Ensure `STRIPE_WEBHOOK_SECRET` matches the CLI output
4. **Check server logs**: Look for errors in your server console

### Webhook Not Receiving Events

1. Verify `stripe listen` is running and connected
2. Check that the webhook endpoint URL matches: `localhost:5173/api/stripe/webhook`
3. Ensure your dev server is running on port 5173
4. Check the Stripe CLI output for any errors

### Payment Status Issues

The payment intent can have these statuses:

- `requires_payment_method`: Payment method not attached
- `requires_confirmation`: Needs to be confirmed
- `requires_action`: Requires 3D Secure or other authentication
- `processing`: Payment is being processed
- `requires_capture`: Payment authorized, ready to capture
- `succeeded`: Payment completed successfully
- `canceled`: Payment was canceled

The code accepts both `succeeded` and `requires_capture` as successful states.

## Production Setup

For production:

1. Set up a webhook endpoint in Stripe Dashboard
2. Use the production webhook signing secret (starts with `whsec_`)
3. Ensure your production server has HTTPS
4. Update `STRIPE_WEBHOOK_SECRET` in your production environment variables
