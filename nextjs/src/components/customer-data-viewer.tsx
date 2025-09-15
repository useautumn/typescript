import type { Customer } from "autumn-js";

export function CustomerDataViewer({ customer }: { customer: Customer }) {
  return (
    <details className="p-4 rounded-lg">
      <summary className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600">
        Customer
      </summary>
      <div className="space-y-1 mt-4">
        <p>
          <span className="font-medium">ID:</span> {customer.id ?? "—"}
        </p>
        <p>
          <span className="font-medium">Email:</span> {customer.email ?? "—"}
        </p>
        <p>
          <span className="font-medium">Name:</span> {customer.name ?? "—"}
        </p>
        <p>
          <span className="font-medium">Environment:</span> {customer.env}
        </p>
        <p>
          <span className="font-medium">Stripe ID:</span>{" "}
          {customer.stripe_id ?? "None"}
        </p>

        {customer.products.length > 0 && (
          <div className="mt-3">
            <p className="font-medium">Products:</p>
            <div className="ml-4 space-y-2">
              {customer.products.map((product, index) => (
                <div key={index} className="border-l-2 border-gray-300 pl-3">
                  <p>
                    <span className="font-medium">ID:</span> {product.id}
                  </p>
                  <p>
                    <span className="font-medium">Name:</span> {product.name}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {product.status}
                  </p>
                  <p>
                    <span className="font-medium">Default:</span>{" "}
                    {product.is_default ? "Yes" : "No"}
                  </p>
                  {product.started_at && (
                    <p>
                      <span className="font-medium">Started:</span>{" "}
                      {new Date(product.started_at).toLocaleDateString()}
                    </p>
                  )}
                  {product.items.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-sm">Items:</p>
                      <div className="ml-2 space-y-1">
                        {product.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="text-sm">
                            <p>
                              <span className="font-medium">Feature:</span>{" "}
                              {item.feature_id} ({item.feature?.type ?? "-"})
                            </p>
                            <p>
                              <span className="font-medium">Usage:</span>{" "}
                              {item.included_usage ?? "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(customer.features).length > 0 && (
          <div className="mt-3">
            <p className="font-medium">Features:</p>
            <div className="ml-4 space-y-2">
              {Object.keys(customer.features).map((featureId) => {
                const feature = customer.features[featureId];
                return (
                  <div
                    key={featureId}
                    className="border-l-2 border-blue-300 pl-3"
                  >
                    <p>
                      <span className="font-medium">ID:</span> {feature.id}
                    </p>
                    <p>
                      <span className="font-medium">Name:</span> {feature.name}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {feature.type}
                    </p>
                    <p>
                      <span className="font-medium">Balance:</span>{" "}
                      {feature.balance ?? "-"}
                    </p>
                    <p>
                      <span className="font-medium">Usage:</span>{" "}
                      {feature.usage ?? "-"}
                    </p>
                    <p>
                      <span className="font-medium">Included:</span>{" "}
                      {feature.included_usage ?? "-"}
                    </p>
                    <p>
                      <span className="font-medium">Unlimited:</span>{" "}
                      {feature.unlimited ? "Yes" : "No"}
                    </p>
                    {feature.next_reset_at && (
                      <p>
                        <span className="font-medium">Next Reset:</span>{" "}
                        {new Date(feature.next_reset_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
