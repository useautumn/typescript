import { authClient } from "@/lib/auth-client";
import { createClient } from "@/lib/supabase/client";
import { useCustomer } from "autumn-js/next";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const router = useRouter();
  const { customer, refetch } = useCustomer();

  const handleSignOut = async () => {
    try {
      // Check if user is logged in
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }

        router.push("/supabase/login");
      }
    } catch (error) {
      console.error(error);
    }

    try {
      // Get better auth session
      const { data } = await authClient.getSession();
      if (data?.session) {
        const { error } = await authClient.signOut();
        if (error) {
          throw error;
        }

        router.push("/better-auth");
      }
    } catch (error) {
      console.error(error);
    }

    try {
      // await signOut();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="w-full border-b border-gray-200">
      <button onClick={() => refetch()}>Refetch</button>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            {/* <h1 className="text-xl font-semibold text-gray-100">Your App</h1> */}
          </div>

          <div className="flex items-center space-x-4">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
