import { FilterButton } from "./analytics";

export function Topbar() {
  return (
    <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Usage</h1>
          
          {/* Filter Controls */}
          <div className="flex items-center gap-4 mb-8">
            <FilterButton active>All Workspaces</FilterButton>
            <FilterButton>All API keys</FilterButton>
            <FilterButton>All Models</FilterButton>
            <FilterButton>Month</FilterButton>
            
            {/* Month Navigation */}
            <div className="flex items-center gap-2 ml-4">
              <button className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-lg font-medium text-gray-900 px-4">July 2025</span>
              <button className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            
            <FilterButton>Group by: Model</FilterButton>
            
            <div className="ml-auto">
              <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>

  );
}