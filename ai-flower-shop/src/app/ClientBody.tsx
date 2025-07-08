"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import ChatWidget from "@/components/ChatWidget";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  // Don't show chat widget on the dedicated chat page
  const showChatWidget = pathname !== '/chat';

  return (
    <div className="antialiased">
      {children}
      {showChatWidget && <ChatWidget />}
    </div>
  );
}
