import { useUser } from '@/context/userContext';
import Link from 'next/link';
import Image from 'next/image'
import { useContext, useEffect, useRef, useState } from 'react'
import { Fullscreen, PlusLg, Send, ThreeDots, XLg } from 'react-bootstrap-icons';
import { imageLink } from '@/utils/helperUtils';
import { fetchJwt } from '@/utils/userUtils';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


interface MyContacts {
    LastMessage: string | null;
    LastMessageDate: string | null;
    ReceiverAvatar: string | null;
    ReceiverFullName: string | null;
    ReceiverUsername: string;
}

const Chatbot: React.FC<{
    chatbotActive: boolean,
    setChatbotActive: (v: boolean) => void
}> = ({ chatbotActive, setChatbotActive }) => {

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

    const [myContacts, setMyContacts] = useState<MyContacts[]>([]);

    // Must be in template depending on UserContext
    useEffect(() => {
        // Check jwt
        const jwt = fetchJwt();
        if (!jwt) return;

        fetch(`${apiUrl}/chat/get-contacts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${jwt}`
            }
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                setMyContacts(data.threadList);
                // todo: cache in session
            })
            .catch((res) => {
                console.log('Sunucuyla bağlantıda hata');
            });
    }, []);

    const [activeContact, setActiveContact] = useState(0);

    return (
        <div className={`chatbot-container ${chatbotActive ? 'active' : ''}`} ref={chatbotRef}>
            <div className="chatbot">
                <div className="chatbot-menu">
                    <div className="chatbot-menu-header">
                        <h5>Kişiler</h5>
                        <button type='button' className='chatbot-add-user'>Yeni<PlusLg /></button>
                    </div>
                    <div className="chatbot-contacts">
                        {myContacts && myContacts.length > 0 ?
                            myContacts.map((contact, i) =>
                                <div key={i}
                                    className={`contact-item ${i === activeContact ? 'active' : 'default'}`}
                                    onClick={() => setActiveContact(i)}
                                >
                                    <div className="profile-picture">
                                        {contact.ReceiverAvatar ?
                                            <Image
                                                loader={() => imageLink(contact.ReceiverAvatar!)}
                                                src={imageLink(contact.ReceiverAvatar)}
                                                alt={''}
                                                width={0}
                                                height={0}
                                            /> : <></>
                                        }
                                    </div>
                                    <div className="body">
                                        <div className="person-header">
                                            <span className='name'>{contact.ReceiverFullName ?? contact.ReceiverUsername}</span>
                                            <span className="last-contact">{contact.LastMessageDate}</span>
                                        </div>
                                        <span className='last-message'>{contact.ReceiverFullName ?? contact.ReceiverUsername}: {contact.LastMessage}</span>
                                    </div>
                                </div>
                            ) : <></>
                        }
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
                            {[...Array(10)].map((j, i) =>
                                <div key={i} className={`message-item ${i % 2 === 0 ? 'receiver' : 'you'}`}>
                                    <p>
                                        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Impedit deleniti quibusdam natus veniam sapiente odit, consequuntur illo necessitatibus cupiditate nihil praesentium et saepe perspiciatis, quod delectus aperiam magni nobis! Quo.
                                    </p>
                                </div>
                            )}
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