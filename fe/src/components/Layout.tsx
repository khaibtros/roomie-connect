import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function Layout({ children, showNav = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showNav && <Navbar />}
      <main className={showNav ? "pt-0 md:pt-16 pb-20 md:pb-0" : ""}>
        {children}
      </main>
      {showNav && <BottomNav />}
      <a href="/tenant/ai-chat" className="fixed bottom-6 right-6 z-40">
        <button className="h-14 w-14 rounded-full bg-amber-500 text-white shadow-lg">
          AI
        </button>
      </a>
    </div>
  );
}
