import { useUser } from '@/context/userContext';
import Link from 'next/link';
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Fullscreen, Person, PlusLg, Send, ThreeDots, XLg } from 'react-bootstrap-icons';
import { apiUrl, apiWebSocketUrl, imageLink, toShortLocal } from '@/lib/utils/helperUtils';
import { fetchJwt, fetchUserContacts } from '@/lib/utils/userUtils';
import { io, Socket } from 'socket.io-client';

export interface UserContacts {
    ReceiverId: number;
    LastMessage: string | null;
    LastMessageDate: string | null;
    ReceiverAvatar: string | null;
    ReceiverFullName: string | null;
    ReceiverUsername: string;
}

interface ThreadMessage {
    Id: number;
    Body: string;
    SenderId: number;
    CreatedAt: string;
}

const Chatbot: React.FC<{
    chatbotActive: boolean,
    setChatbotActive: (v: boolean) => void,
    userContacts: UserContacts[],
    setUserContacts: (v: UserContacts[]) => void,
}> = ({ chatbotActive, setChatbotActive, userContacts, setUserContacts }) => {
    // User context
    const { userData } = useUser();
    // Switch between contacts.
    const [activeContact, setActiveContact] = useState<number | null>(null);
    // Keeps thread messages
    const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);
    // Message input
    const [messageInput, setMessageInput] = useState('');

    // Fetch thread list for messaging (PART OF THE TEMPLATE, MOUNTS ONCE)
    useEffect(() => {
        fetchUserContacts(setUserContacts);
    }, [userData.sub]);

    // Scroll down in chat box automatically
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    // Scrolls down for sure when chat is retrieved for the first time
    const [isInitialScroll, setIsInitialScroll] = useState(true);
    // Check if someone is above the height of the box.
    // If yes, don't touch it. If close to bottom, scroll down
    const shouldScrollToBottom = () => {
        if (!messagesEndRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesEndRef.current;
        /*if (scrollTop === 0) {
            return true;
        }*/
        // Check if the user has manually scrolled up
        const should = scrollHeight - (clientHeight * 2) < scrollTop;
        return should;
    };
    // Scroll action
    const scrollToBottom = () => {
        if (messagesEndRef.current && (shouldScrollToBottom() === true || isInitialScroll)) {
            messagesEndRef.current.scrollTo({
                top: messagesEndRef.current.scrollHeight,
                behavior: isInitialScroll ? 'instant' : 'smooth'
            });
        }
        if (isInitialScroll) {
            setIsInitialScroll(false);
        }
    }
    // Every time a new message is added
    useEffect(() => {
        scrollToBottom();
    }, [threadMessages]);

    // Function for fetching a thread's messages
    const fetchThreadMessages = (contactId: number) => {
        //const threadId = userContacts.length > 0 ? userContacts[activeContact]?.ThreadId : null;
        //if (!threadId) return;

        // Check jwt
        const jwt = fetchJwt();
        if (!jwt) return;

        fetch(`${apiUrl}/chat/get-thread/${contactId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${jwt}`
            }
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                setThreadMessages(data.messages);
            })
            .catch((res) => {
                console.log('Sunucuyla bağlantıda hata');
            });
    };

    // Handle clicking outside chatbot
    const chatbotRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleDocumentClick = (e: any) => {
            // Check if the click target is outside of the user-menu dropdown div and user-menu button
            if (chatbotActive && !chatbotRef.current?.contains(e.target) && !e.target.closest('.open-chatbot-button')) {
                setChatbotActive(false);
            }
        };

        // Record clicks
        document.addEventListener("click", handleDocumentClick);

        return () => {
            document.removeEventListener("click", handleDocumentClick);
        };
    }, [chatbotActive]);

    // WEB SOCKET
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Create connection
        const newSocket = io(apiWebSocketUrl!);

        // On and off
        newSocket.on('connect', () => {
            console.log("WS is active.");
            setSocket(newSocket); // Store the WebSocket instance in state
            // Connection opened
        });
        newSocket.on('disconnect', () => {
            console.log("WS is closed.");
            // Reset the socket in state
            setSocket(null);
        });

        // Receive message emit
        newSocket.on('message', (res) => {
            // Check user login // Unnecessary because component mount only when user is logged in.
            //if (!userData) return;

            const data = JSON.parse(res);
            // status: 'success' | 'error'
            if (data.status !== 'success') return;
            // Create new message from insertion on back end
            const newMessage: ThreadMessage = {
                Id: data.message.Id,
                Body: data.message.Body,
                SenderId: data.message.SenderId,
                CreatedAt: data.message.CreatedAt
            }
            // Update thread messages
            setThreadMessages(prev => [...prev, newMessage]);
        });

        // Unmount
        return () => {
            newSocket.close();
        };
    }, []);

    const handleMessageSubmit = () => {
        // Check user and prepare it for payload
        const jwt = fetchJwt();
        if (!jwt) {
            alert("Üye girişi bu işlem için gereklidir.")
            return;
        };
        // Check contact selection
        if (!activeContact) {
            alert("Hedef kişi seçimi gereklidir.")
            return;
        };
        // Check WS connection
        if (!socket) {
            alert("Sunucuyla bağlantıda hata.")
            return;
        }
        // Payload
        const messageObject = {
            type: 'text',
            content: messageInput,
            receiver: activeContact,
            jwt: jwt
            // Add other relevant details like sender, recipient, timestamp, etc.
        };
        // Send payload through connection
        socket.emit('message', JSON.stringify(messageObject));
        // Reset message input after sending
        setMessageInput('');
    }

    return (
        <div className={`chatbot-container ${chatbotActive ? 'active' : ''}`} ref={chatbotRef}>
            <div className="chatbot">
                <div className="chatbot-menu">
                    <div className="chatbot-menu-header">
                        <h5>Kişiler</h5>
                        <button type='button' className='chatbot-add-user'>Yeni<PlusLg /></button>
                    </div>
                    <div className="chatbot-contacts">
                        {userContacts.length > 0 ? userContacts.map((contact, i) =>
                            <div key={i}
                                className={`contact-item ${contact.ReceiverId === activeContact ? 'active' : 'default'}`}
                                onClick={() => {
                                    // Prevent actions if already selected
                                    if (contact.ReceiverId === activeContact) return;
                                    // Switch chat/contact
                                    setActiveContact(contact.ReceiverId);
                                    // Fetch messages associated with this "chat", messages between two users
                                    fetchThreadMessages(contact.ReceiverId);
                                    // Indicates this chat needs scrolling down initially
                                    setIsInitialScroll(true);
                                }}
                            >
                                <div className="profile-picture">
                                    {contact.ReceiverAvatar ?
                                        <Image
                                            loader={() => imageLink(contact.ReceiverAvatar!)}
                                            src={imageLink(contact.ReceiverAvatar)}
                                            alt={''}
                                            width={0}
                                            height={0}
                                        /> : <Person className='no-ppic' />
                                    }
                                </div>
                                <div className="body">
                                    <div className="person-header">
                                        <span className='name'>{contact.ReceiverFullName ?? contact.ReceiverUsername}</span>
                                        {contact.LastMessageDate ?
                                            <span className="last-contact">{toShortLocal(contact.LastMessageDate)}</span>
                                            : <></>
                                        }
                                    </div>
                                    <span className='last-message'>{contact.ReceiverFullName ?? contact.ReceiverUsername}: {contact.LastMessage}</span>
                                </div>
                            </div>
                        ) : <></>}
                    </div>
                </div>
                <div className="chatbot-body">
                    <div className="chatbot-body-header">
                        <h5>İrşat Akdeniz</h5>
                        <div className="chatbot-shortcuts">
                            <button type='button' className='chatbot-shortcut-button'><ThreeDots /></button>
                            <button type='button' className='chatbot-shortcut-button fullscreen-button'><Fullscreen /></button>
                            <button type='button' className='chatbot-shortcut-button' onClick={() => setChatbotActive(false)}><XLg /></button>
                        </div>
                    </div>
                    <div className="message-box">
                        <div className="messages" ref={messagesEndRef}>
                            {threadMessages.length > 0 ? threadMessages.map((message, i) => {
                                return (
                                    <div key={i} className={`message-item ${message.SenderId === userData.sub ? 'you' : 'receiver'}`}>
                                        <p>
                                            {message.Body}
                                        </p>
                                    </div>)
                            }
                            ) : <span className='no-thread-selected'>Mesaj görüntülemek için menüden kişi seçiniz.</span>}
                        </div>
                    </div>
                    <div className="send-message-container">
                        <input type='text'
                            placeholder='Mesaj gönder...'
                            className='message-input'
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                        />
                        <button className='send' onClick={handleMessageSubmit}><Send /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chatbot;