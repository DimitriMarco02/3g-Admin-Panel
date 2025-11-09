import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { User, Teacher, Chat, Message } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

interface MessagesViewProps {
  currentUser: User | Teacher;
  initialChatId: string | null;
  onBack: () => void;
}

const MessagesView: React.FC<MessagesViewProps> = ({ currentUser, initialChatId, onBack }) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const currentUserId = 'uid' in currentUser ? currentUser.uid! : currentUser.id;

    useEffect(() => {
        // Remove orderBy to prevent needing a composite index in Firestore.
        // Sort client-side instead.
        const q = query(collection(db, 'chats'), where('participants', 'array-contains', currentUserId));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatsData = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                lastMessageTimestamp: d.data().lastMessageTimestamp?.toDate()
            } as Chat));
            
            // Sort client-side
            chatsData.sort((a, b) => (b.lastMessageTimestamp?.getTime() || 0) - (a.lastMessageTimestamp?.getTime() || 0));

            setChats(chatsData);
            setLoadingChats(false);
        }, (error) => {
            console.error("Error fetching chats:", error);
            setLoadingChats(false); // Stop loading on error
        });
        
        return () => unsubscribe();
    }, [currentUserId]);

    useEffect(() => {
        if (initialChatId) {
            setSelectedChatId(initialChatId);
        }
    }, [initialChatId]);

     useEffect(() => {
        if (!selectedChatId) {
            setMessages([]);
            return;
        };

        setLoadingMessages(true);
        const q = query(collection(db, 'chats', selectedChatId, 'messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesData = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                timestamp: d.data().timestamp?.toDate()
            } as Message));
            setMessages(messagesData);
            setLoadingMessages(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoadingMessages(false);
        });
        return () => unsubscribe();
    }, [selectedChatId]);

     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChatId) return;

        const chatRef = doc(db, 'chats', selectedChatId);
        const messagesColRef = collection(chatRef, 'messages');

        await addDoc(messagesColRef, {
            text: newMessage,
            senderId: currentUserId,
            timestamp: serverTimestamp()
        });
        
        await setDoc(chatRef, {
            lastMessageText: newMessage,
            lastMessageTimestamp: serverTimestamp(),
            lastMessageSenderId: currentUserId
        }, { merge: true });

        setNewMessage("");
    };

    const selectedChat = chats.find(c => c.id === selectedChatId);
    
    const otherParticipantId = selectedChat?.type === 'private' ? selectedChat?.participants.find(p => p !== currentUserId) : null;
    const otherParticipantInfo = otherParticipantId ? selectedChat?.participantInfo[otherParticipantId] : null;

    return (
        <div className="h-full flex bg-white rounded-2xl shadow-xl shadow-blue-500/10 border overflow-hidden">
            {/* Conversations List */}
            <div className={`w-full md:w-1/3 border-r flex flex-col transition-transform duration-300 ${selectedChatId && 'hidden md:flex'}`}>
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-slate-800">Messages</h2>
                </div>
                {loadingChats ? <div className="p-4 text-center text-slate-500">Loading conversations...</div> : (
                    <div className="overflow-y-auto">
                        {chats.length === 0 ? (
                            <div className="p-4 text-center text-slate-400">No conversations yet.</div>
                        ) : (
                            chats.map(chat => {
                                const isGroup = chat.type === 'group';
                                const otherId = !isGroup ? chat.participants.find(p => p !== currentUserId) : null;
                                const info = otherId ? chat.participantInfo[otherId] : null;
                                const name = isGroup ? chat.groupName : info?.name;
                                const isSelected = chat.id === selectedChatId;

                                const avatar = isGroup ? (
                                    <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                                    </div>
                                ) : (
                                    <img className="h-12 w-12 rounded-full object-cover bg-slate-200" src={info?.imageUrl || `https://ui-avatars.com/api/?name=${info?.name || '?'}&background=random`} alt={info?.name} />
                                );


                                return (
                                    <button key={chat.id} onClick={() => setSelectedChatId(chat.id)} className={`w-full text-left p-4 flex items-center space-x-3 hover:bg-slate-50 ${isSelected && 'bg-blue-50'}`}>
                                        <div className="relative flex-shrink-0">
                                            {avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-slate-800 truncate">{name}</p>
                                                <p className="text-xs text-slate-400">{chat.lastMessageTimestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <p className="text-sm text-slate-500 truncate">{chat.lastMessageSenderId === currentUserId && 'You: '}{chat.lastMessageText || 'No messages yet.'}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Message View */}
            <div className={`w-full md:w-2/3 flex flex-col transition-transform duration-300 ${!selectedChatId && 'hidden md:flex'}`}>
                {selectedChat ? (
                    <>
                        <div className="p-4 border-b flex items-center space-x-3">
                            <button onClick={() => setSelectedChatId(null)} className="md:hidden p-2 -ml-2 text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                            {selectedChat.type === 'group' ? (
                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                                </div>
                            ) : (
                                 <img className="h-10 w-10 rounded-full object-cover bg-slate-200" src={otherParticipantInfo?.imageUrl || `https://ui-avatars.com/api/?name=${otherParticipantInfo?.name || '?'}&background=random`} alt={otherParticipantInfo?.name} />
                            )}
                            <div>
                                <h3 className="font-bold text-slate-800">{selectedChat.type === 'group' ? selectedChat.groupName : otherParticipantInfo?.name}</h3>
                                {selectedChat.type === 'group' && <p className="text-xs text-slate-500">{selectedChat.participants.length} members</p>}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {loadingMessages ? <div className="text-center">Loading messages...</div> : messages.map(msg => {
                                const senderInfo = selectedChat.participantInfo[msg.senderId];
                                const isOwnMessage = msg.senderId === currentUserId;
                                return (
                                <div key={msg.id} className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                    {selectedChat.type === 'group' && !isOwnMessage && (
                                        <span className="text-xs text-slate-500 ml-3 mb-1">{senderInfo?.name || 'Unknown'}</span>
                                    )}
                                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                            <p>{msg.text}</p>
                                            <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-slate-500'} text-right`}>{msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                </div>
                            )})}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center space-x-3">
                            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full p-3 border bg-slate-100 border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <button type="submit" className="bg-blue-600 text-white rounded-full h-12 w-12 flex-shrink-0 flex items-center justify-center disabled:bg-slate-300" disabled={!newMessage.trim()}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <h3 className="mt-4 text-xl font-semibold text-slate-700">Select a conversation</h3>
                        <p className="text-slate-500 mt-1">Start chatting with your teachers and students.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesView;