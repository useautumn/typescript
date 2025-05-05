# pricecn

This repo is a fork of [shadcn/registry-template](https://github.com/shadcn-ui/registry-template)

**pricecn** is a free and open source project for beautiful, customizable shadcn pricing components.

Currently, we offer the `<PricingTable />` component, with more components coming soon, such as `<FeatureTable />`, `<ManageBilling />`, and more.


## Usage

### 1. Install

To add the Pricing Table component to your project, run:

```bash
npx shadcn@latest add https://pricecn.com/classic/pricing-table.json
```

This will install the component in the `components/pricing` folder. You can also replace `/classic` with `/clean` or `/dev` for different themes.

---

### 2. Example Usage

An example usage of `<PricingTable />` will be downloaded as `components/pricing/example.tsx`. This file demonstrates how to define your products and pass them into the `PricingTable` component.

```tsx
import { PricingTable, PricingCard, Product } from "./pricing-table";

export const products: Product[] = [
  {
    id: "hobby",
    name: "Hobby",
    description: "For personal projects and small-scale applications.",
    price: { primaryText: "Free", secondaryText: "up to 3 users" },
    buttonText: "Start deploying",
    items: [
      { primaryText: "Deploy full-stack apps in minutes" },
      { primaryText: "Fully-managed datastores" },
      // ...more features
    ],
  },
  // ...more products
];

export const PricingTableExample = () => (
  <PricingTable products={products} showFeatures={true}>
    <PricingCard productId="hobby" />
    <PricingCard productId="professional" />
    <PricingCard productId="enterprise" />
  </PricingTable>
);
```

---

### 3. Product Schema

Here's the schema for a `Product`:

```ts
type Product = {
  id: string;
  name: string;
  description?: string;
  recommendedText?: string;
  price: {
    primaryText: string;
    secondaryText?: string;
  };
  priceAnnual?: {
    primaryText: string;
    secondaryText?: string;
  };
  buttonText: string;
  everythingFrom?: string;
  items: {
    primaryText: string;
    secondaryText?: string;
  }[];
};
```

