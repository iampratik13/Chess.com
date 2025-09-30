import type { Color, PieceSymbol, Square } from "chess.js"

// Chess piece images - these URLs are from your webloc files
const pieceImages = {
    // White pieces
    'wk': 'https://assets-themes.chess.com/image/ejgfv/150/wk.png',
    'wq': 'https://assets-themes.chess.com/image/ejgfv/150/wq.png',
    'wr': 'https://assets-themes.chess.com/image/ejgfv/150/wr.png',
    'wb': 'https://assets-themes.chess.com/image/ejgfv/150/wb.png',
    'wn': 'https://assets-themes.chess.com/image/ejgfv/150/wn.png',
    'wp': 'https://assets-themes.chess.com/image/ejgfv/150/wp.png',
    // Black pieces
    'bk': 'https://assets-themes.chess.com/image/ejgfv/150/bk.png',
    'bq': 'https://assets-themes.chess.com/image/ejgfv/150/bq.png',
    'br': 'https://assets-themes.chess.com/image/ejgfv/150/br.png',
    'bb': 'https://assets-themes.chess.com/image/ejgfv/150/bb.png',
    'bn': 'https://assets-themes.chess.com/image/ejgfv/150/bn.png',
    'bp': 'https://assets-themes.chess.com/image/ejgfv/150/bp.png',
};

export const ChessBoard = ({board, socket: _socket, onSquareClick, selectedSquare, validMoves}: {
    board: ({
        square : Square;
        type : PieceSymbol;
        color : Color
    } | null)[][];
    socket: WebSocket | null;
    onSquareClick?: (square: Square) => void;
    selectedSquare?: Square | null;
    validMoves?: Square[];
} ) => {
    const handleSquareClick = (index: number) => {
        const file = String.fromCharCode(97 + (index % 8)); // a-h
        const rank = String(8 - Math.floor(index / 8)); // 1-8
        const square = (file + rank) as Square;
        if (onSquareClick) {
            onSquareClick(square);
        }
    };



    return (
        <div className="relative">
            {/* Chess board with rank and file labels exactly like the screenshot */}
            <div className="relative bg-stone-200 p-0">
                {/* Chess board */}
                <div className="grid grid-cols-8 gap-0 w-[600px] h-[600px] relative">
                    {board.flat().map((piece, index) => {
                        const x = index % 8;
                        const y = Math.floor(index / 8);
                        const isDark = (x + y) % 2 === 1;
                        const file = String.fromCharCode(97 + x); // a-h
                        const rank = String(8 - y); // 8-1
                        const currentSquare = (file + rank) as Square;
                        
                        // Check if this square is selected or a valid move
                        const isSelected = selectedSquare === currentSquare;
                        const isValidMove = validMoves?.includes(currentSquare);
                        
                        // Determine background color with highlighting
                        let bgColor;
                        if (isSelected) {
                            bgColor = isDark ? 'bg-yellow-600' : 'bg-yellow-300';
                        } else if (isValidMove) {
                            bgColor = isDark ? 'bg-blue-600' : 'bg-blue-300';
                        } else {
                            bgColor = isDark ? 'bg-green-500' : 'bg-stone-100';
                        }
                        
                        // Show rank label on the leftmost squares (a-file)
                        const showRankLabel = x === 0;
                        // Show file label on the bottom squares (rank 1)
                        const showFileLabel = y === 7;
                        
                        // Get piece image URL
                        const pieceKey = piece ? `${piece.color}${piece.type}` : '';
                        const pieceImageUrl = piece ? pieceImages[pieceKey as keyof typeof pieceImages] : null;
                        
                        return (
                            <div 
                                key={index} 
                                className={`${bgColor} w-[75px] h-[75px] flex items-center justify-center cursor-pointer hover:bg-opacity-80 transition-colors relative`}
                                onClick={() => handleSquareClick(index)}
                            >
                                {/* Rank labels on the left edge (a-file) */}
                                {showRankLabel && (
                                    <div className="absolute left-1 top-1 text-xs font-semibold text-gray-700">
                                        {rank}
                                    </div>
                                )}
                                
                                {/* File labels on the bottom edge (rank 1) */}
                                {showFileLabel && (
                                    <div className="absolute bottom-1 right-1 text-xs font-semibold text-gray-700">
                                        {file}
                                    </div>
                                )}
                                
                                {/* Valid move indicator */}
                                {isValidMove && !piece && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-4 h-4 bg-gray-600 rounded-full opacity-60"></div>
                                    </div>
                                )}
                                
                                {/* Valid move indicator for capture */}
                                {isValidMove && piece && (
                                    <div className="absolute inset-0 rounded-full border-4 border-red-500 opacity-70"></div>
                                )}
                                
                                {/* Chess piece */}
                                {pieceImageUrl && (
                                    <img 
                                        src={pieceImageUrl}
                                        alt={`${piece?.color === 'w' ? 'White' : 'Black'} ${piece?.type}`}
                                        className={`w-16 h-16 object-contain ${isSelected ? 'scale-110' : ''} transition-transform`}
                                        draggable={false}
                                        onError={(e) => {
                                            // Fallback to Unicode if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            const fallbackSymbols: { [key: string]: string } = {
                                                'wk': '♔', 'wq': '♕', 'wr': '♖', 'wb': '♗', 'wn': '♘', 'wp': '♙',
                                                'bk': '♚', 'bq': '♛', 'br': '♜', 'bb': '♝', 'bn': '♞', 'bp': '♟'
                                            };
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `<span class="text-4xl">${fallbackSymbols[pieceKey] || ''}</span>`;
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};