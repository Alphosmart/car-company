import { notFound } from "next/navigation";
import NetworkRequestClient from "@/components/network/NetworkRequestClient";
import { networkPageContent } from "@/lib/navigation";

type NetworkPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function NetworkPage({ params }: NetworkPageProps) {
  const { slug } = await params;
  const content = networkPageContent[slug];

  if (!content) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <NetworkRequestClient
        title={content.title}
        description={content.description}
        requestType={content.title}
        dashboardKey="network-dashboard-requests"
      />
    </div>
  );
}
