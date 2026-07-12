# 🐷 Dead & Tattooed

Dead & Tattooed is an e-commerce web app built for a tattoo artist who sells preserved tattoo art pieces.  
Each piece is a one-of-a-kind specimen — tattooed pig’s feet sealed in jars and sold as collectible artwork.  
The goal is to move away from Etsy’s high fees and create a standalone, secure storefront with full creative control.

---

## 🧰 Tech Stack

- **Framework:** Svelte 5 + TypeScript
- **UI:** Tailwind CSS 4 + shadcn-svelte
- **Database:** PostgreSQL (Neon) + Drizzle ORM
- **Auth:** Better Auth
- **Payments:** Stripe
- **Validation:** Zod 4
- **Package Manager:** pnpm

---

## 🗺️ Roadmap

### ✅ Completed

- [x] Project setup (Svelte 5 + Tailwind 4 + pnpm)
- [x] Stripe integration for product checkout
- [x] Drizzle ORM schema setup and Neon database connection
- [x] Basic product seeding (3 sample art pieces)
- [x] Auth with Better Auth (admin-only access for now)

### 🚧 In Progress

- [ ] Admin dashboard (add/edit/delete products)
- [ ] File uploads for product images (S3 or R2)
- [x] Stripe webhook handling for order fulfillment
- [ ] Order and inventory management views

### 🧩 Future Features

- [ ] Customer accounts and order history
- [ ] Email notifications for orders
- [ ] Scheduled “drop” feature for limited releases
- [ ] Custom product photo storage integration
- [ ] Client portal and analytics dashboard

---

---

## 🧪 Local Development

### Stripe Webhook Testing

For local development, use Stripe CLI to forward webhooks to your local server:

1. **Install Stripe CLI**: Follow instructions at https://docs.stripe.com/cli
2. **Login**: `stripe login`
3. **Forward webhooks**:
   ```bash
   stripe listen --forward-to localhost:5173/api/stripe/webhook
   ```
4. **Copy the webhook signing secret** (starts with `whsec_`) and add it to your `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

The webhook endpoint will now receive events forwarded from Stripe CLI. You can trigger test events using:

```bash
stripe trigger payment_intent.succeeded
```

---

## 🖋️ Author

Built by [Josh](https://github.com/) for his friend's growing tattoo art business.  
Real ink. Real preservation. Real weird.
