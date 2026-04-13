import { PartnerSidebar } from "@/components/partner/PartnerSidebar";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <PartnerSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
