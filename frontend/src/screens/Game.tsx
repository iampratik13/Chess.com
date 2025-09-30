import { ChessBoard } from "../components/ChessBoard"
import { useSocket } from "../hooks/UseSocket";
import { useEffect, useState } from "react";
import { Chess, type Square } from "chess.js";


export const INIT_GAME = "INIT_GAME";
export const MOVE = "move";
export const GAME_OVER = "GAME_OVER";

export const Game = () => {
    const socket = useSocket();
    const [chess , setChess] = useState(new Chess());
    const [board , setBoard] = useState(() => new Chess().board());
    const [moves, setMoves] = useState<string[]>([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [waitingForOpponent, setWaitingForOpponent] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [validMoves, setValidMoves] = useState<Square[]>([]);

    const handleSquareClick = (square: Square) => {
        if (!gameStarted) return;

        const piece = chess.get(square);
        
        // If clicking on a valid move square, make the move
        if (selectedSquare && validMoves.includes(square)) {
            const move = chess.move({
                from: selectedSquare,
                to: square,
                promotion: 'q' // Always promote to queen for simplicity
            });
            
            if (move) {
                setBoard(chess.board());
                setMoves(prevMoves => [...prevMoves, move.san]);
                setSelectedSquare(null);
                setValidMoves([]);
                
                // Send move to server
                if (socket) {
                    socket.send(JSON.stringify({
                        type: MOVE,
                        payload: move
                    }));
                }
            }
        }
        // If clicking on a piece, select it and show valid moves
        else if (piece && piece.color === chess.turn()) {
            setSelectedSquare(square);
            const moves = chess.moves({ square, verbose: true });
            setValidMoves(moves.map(move => move.to));
        }
        // If clicking on empty square or opponent piece without valid move, deselect
        else {
            setSelectedSquare(null);
            setValidMoves([]);
        }
    };

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

        switch(message.type) {
            case INIT_GAME:
                const newChess = new Chess();
                setChess(newChess);
                setBoard(newChess.board());
                setMoves([]);
                setGameStarted(true);
                setWaitingForOpponent(false);
                console.log("Game initialized");
                break;
            case MOVE:
                const move = message.payload;
                setChess(prevChess => {
                    const newChess = new Chess(prevChess.fen());
                    const moveResult = newChess.move(move);
                    if (moveResult) {
                        setBoard(newChess.board());
                        setMoves(prevMoves => [...prevMoves, moveResult.san]);
                    }
                    return newChess;
                });
                console.log("Move made");
                break;
            case GAME_OVER:
                console.log("Game over");
                setGameStarted(false);
                setWaitingForOpponent(false);
                break;
        }
    }
    }, [socket]);

    if (!socket) {
        return <div>Connecting to server...</div>
    }

    return (
        <div className="min-h-screen bg-gray-800 flex">
            {/* Left Sidebar */}
            <div className="w-64 bg-gray-900 flex flex-col">
                {/* Logo */}
                <div className="p-4 border-b border-gray-700">
                    <h1 className="text-white text-xl font-bold">Chess.com</h1>
                    <div className="text-red-500 text-xs"></div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                        <li>
                            <a href="#" className="flex items-center space-x-3 text-white hover:bg-gray-700 px-3 py-2 rounded">
                                <span className="text-orange-500">♟</span>
                                <span>Play</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-3 text-gray-300 hover:bg-gray-700 px-3 py-2 rounded">
                                <span className="text-orange-500">🧩</span>
                                <span>Puzzles</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-3 text-gray-300 hover:bg-gray-700 px-3 py-2 rounded">
                                <span className="text-blue-500">🎓</span>
                                <span>Learn</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-3 text-gray-300 hover:bg-gray-700 px-3 py-2 rounded">
                                <span className="text-purple-500">👁</span>
                                <span>Watch</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-3 text-gray-300 hover:bg-gray-700 px-3 py-2 rounded">
                                <span className="text-red-500">📰</span>
                                <span>News</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-3 text-gray-300 hover:bg-gray-700 px-3 py-2 rounded">
                                <span className="text-blue-400">👥</span>
                                <span>Social</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-3 text-gray-300 hover:bg-gray-700 px-3 py-2 rounded">
                                <span className="text-gray-400">⋯</span>
                                <span>More</span>
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center space-x-3 text-blue-400 hover:bg-gray-700 px-3 py-2 rounded">
                                <span className="text-blue-400">💎</span>
                                <span>Free Trial</span>
                            </a>
                        </li>
                    </ul>
                </nav>

                {/* Search Bar */}
                <div className="p-4 border-t border-gray-700">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search" 
                            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none text-sm"
                        />
                        <span className="absolute right-3 top-2 text-gray-400">🔍</span>
                    </div>
                </div>

                {/* Bottom Settings */}
                <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
                    <div className="space-y-2">
                        <a href="#" className="flex items-center space-x-2 hover:text-white">
                            <span>🌙</span>
                            <span>Light UI</span>
                        </a>
                        <a href="#" className="flex items-center space-x-2 hover:text-white">
                            <span>📁</span>
                            <span>Collapse</span>
                        </a>
                        <a href="#" className="flex items-center space-x-2 hover:text-white">
                            <span>⚙️</span>
                            <span>Settings</span>
                        </a>
                        <a href="#" className="flex items-center space-x-2 hover:text-white">
                            <span>💬</span>
                            <span>Support</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 bg-gray-700 flex h-screen">
                {/* Left Side - Chess Board */}
                <div className="flex flex-col justify-center items-center bg-gray-800 p-6" style={{minWidth: "700px"}}>
                    {/* Opponent Info */}
                    <div className="bg-gray-600 w-full max-w-2xl p-3 flex items-center justify-between rounded-t-lg">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-lg">👤</span>
                            </div>
                            <span className="text-white font-medium text-lg">Opponent</span>
                        </div>
                        <div className="text-yellow-400 font-bold"></div>
                    </div>

                    {/* Chess Board Container */}
                    <div className="bg-stone-200 p-2 rounded-none">
                        <ChessBoard 
                            board={board} 
                            socket={socket} 
                            onSquareClick={handleSquareClick}
                            selectedSquare={selectedSquare}
                            validMoves={validMoves}
                        />
                    </div>

                    {/* Player Info */}
                    <div className="bg-gray-600 w-full max-w-2xl p-3 flex items-center justify-between rounded-b-lg">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-lg">👤</span>
                            </div>
                            <span className="text-white font-medium text-lg">Me</span>
                        </div>
                        <div className="text-blue-400 font-bold"></div>
                    </div>


                </div>

                {/* Right Side - Moves Table */}
                <div className="flex-1 bg-gray-600 p-6 overflow-hidden">
                    <div className="h-full flex flex-col">
                        <h2 className="text-white text-xl font-bold mb-4">Game Moves</h2>
                        
                        {gameStarted ? (
                            <div className="bg-gray-700 rounded-lg p-4 flex-1 overflow-hidden">
                                <div className="h-full overflow-y-auto">
                                    {moves.length === 0 ? (
                                        <div className="text-gray-400 text-center py-8">
                                            No moves yet. Game started!
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {moves.map((move, index) => (
                                                <div key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-600 rounded">
                                                    <div className="text-gray-400 font-mono text-sm w-8">
                                                        {Math.floor(index / 2) + 1}.
                                                    </div>
                                                    <div className={`font-mono text-sm ${index % 2 === 0 ? 'text-white' : 'text-gray-300'} flex-1`}>
                                                        {move}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {index % 2 === 0 ? 'White' : 'Black'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Move count and game status */}
                                <div className="border-t border-gray-600 pt-4 mt-4">
                                    <div className="text-gray-400 text-sm">
                                        Total moves: {moves.length}
                                    </div>
                                    <div className="text-gray-400 text-sm">
                                        Turn: {moves.length % 2 === 0 ? 'White' : 'Black'}
                                    </div>
                                </div>
                            </div>
                        ) : waitingForOpponent ? (
                            // Waiting for opponent - Big display
                            <div className="bg-gray-700 rounded-lg p-8 flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="mb-8">
                                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
                                        <h2 className="text-white text-3xl font-bold mb-4">Waiting for Opponent</h2>
                                        <p className="text-gray-300 text-lg mb-2">Looking for another player to join...</p>
                                        <p className="text-gray-400 text-sm">This may take a few moments</p>
                                    </div>
                                    <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto">
                                        <span className="text-3xl">⏳</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Start Game - Big display
                            <div className="bg-gray-700 rounded-lg p-8 flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="mb-8">
                                        <h2 className="text-white text-4xl font-bold mb-6">Ready to Play?</h2>
                                        <p className="text-gray-300 text-lg mb-8">Click the button below to start a new chess game</p>
                                        <button 
                                            onClick={() => {
                                                setWaitingForOpponent(true);
                                                socket.send(JSON.stringify({
                                                    type: INIT_GAME,
                                                }));
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold text-2xl py-4 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                                        >
                                            Start Game
                                        </button>
                                    </div>
                                    <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto">
                        
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
};