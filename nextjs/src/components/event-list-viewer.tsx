import type { EventsListItem } from "autumn-js";
import { useListEvents } from "autumn-js/react";

export function EventListViewer() {
	const { list, nextPage, prevPage, hasMore, hasPrevious, page, isLoading } =
		useListEvents({
			featureId: "revenue",
			// customRange: {
			// 	start: Date.now() - 1000 * 60 * 60 * 24,
			// 	end: Date.now(),
			// },
			limit: 10,
		});

	return (
		<details className="p-4 rounded-lg">
			<summary className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600">
				Event Logs
			</summary>

			{/* Pagination controls at top */}
			<div className="flex items-center gap-2 mt-4 mb-4">
				<button
					type="button"
					onClick={prevPage}
					disabled={!hasPrevious || isLoading}
					className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					← Previous
				</button>
				<span className="text-sm text-gray-600">Page {page + 1}</span>
				<button
					type="button"
					onClick={nextPage}
					disabled={!hasMore || isLoading}
					className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Next →
				</button>
				{isLoading && <span className="text-sm text-gray-500">Loading...</span>}
			</div>

			{/* Content */}
			{!isLoading && list?.length === 0 && (
				<p className="text-gray-500">No events found.</p>
			)}

			<div className="space-y-3">
				{list?.map((event: EventsListItem) => (
					<div key={event.id} className="border-l-2 border-green-300 pl-3 py-2">
						<p>
							<span className="font-medium">ID:</span>{" "}
							<span className="font-mono text-sm">{event.id}</span>
						</p>
						<p>
							<span className="font-medium">Feature ID:</span>{" "}
							{event.feature_id}
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
						{event.properties && Object.keys(event.properties).length > 0 && (
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
