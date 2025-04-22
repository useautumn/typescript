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

// Other available operations
await autumn.attach(...)
await autumn.entitled(...)
await autumn.event(...)
```

### Next.js Integration

For Next.js applications, Autumn.js provides a dedicated integration with helpful hooks and components.

1. First, wrap your application with the `AutumnProvider` in your root layout:

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

2. Then use the `useAutumn` hook in your components:

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


## API Reference

For detailed API documentation, visit [docs.useautumn.com](https://docs.useautumn.com)

## Support

For support, email hey@useautumn.com!

## License

MIT
