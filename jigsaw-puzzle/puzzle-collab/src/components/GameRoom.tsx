// Main game room component that handles room creation, joining, and game management

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzleBoard } from './PuzzleBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Room, 
  Player, 
  Puzzle, 
  GameState, 
  PuzzleDifficulty,
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomStatusResponse 
} from '@/types/puzzle';

interface GameRoomProps {
  initialRoomId?: string;
}

type GameState_Local = 'menu' | 'creating' | 'joining' | 'waiting' | 'playing';

export const GameRoom: React.FC<GameRoomProps> = ({ initialRoomId }) => {
  const [gameState, setGameState] = useState<GameState_Local>('menu');
  const [roomId, setRoomId] = useState<string>(initialRoomId || '');
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [room, setRoom] = useState<Room | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<PuzzleDifficulty>('medium');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showGameCompleted, setShowGameCompleted] = useState(false);

  // Sample images for puzzle creation
  const sampleImages = [
    {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      name: 'Mountain Landscape',
    },
    {
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      name: 'Forest Path',
    },
    {
      url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
      name: 'Lake View',
    },
    {
      url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop',
      name: 'Sunset Beach',
    },
  ];

  // Initialize with first sample image
  useEffect(() => {
    if (!selectedImage && sampleImages.length > 0) {
      setSelectedImage(sampleImages[0].url);
    }
  }, [selectedImage, sampleImages]);

  // Join room automatically if initialRoomId is provided
  useEffect(() => {
    if (initialRoomId && gameState === 'menu') {
      setRoomId(initialRoomId);
      setGameState('joining');
    }
  }, [initialRoomId, gameState]);

  // API calls
  const createRoom = useCallback(async () => {
    if (!playerName.trim() || !selectedImage) {
      setError('Please enter your name and select an image');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const request: CreateRoomRequest = {
        playerName: playerName.trim(),
        puzzleImage: selectedImage,
        difficulty: selectedDifficulty,
      };

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room');
      }

      const data: CreateRoomResponse = await response.json();
      setRoomId(data.roomId);
      setPlayerId(data.playerId);

      // Get room status
      await fetchRoomStatus(data.roomId);
      setGameState('waiting');
      toast.success('Room created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      toast.error('Failed to create room');
    } finally {
      setIsLoading(false);
    }
  }, [playerName, selectedImage, selectedDifficulty]);

  const joinRoom = useCallback(async () => {
    if (!playerName.trim() || !roomId.trim()) {
      setError('Please enter your name and room ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const request: JoinRoomRequest = {
        playerName: playerName.trim(),
      };

      const response = await fetch(`/api/rooms/${roomId.trim()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join room');
      }

      const data: JoinRoomResponse = await response.json();
      setPlayerId(data.playerId);

      // Get room status
      await fetchRoomStatus(roomId.trim());
      setGameState('playing');
      toast.success('Joined room successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
      toast.error('Failed to join room');
    } finally {
      setIsLoading(false);
    }
  }, [playerName, roomId]);

  const fetchRoomStatus = useCallback(async (targetRoomId: string) => {
    try {
      const response = await fetch(`/api/rooms/${targetRoomId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch room status');
      }

      const data: RoomStatusResponse = await response.json();
      setRoom({
        id: data.roomId,
        players: data.players,
        puzzle: data.puzzle,
        gameState: data.gameState,
        isCompleted: data.isCompleted,
        createdAt: new Date().toISOString(), // We don't get this from API
      });

      // If room has 2 players, start playing
      if (data.players.length === 2 && gameState === 'waiting') {
        setGameState('playing');
        toast.success('Second player joined! Game started!');
      }
    } catch (err) {
      console.error('Failed to fetch room status:', err);
    }
  }, [gameState]);

  // Poll room status while waiting for second player
  useEffect(() => {
    if (gameState === 'waiting' && roomId) {
      const interval = setInterval(() => {
        fetchRoomStatus(roomId);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [gameState, roomId, fetchRoomStatus]);

  const handleGameCompleted = useCallback(() => {
    setShowGameCompleted(true);
    toast.success('🎉 Puzzle completed! Congratulations!');
  }, []);

  const handleGameStateUpdate = useCallback((newGameState: GameState) => {
    if (room) {
      setRoom(prev => prev ? { ...prev, gameState: newGameState } : null);
    }
  }, [room]);

  const resetGame = useCallback(() => {
    setGameState('menu');
    setRoomId('');
    setPlayerId('');
    setPlayerName('');
    setRoom(null);
    setError('');
    setShowGameCompleted(false);
  }, []);

  const copyRoomId = useCallback(() => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      toast.success('Room ID copied to clipboard!');
    }
  }, [roomId]);

  // Render different states
  if (gameState === 'playing' && room && playerId) {
    return (
      <div className="w-full h-screen bg-gray-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white shadow-sm">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">Collaborative Jigsaw Puzzle</h1>
            <Badge variant="secondary">Room: {roomId}</Badge>
          </div>
          <Button variant="outline" onClick={resetGame}>
            Leave Room
          </Button>
        </div>

        {/* Game board */}
        <div className="h-[calc(100vh-80px)]">
          <PuzzleBoard
            roomId={roomId}
            playerId={playerId}
            puzzle={room.puzzle}
            gameState={room.gameState}
            players={room.players}
            onGameStateUpdate={handleGameStateUpdate}
            onGameCompleted={handleGameCompleted}
          />
        </div>

        {/* Game completed dialog */}
        <Dialog open={showGameCompleted} onOpenChange={setShowGameCompleted}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>🎉 Puzzle Completed!</DialogTitle>
              <DialogDescription>
                Congratulations! You and your partner successfully completed the puzzle together.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Pieces: {room.gameState.totalPieces}
                </p>
                <p className="text-sm text-gray-600">
                  Time: {room.gameState.endTime && 
                    Math.round((new Date(room.gameState.endTime).getTime() - 
                    new Date(room.gameState.startTime).getTime()) / 1000)} seconds
                </p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={resetGame} className="flex-1">
                  Create New Game
                </Button>
                <Button variant="outline" onClick={() => setShowGameCompleted(false)} className="flex-1">
                  Keep Viewing
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Menu/waiting states
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Collaborative Jigsaw Puzzle</CardTitle>
            <CardDescription>
              Solve puzzles together with a friend in real-time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player name input */}
            {(gameState === 'menu' || gameState === 'creating' || gameState === 'joining') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Game state specific content */}
            <AnimatePresence mode="wait">
              {gameState === 'menu' && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={() => setGameState('creating')}
                      className="h-20 flex flex-col"
                    >
                      <div className="text-2xl mb-1">🎯</div>
                      <div>Create Room</div>
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setGameState('joining')}
                      className="h-20 flex flex-col"
                    >
                      <div className="text-2xl mb-1">🚪</div>
                      <div>Join Room</div>
                    </Button>
                  </div>
                </motion.div>
              )}

              {gameState === 'creating' && (
                <motion.div
                  key="creating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Difficulty selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['easy', 'medium', 'hard'] as PuzzleDifficulty[]).map((difficulty) => (
                        <Button
                          key={difficulty}
                          variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                          onClick={() => setSelectedDifficulty(difficulty)}
                          size="sm"
                        >
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Image selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Image
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {sampleImages.map((image) => (
                        <button
                          key={image.url}
                          onClick={() => setSelectedImage(image.url)}
                          className={`
                            relative aspect-video rounded-lg overflow-hidden border-2 transition-all
                            ${selectedImage === image.url 
                              ? 'border-blue-500 ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                            {image.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button 
                      onClick={createRoom}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Creating...' : 'Create Room'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setGameState('menu')}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                  </div>
                </motion.div>
              )}

              {gameState === 'joining' && (
                <motion.div
                  key="joining"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room ID
                    </label>
                    <Input
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Enter room ID"
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button 
                      onClick={joinRoom}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Joining...' : 'Join Room'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setGameState('menu')}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                  </div>
                </motion.div>
              )}

              {gameState === 'waiting' && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">⏳</div>
                    <h3 className="text-lg font-semibold">Waiting for second player...</h3>
                    <p className="text-sm text-gray-600">
                      Share this room ID with a friend to start playing
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-600">Room ID:</span>
                        <div className="font-mono font-bold text-lg">{roomId}</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={copyRoomId}>
                        Copy
                      </Button>
                    </div>
                  </div>

                  {room && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Players ({room.players.length}/2):</h4>
                      {room.players.map((player) => (
                        <div key={player.id} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-sm">{player.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button variant="outline" onClick={resetGame} className="w-full">
                    Cancel
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};