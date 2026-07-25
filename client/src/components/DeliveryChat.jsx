import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaComments, FaTimes, FaUser } from 'react-icons/fa';
import { useSocket } from '../provider/SocketProvider';
import { useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';

const DeliveryChat = ({ orderId, isAgent = false }) => {
    const user = useSelector(state => state.user);
    const { socket, connected, joinChat, leaveChat, sendChatMessage, onChatMessage, offChatMessage } = useSocket();
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    
    const messagesEndRef = useRef(null);
    const roomId = `chat-${orderId}`;
    
    // Message suggestions for quick responses (especially useful for agents)
    const quickMessages = isAgent ? [
        "I'm on my way! 🚴",
        "I'll be there in 5 minutes",
        "Please come outside",
        "I've arrived at your location",
        "Thank you for your order!"
    ] : [
        "When will you arrive?",
        "Please call me",
        "I'm waiting outside",
        "Thank you!"
    ];
    
    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    // Load chat history
    useEffect(() => {
        const loadChatHistory = async () => {
            try {
                setLoading(true);
                const response = await Axios({
                    ...SummaryApi.getChatMessages,
                    url: SummaryApi.getChatMessages.url.replace(':orderId', orderId)
                });
                
                if (response.data.success) {
                    setMessages(response.data.data.messages);
                }
            } catch (error) {
                console.error('Failed to load chat history:', error);
                // Don't show error toast, just log it
            } finally {
                setLoading(false);
            }
        };
        
        if (orderId) {
            loadChatHistory();
        }
    }, [orderId]);
    
    // Join chat room and listen for messages
    useEffect(() => {
        if (!socket || !connected || !orderId) return;
        
        // Join the chat room
        joinChat(roomId);
        
        // Listen for new messages
        const handleNewMessage = (data) => {
            const { id, message, ts } = data;
            
            // Don't add our own messages twice
            if (id === socket.id) return;
            
            // Add message to state
            setMessages(prev => [...prev, {
                sender: { _id: 'other' },
                message,
                time: new Date(ts),
                _id: `temp-${ts}`
            }]);
        };
        
        onChatMessage(handleNewMessage);
        
        return () => {
            leaveChat(roomId);
            offChatMessage(handleNewMessage);
        };
    }, [socket, connected, orderId, roomId, joinChat, leaveChat, onChatMessage, offChatMessage]);
    
    // Send message
    const handleSendMessage = async (messageText = newMessage) => {
        if (!messageText.trim() || !connected || sending) return;
        
        try {
            setSending(true);
            
            // Optimistically add message to UI
            const tempMessage = {
                _id: `temp-${Date.now()}`,
                sender: { _id: user._id, name: user.name },
                message: messageText,
                time: new Date()
            };
            setMessages(prev => [...prev, tempMessage]);
            setNewMessage('');
            
            // Send via socket for real-time delivery
            sendChatMessage(roomId, messageText);
            
            // Save to database
            await Axios({
                ...SummaryApi.saveChatMessage,
                data: {
                    orderId,
                    message: messageText,
                    messageType: 'text'
                }
            });
            
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
        } finally {
            setSending(false);
        }
    };
    
    // Handle quick message click
    const handleQuickMessage = (message) => {
        handleSendMessage(message);
    };
    
    // Handle form submit
    const handleSubmit = (e) => {
        e.preventDefault();
        handleSendMessage();
    };
    
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-full shadow-lg hover:from-red-500 hover:to-red-600 transition-all duration-300 flex items-center gap-2"
            >
                <FaComments className="text-2xl" />
                <span className="font-semibold">Chat</span>
            </button>
        );
    }
    
    return (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border-2 border-red-600 flex flex-col" style={{ height: '500px', maxHeight: 'calc(100vh - 4rem)' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FaComments className="text-xl" />
                    <div>
                        <h3 className="font-bold">Order Chat</h3>
                        <p className="text-xs opacity-90">
                            {connected ? '🟢 Connected' : '🔴 Connecting...'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-red-500 p-2 rounded-lg transition-colors"
                >
                    <FaTimes />
                </button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FaComments className="text-4xl mb-2" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs mt-1">Start the conversation!</p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, index) => {
                            const isMyMessage = msg.sender._id === user._id;
                            return (
                                <div
                                    key={msg._id || index}
                                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[75%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
                                        {!isMyMessage && msg.sender.name && (
                                            <p className="text-xs text-gray-500 mb-1 px-2">
                                                {msg.sender.name}
                                            </p>
                                        )}
                                        <div
                                            className={`rounded-lg p-3 ${
                                                isMyMessage
                                                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                                                    : 'bg-white text-gray-800 border border-gray-200'
                                            }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                            <p className={`text-xs mt-1 ${isMyMessage ? 'text-red-100' : 'text-gray-500'}`}>
                                                {new Date(msg.time).toLocaleTimeString('en-IN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>
            
            {/* Quick Messages */}
            {quickMessages.length > 0 && (
                <div className="px-4 py-2 bg-white border-t border-gray-200">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {quickMessages.map((msg, index) => (
                            <button
                                key={index}
                                onClick={() => handleQuickMessage(msg)}
                                disabled={sending || !connected}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {msg}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200 rounded-b-xl">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={!connected || sending}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || !connected || sending}
                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <FaPaperPlane />
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DeliveryChat;

