import { useUser } from '@/context/userContext';
import Link from 'next/link';
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Fullscreen, Person, PlusLg, Send, ThreeDots, XLg } from 'react-bootstrap-icons';
import { apiUrl, imageLink, toShortLocal } from '@/utils/helperUtils';
import { fetchJwt, fetchUserContacts } from '@/utils/userUtils';

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
    const { userData, setUserData } = useUser();

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

    // Switch between contacts.
    const [activeContact, setActiveContact] = useState<number | null>(null);
    // Keeps thread messages
    const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);

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
                                className={`contact-item ${i === activeContact ? 'active' : 'default'}`}
                                onClick={() => {
                                    setActiveContact(i);
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
                        <input type='text' placeholder='Mesaj gönder...' className='message-input' />
                        <button className='send'><Send /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chatbot;