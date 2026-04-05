const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2348012345678";

export default function WhatsAppButton() {
  const text = encodeURIComponent("Hi, I would like to ask about your available cars.");
  const href = `https://wa.me/${whatsappNumber}?text=${text}`;

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
