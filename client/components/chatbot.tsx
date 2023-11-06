import { useUser } from '@/context/userContext';
import Link from 'next/link';
import Image from 'next/image'
import { useContext, useEffect, useRef, useState } from 'react'
import { Fullscreen, PlusLg, Send, ThreeDots, XLg } from 'react-bootstrap-icons';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


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
                        {[...Array(10)].map((j, i) =>
                            <div
                                className={`contact-item ${i === activeContact ? 'active' : 'default'}`}
                                onClick={() => setActiveContact(i)}
                            >
                                <div className="profile-picture">
                                    <Image
                                        loader={() => 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                                        src={'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                                        alt={''}
                                        width={0}
                                        height={0}
                                    />
                                </div>
                                <div className="body">
                                    <div className="person-header">
                                        <span className='name'>İrşat Akdeniz</span>
                                        <span className="last-contact">12 Ağus</span>
                                    </div>
                                    <span className='last-message'>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Omnis eveniet ipsum.</span>
                                </div>
                            </div>
                        )}
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
                                <div className={`message-item ${i % 2 === 0 ? 'receiver' : 'you'}`}>
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