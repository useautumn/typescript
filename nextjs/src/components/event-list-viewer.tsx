import type { EventListItem } from "autumn-js";

export function EventListViewer({ events }: { events: EventListItem[] }) {
  if (events.length === 0) {
    return (
      <details className="p-4 rounded-lg">
        <summary className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600">
          Event Logs
        </summary>
        <p className="mt-4 text-gray-500">No events found.</p>
      </details>
    );
  }

  return (
    <details className="p-4 rounded-lg">
      <summary className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600">
        Event Logs ({events.length})
      </summary>
      <div className="space-y-3 mt-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="border-l-2 border-green-300 pl-3 py-2"
          >
            <p>
              <span className="font-medium">ID:</span>{" "}
              <span className="font-mono text-sm">{event.id}</span>
            </p>
            <p>
              <span className="font-medium">Feature ID:</span> {event.feature_id}
            </p>
            <p>
              <span className="font-medium">Customer ID:</span>{" "}
              {event.customer_id}
            </p>
            <p>
              <span className="font-medium">Value:</span> {event.value}
            </p>
            <p>
              <span className="font-medium">Timestamp:</span>{" "}
              {new Date(event.timestamp).toLocaleString()}
            </p>
            {event.properties &&
              Object.keys(event.properties).length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-sm">Properties:</p>
                  <pre className="ml-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.properties, null, 2)}
                  </pre>
                </div>
              )}
          </div>
        ))}
      </div>
    </details>
  );
}
