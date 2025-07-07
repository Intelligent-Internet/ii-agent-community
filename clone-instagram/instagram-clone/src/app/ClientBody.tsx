"use client";

import { useEffect, useState } from "react";
import { enableMocking } from "@/lib/msw";
import { Toaster } from "@/components/ui/sonner";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    // Initialize MSW and other client-side setup
    const initialize = async () => {
      // Enable MSW mocking
      await enableMocking();
      
      // Remove any extension-added classes during hydration
      document.body.className = "antialiased";
      
      setMswReady(true);
    };

    initialize();
  }, []);

  // Show loading while MSW is initializing
  if (!mswReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased">
      {children}
      <Toaster />
    </div>
  );
}
