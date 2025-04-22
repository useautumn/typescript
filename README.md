# Autumn JS Library

autumn-js is a comprehensive JavaScript/TypeScript library for interacting with the Autumn pricing platform. This package provides both a server-side SDK for the Autumn API and a Next.js integration package for seamless client-side implementation.

## Features

- 🚀 Complete Autumn API SDK
- ⚡ Next.js Integration
- 🔒 Type-safe API interactions
- 🛠️ Easy-to-use hooks and components

## Installation

```bash
npm install autumn-js
```

## Configuration

Add your Autumn secret key to your environment variables:

```env
AUTUMN_SECRET_KEY=your_secret_key_here
```

## Usage

### Server-Side SDK

For server-side applications (Node.js, Express, etc.), use the SDK like this:

```typescript
import { Autumn } from 'autumn-js'

// Initialize Autumn
const autumn = new Autumn()

// Create a customer
await autumn.customers.create({
  id: "customer_123",
  name: "John Doe"
})
```

### Next.js Integration

For Next.js applications, Autumn.js provides a dedicated integration with helpful hooks and components.

**1.** First, wrap your application with the `AutumnProvider` in your root layout.tsx (this must be a Server Component):

```jsx
// app/layout.tsx

import { AutumnProvider } from 'autumn-js/next'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <AutumnProvider customerId="YOUR_CUSTOMER_ID">
          {children}
        </AutumnProvider>
      </body>
    </html>
  )
}
```

**2.** Then use the `useAutumn` hook in your components:

```jsx
import { useAutumn } from 'autumn-js/next'

export default function BillingPage() {
  const { customer, attach, openBillingPortal } = useAutumn()

  return (
    <div>
      <h1>Welcome {customer?.name}</h1>
      <button onClick={() => openBillingPortal()}>
        Manage Billing
      </button>
      <button onClick={() => attach()}>
        Upgrade to Pro
      </button>
    </div>
  )
}
```

The `useAutumn` hook exports several useful functions:

- `attach({ productId })`: Opens a checkout URL automatically when called to attach a product to the customer
- `openBillingPortal()`: Opens Stripe's billing portal for the current customer to manage their subscription and billing settings
- `entitled({ featureId })`: Checks if the customer is entitled to use a specific feature
- `sendEvent({ featureId, value })`: Records usage for a particular feature


<br/>

**3.** For authentication, you can either pass a customer ID directly or use our auth plugin (which allows you to easily integrate with popular providers like Better Auth):

Better Auth Example:
```jsx
<AutumnProvider
  authPlugin={{
    provider: "better-auth", 
    instance: auth, // Your server-side better-auth instance
    useOrg: true, // Set to true if organizations are your customers
  }}
>
  {children}
</AutumnProvider>
```

Clerk Example:
```jsx
<AutumnProvider
  authPlugin={{
    provider: "clerk", 
    useOrg: true, // Set to true if organizations are your customers
  }}
>
  {children}
</AutumnProvider>
```

## API Reference

For detailed API documentation, visit [docs.useautumn.com](https://docs.useautumn.com)

## Support

For support, email hey@useautumn.com!

## License

MIT
