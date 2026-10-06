import NavBar from "@/components/NavBar";
import GameStateLoader from "@/components/GameStateLoader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={[
        "mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-background-soft shadow-2xl shadow-black/40",
        "sm:my-4 sm:h-[calc(100vh-2rem)] sm:rounded-[2.5rem] sm:border sm:border-border",
        "md:my-0 md:h-screen md:max-w-none md:flex-row md:rounded-none md:border-0 md:shadow-none",
      ].join(" ")}
    >
      <GameStateLoader />
      <NavBar />
      <main className="order-1 flex-1 overflow-y-auto scrollbar-none pb-6 md:order-2 md:pb-0">{children}</main>
    </div>
  );
}
