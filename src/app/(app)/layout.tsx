import { BottomNav, SideNav } from "@/components/app-nav";

// Static shell. Pages read the session inside their own <Suspense> boundaries
// so this layout can be prerendered.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SideNav />
      <div className="flex flex-1 flex-col md:pl-60">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-8 md:pt-10 md:pb-12">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
