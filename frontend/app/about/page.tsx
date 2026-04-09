import { getCompanyProfile } from "@/lib/api";

export default async function AboutPage() {
  const profile = await getCompanyProfile();
  const settings = profile.settings;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-black/10 bg-surface p-7 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">About Us</p>
        <h1 className="mt-3 max-w-3xl font-(family-name:--font-sora) text-3xl font-bold leading-tight sm:text-5xl">
          We help families and businesses buy reliable vehicles with confidence.
        </h1>
        <p className="mt-4 max-w-3xl text-ink-muted">
          Sarkin Mota Autos is a customer-first dealership serving buyers across Nigeria.
          We focus on transparent pricing, verified inventory, and long-term support after purchase.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Years in business" value={`${profile.yearsInBusiness}+`} />
        <StatCard label="Cars sold" value={`${profile.carsSold.toLocaleString()}+`} />
        <StatCard label="Happy customers" value={`${profile.happyCustomers.toLocaleString()}+`} />
        <StatCard label="Cities served" value={String(profile.citiesServed)} />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {profile.team.length > 0 ? (
          profile.team.map((member) => <TeamCard key={`${member.name}-${member.role}`} name={member.name} role={member.role} />)
        ) : (
          <>
            <TeamCard name="Ibrahim Musa" role="Founder" />
            <TeamCard name="Aisha Bello" role="Sales Manager" />
            <TeamCard name="Chinedu Okafor" role="Customer Success" />
          </>
        )}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-black/10 bg-surface p-6">
          <h2 className="text-xl font-semibold">Showroom Location</h2>
          <p className="mt-2 text-sm text-ink-muted">{settings.contact.address}, Nigeria</p>
          <div className="mt-4 grid gap-3 text-sm text-ink-muted">
            <p><span className="font-semibold text-foreground">Phone:</span> {settings.contact.phone}</p>
            <p><span className="font-semibold text-foreground">Email:</span> {settings.contact.email}</p>
            <p><span className="font-semibold text-foreground">Hours:</span> {settings.contact.hours}</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-black/10 bg-surface">
          <iframe
            title="Sarkin Mota Autos showroom map"
            src={settings.contact.mapEmbedUrl}
            className="h-80 w-full"
            loading="lazy"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-black/10 bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </article>
  );
}

function TeamCard({ name, role }: { name: string; role: string }) {
  return (
    <article className="rounded-2xl border border-black/10 bg-surface p-5">
      <div className="h-16 w-16 rounded-full bg-brand-soft" />
      <h3 className="mt-4 text-lg font-semibold">{name}</h3>
      <p className="text-sm text-ink-muted">{role}</p>
    </article>
  );
}
