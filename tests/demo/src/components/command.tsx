import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CommandBar({ variant }: { variant: string }) {
  const [copied, setCopied] = useState(false);
  const command = `npx shadcn@latest add`;
  const url = `https://ui.useautumn.com/${variant}/pricing-table.json`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(command + " " + url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative group w-[700px]">
      {/* Gradient border container */}
      <div
        className="absolute -inset-[1.8px] rounded-md opacity-100 transition-opacity duration-300
        before:absolute before:inset-0 before:rounded-md
        before:bg-gradient-to-r before:from-transparent before:via-gray-400/60 before:to-transparent dark:before:via-gray-300/40
         before:animate-shine before:bg-[length:200%_100%]"
      />

      <button
        onClick={copyToClipboard}
        className="relative flex items-center gap-2 px-4 pr-12 py-3 rounded-md font-mono text-sm
          w-full
          bg-white dark:bg-zinc-900
          shadow-[inset_0_1px_4px_rgba(0,0,0,0.15)] 
          dark:shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]
          transition-all duration-300 ease-out
          border-transparent
          before:absolute before:inset-0 
          before:bg-[radial-gradient(800px_circle_at_var(--mouse-x,0)_var(--mouse-y,0),rgba(255,255,255,0.06),transparent_40%)]
          dark:before:bg-[radial-gradient(800px_circle_at_var(--mouse-x,0)_var(--mouse-y,0),rgba(255,255,255,0.03),transparent_40%)]
          before:opacity-100 before:transition-opacity before:duration-500"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty(
            "--mouse-x",
            `${e.clientX - rect.left}px`
          );
          e.currentTarget.style.setProperty(
            "--mouse-y",
            `${e.clientY - rect.top}px`
          );
        }}
      >
        <span className="text-gray-700 dark:text-gray-200 font-medium relative z-10 text-left w-full overflow-hidden break-words text-md">
          {command} {url}
        </span>

        <div
          className={`absolute right-5 items-center justify-center transition-opacity duration-200 flex ${
            copied ? "opacity-0" : "opacity-100"
          }`}
        >
          <Copy size={16} className="text-gray-700 dark:text-gray-200" />
        </div>
        <div
          className={`absolute right-4 flex items-center justify-center transition-opacity duration-200 z-10 ${
            copied ? "opacity-100" : "opacity-0"
          }`}
        >
          <Check size={16} className="text-green-400" />
        </div>
      </button>
    </div>
  );
}
