import { LoginForm } from "@/components/supabase/login-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-[#161616]">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
