import React, { useState, useRef, useEffect } from "react";

// Extend the global Window interface to include debugLog
declare global {
  interface Window {
    debugLog?: (message: string) => void;
  }
}

export function DebugConsole() {
  const [logs, setLogs] = useState<string[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  // Global function to add logs from anywhere
  useEffect(() => {
    window.debugLog = addLog;
    return () => {
      delete window.debugLog;
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-64 z-50 overflow-hidden">
      <div className="h-full bg-gray-900 text-green-400 border-t border-gray-700 flex flex-col">
        <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700 flex-shrink-0">
          <span className="text-sm font-medium text-gray-200">Debug Console</span>
          <button
            onClick={clearLogs}
            className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
        </div>
        <div
          ref={consoleRef}
          className="flex-1 overflow-y-auto p-3 font-mono text-sm bg-gray-900"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500 text-xs">
              Console ready. Use window.debugLog("message") to add logs.
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 text-xs whitespace-pre-wrap">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}