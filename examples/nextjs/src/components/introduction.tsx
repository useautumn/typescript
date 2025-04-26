import Link from "next/link";

export default function Intro() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome to the Next.js Autumn template
        </h1>
        <p className="text-gray-400">
          Get started with Autumn by setting up your account and exploring the
          core features.
        </p>
      </div>

      {/* Setup Requirements */}
      <div className="p-6 border border-gray-800 rounded-lg bg-zinc-900 space-y-4">
        <h2 className="font-semibold text-white">Before you get started</h2>
        <ul className="space-y-3 text-sm">
          <li className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-700" />
            <span className="text-gray-300">
              Create your Autumn secret key{" "}
              <Link
                href="https://app.useautumn.com/sandbox/dev"
                className="text-green-400 underline underline-offset-4 hover:text-green-300"
                target="_blank"
              >
                here
              </Link>{" "}
              and add it to the .env.local file
            </span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-700" />
            <span className="text-gray-300">
              Connect your Stripe account{" "}
              <Link
                href="https://app.useautumn.com/sandbox/integrations/stripe"
                className="text-green-400 underline underline-offset-4 hover:text-green-300"
                target="_blank"
              >
                here
              </Link>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
