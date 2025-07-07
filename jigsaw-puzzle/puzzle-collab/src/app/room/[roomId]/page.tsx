'use client';

import { GameRoom } from '@/components/GameRoom';
import { Toaster } from '@/components/ui/sonner';

interface RoomPageProps {
  params: {
    roomId: string;
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <>
      <GameRoom initialRoomId={params.roomId} />
      <Toaster />
    </>
  );
}