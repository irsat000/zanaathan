import { useUser } from '@/context/userContext';
import Link from 'next/link';
import { useContext, useState } from 'react'
import { Fullscreen, PlusLg, ThreeDots, XLg } from 'react-bootstrap-icons';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


const Chatbot: React.FC<{
    chatbotActive: boolean,
    setChatbotActive: (v: boolean) => void
}> = ({ chatbotActive, setChatbotActive }) => {


    return (
        <div className={`chatbot-container ${chatbotActive ? 'active' : ''}`}>
            <div className="chatbot">
                <div className="chatbot-menu">
                    <div className="chatbot-menu-header">
                        <h5>Kişiler</h5>
                        <button type='button' className='chatbot-add-user'>Yeni<PlusLg /></button>
                    </div>
                    <div className="chatbot-network">

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
                    <div className="chatbot-messages">

                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chatbot;