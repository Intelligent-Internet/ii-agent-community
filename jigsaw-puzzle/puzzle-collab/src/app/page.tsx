'use client';

import { GameRoom } from '@/components/GameRoom';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  return (
    <>
      <GameRoom />
      <Toaster />
    </>
  );
}
