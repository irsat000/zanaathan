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
    }, []);

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

    const connectWebSocket = () => {
        const newSocket = io(apiWebSocketUrl!);

        newSocket.on('open', (data) => {
            console.log("WS is active.");
            // Connection opened
        });

        newSocket.on('message', (res) => {
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
            /*const updatedThreadMessages = [...threadMessages];
            updatedThreadMessages.push(newMessage);*/
            setThreadMessages(prev => [...prev, newMessage]);
        });

        /*newSocket.on('close', (event) => {
            console.log("WS is closed.");
            // Automatically attempt reconnection after a delay (5 seconds)
            setTimeout(() => {
                console.log("Trying to reconnect Web Socket");
                connectWebSocket();
            }, 5000);
            // Connection closed
            setSocket(null); // Reset the socket in state
        });*/

        setSocket(newSocket); // Store the WebSocket instance in state
    };

    useEffect(() => {
        // Check user login
        if (!userData) return;
        // Create connection
        connectWebSocket();
        // Unmount
        return () => {
            if (socket) socket.close();
        };
    }, [userData]);

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
                                    setActiveContact(contact.ReceiverId);
                                    fetchThreadMessages(contact.ReceiverId);
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
                        <div className="messages">
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