
import { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, Typography, TextField, IconButton,
    List, ListItem, Avatar, Divider, Fab, Badge
} from '@mui/material';
import { Send, Person, Close, SmartToy } from '@mui/icons-material';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const ChatWindow = ({ orderId, height = '450px', onClose }) => {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef();
    const messagesEndRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const { data } = await api.get(`/chat/${orderId}`);
                setMessages(data);
                scrollToBottom();
            } catch (error) {
                console.error('Failed to fetch chats', error);
            }
        };

        if (orderId) {
            fetchChats();
            socketRef.current = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000');
            socketRef.current.emit('join_chat', orderId);

            socketRef.current.on('receive_message', (message) => {
                setMessages((prev) => [...prev, message]);
                scrollToBottom();
            });
        }

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [orderId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            const { data } = await api.post('/chat', {
                orderId,
                message: newMessage
            });
            socketRef.current.emit('send_message', data);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!orderId) return null;

    return (
        <Paper
            elevation={6}
            sx={{
                height: height,
                width: '350px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.08)',
                bgcolor: 'white'
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Badge color="success" variant="dot" overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                        <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 40, height: 40 }}>
                            <SmartToy />
                        </Avatar>
                    </Badge>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>Support Chat</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Order #{orderId.slice(-4).toUpperCase()}</Typography>
                    </Box>
                </Box>
                {onClose && (
                    <IconButton size="small" onClick={onClose} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                        <Close />
                    </IconButton>
                )}
            </Box>

            {/* Messages Area */}
            <Box sx={{
                flexGrow: 1,
                overflowY: 'auto',
                p: 2,
                bgcolor: '#f8f9fa',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5
            }}>
                {messages.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 4, opacity: 0.5 }}>
                        <Typography variant="body2">No messages yet.</Typography>
                        <Typography variant="caption">Start the conversation!</Typography>
                    </Box>
                )}
                {messages.map((msg, index) => {
                    const isMe = msg.sender._id === user._id || msg.sender === user._id;
                    return (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                justifyContent: isMe ? 'flex-end' : 'flex-start',
                                mb: 0.5
                            }}
                        >
                            <Box sx={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                <Paper sx={{
                                    p: '10px 16px',
                                    bgcolor: isMe ? 'primary.main' : 'white',
                                    color: isMe ? 'white' : 'text.primary',
                                    borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                    boxShadow: isMe ? '0 2px 8px rgba(25, 118, 210, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                                    wordBreak: 'break-word',
                                    border: isMe ? 'none' : '1px solid #eee'
                                }}>
                                    <Typography variant="body2">{msg.message}</Typography>
                                </Paper>
                                <Typography variant="caption" sx={{ mt: 0.5, px: 1, color: 'text.disabled', fontSize: '0.7rem' }}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #eee' }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: '#f5f5f5',
                    p: '2px 8px',
                    borderRadius: '24px',
                    border: '1px solid #e0e0e0',
                    '&:focus-within': { borderColor: 'primary.main', bgcolor: 'white', boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)' }
                }}>
                    <TextField
                        fullWidth
                        placeholder="Type a message..."
                        variant="standard"
                        InputProps={{ disableUnderline: true, sx: { px: 2, py: 1, fontSize: '0.9rem' } }}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        multiline
                        maxRows={2}
                    />
                    <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        sx={{
                            bgcolor: newMessage.trim() ? 'primary.main' : 'transparent',
                            color: newMessage.trim() ? 'white' : 'action.disabled',
                            width: 36, height: 36,
                            '&:hover': { bgcolor: 'primary.dark' },
                            transition: 'all 0.2s'
                        }}
                    >
                        <Send fontSize="small" />
                    </IconButton>
                </Box>
            </Box>
        </Paper>
    );
};

export default ChatWindow;
