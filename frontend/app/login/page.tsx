import StaffLoginForm from "@/components/forms/StaffLoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-black/10 bg-surface p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
          Staff Access
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-sora)] text-3xl font-bold">
          Admin Login
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Sign in with your staff account to manage leads and analytics.
        </p>

        <StaffLoginForm />
      </section>
    </div>
  );
}
