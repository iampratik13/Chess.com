

import { useNavigate } from 'react-router-dom';
import chessboardImage from '../assets/chessboard copy.jpeg';

export const Landing = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/game');
    };

    const handleSignUp = () => {
        // For now, redirect to game - you can implement actual signup later
        navigate('/game');
    };

    const handleLogIn = () => {
        // For now, redirect to game - you can implement actual login later
        navigate('/game');
    };

    return (
        <div className="min-h-screen bg-gray-800 flex">
            {/* Left Sidebar */}
            <div className="w-64 bg-gray-900 flex flex-col">
                {/* Logo */}
                <div className="p-4 border-b border-gray-700">
                    <h1 className="text-white text-xl font-bold">♔Chess.com</h1>
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
                    </ul>
                </nav>

                {/* Search Bar */}
                <div className="p-4 border-t border-gray-700">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search" 
                            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-gray-400">🔍</span>
                    </div>
                </div>

                {/* Sign Up / Log In Buttons */}
                <div className="p-4 space-y-2">
                    <button 
                        onClick={handleSignUp}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                    >
                        Sign Up
                    </button>
                    <button 
                        onClick={handleLogIn}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                    >
                        Log In
                    </button>
                </div>

                {/* Footer Links */}
                <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
                    <div className="space-y-1">
                        <a href="#" className="flex items-center space-x-2 hover:text-white">
                            <span>🌐</span>
                            <span>English</span>
                        </a>
                        <a href="#" className="flex items-center space-x-2 hover:text-white">
                            <span>💬</span>
                            <span>Support</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Stats Bar */}
                <div className="bg-gray-900 px-6 py-3 flex justify-center space-x-8 text-white">
                    <div className="text-center">
                        <span className="text-2xl font-bold">216,568</span>
                        <span className="text-gray-400 text-sm ml-2">PLAYING NOW</span>
                    </div>
                    <div className="text-center">
                        <span className="text-2xl font-bold">18,547,103</span>
                        <span className="text-gray-400 text-sm ml-2">GAMES TODAY</span>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="flex-1 flex items-center justify-center px-8">
                    <div className="max-w-6xl w-full flex items-center justify-between">
                        {/* Chessboard Image */}
                        <div className="flex-1 flex justify-center">
                            <div className="w-96 h-96">
                                <img 
                                    src={chessboardImage} 
                                    alt="Chess Board" 
                                    className="w-full h-full object-cover rounded-lg shadow-lg"
                                />
                            </div>
                        </div>

                        {/* Right Side Content */}
                        <div className="flex-1 text-center text-white max-w-md ml-12">
                            <h1 className="text-5xl font-bold mb-4 leading-tight">
                                Play chess.<br />
                                <span className="text-4xl">Improve your game.</span><br />
                                <span className="text-4xl">Have fun!</span>
                            </h1>
                            
                            <button 
                                onClick={handleGetStarted}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-12 rounded-lg text-xl mt-8 transition-colors shadow-lg"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Learn More Section */}
                <div className="text-center pb-8">
                    <button className="text-gray-400 hover:text-white transition-colors">
                        <div className="text-sm">Learn More</div>
                        <div className="text-lg">▼</div>
                    </button>
                </div>
            </div>
        </div>
    );
};