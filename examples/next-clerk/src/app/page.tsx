"use client";

import { useAutumn } from "autumn-js/next";

export default function Home() {
  const { customer, attach } = useAutumn();

  return (
    <div>
      <h1>Hello {customer?.name}</h1>
      <button onClick={() => attach({ productId: "test" })}>Attach</button>
    </div>
  );
}
