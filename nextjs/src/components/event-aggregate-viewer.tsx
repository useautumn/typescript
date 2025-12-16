type AggregatedEventRow = {
  period: number;
  [key: string]: number | Record<string, number>;
};

type EventAggregationTotal = Record<
  string,
  {
    count: number;
    sum: number;
  }
>;

type EventAggregationResponse = {
  list: AggregatedEventRow[];
  total: EventAggregationTotal;
};

export function EventAggregateViewer({
  data,
}: {
  data: EventAggregationResponse;
}) {
  const { list, total } = data;

  if (list.length === 0 && Object.keys(total).length === 0) {
    return (
      <details className="p-4 rounded-lg">
        <summary className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600">
          Event Aggregation
        </summary>
        <p className="mt-4 text-gray-500">No aggregated data found.</p>
      </details>
    );
  }

  return (
    <details className="p-4 rounded-lg">
      <summary className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-600">
        Event Aggregation
      </summary>
      <div className="space-y-4 mt-4">
        {Object.keys(total).length > 0 && (
          <div>
            <p className="font-medium mb-2">Totals:</p>
            <div className="ml-4 space-y-2">
              {Object.entries(total).map(([featureId, stats]) => (
                <div
                  key={featureId}
                  className="border-l-2 border-purple-300 pl-3"
                >
                  <p>
                    <span className="font-medium">Feature:</span> {featureId}
                  </p>
                  <p>
                    <span className="font-medium">Count:</span> {stats.count}
                  </p>
                  <p>
                    <span className="font-medium">Sum:</span> {stats.sum}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {list.length > 0 && (
          <div>
            <p className="font-medium mb-2">Time Series ({list.length} periods):</p>
            <div className="ml-4 space-y-2">
              {list.map((row, index) => {
                const { period, ...features } = row;
                return (
                  <div
                    key={index}
                    className="border-l-2 border-blue-300 pl-3 py-1"
                  >
                    <p>
                      <span className="font-medium">Period:</span>{" "}
                      {new Date(period).toLocaleString()}
                    </p>
                    {Object.entries(features).map(([featureId, value]) => (
                      <div key={featureId} className="ml-2">
                        {typeof value === "number" ? (
                          <p>
                            <span className="font-medium">{featureId}:</span>{" "}
                            {value}
                          </p>
                        ) : (
                          <div>
                            <p className="font-medium">{featureId}:</p>
                            <div className="ml-2">
                              {Object.entries(value).map(
                                ([groupKey, groupValue]) => (
                                  <p key={groupKey}>
                                    <span className="text-gray-600">
                                      {groupKey}:
                                    </span>{" "}
                                    {groupValue}
                                  </p>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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
