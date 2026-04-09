import { getCompanyProfile } from "@/lib/api";

export default async function WhatsAppButton() {
  const profile = await getCompanyProfile();
  const contact = profile.settings.contact;
  const text = encodeURIComponent(contact.whatsappMessage);
  const href = `https://wa.me/${contact.whatsappNumber}?text=${text}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 rounded-full bg-brand px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105"
    >
      Chat on WhatsApp
    </a>
  );
}
