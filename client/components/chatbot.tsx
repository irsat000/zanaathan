import { useUser } from '@/context/userContext';
import Link from 'next/link';
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Fullscreen, FullscreenExit, Person, PersonLinesFill, PlusLg, Send, ThreeDots, XLg } from 'react-bootstrap-icons';
import { apiUrl, apiWebSocketUrl, postImageLink, isNullOrEmpty, toShortLocal, avatarLink } from '@/lib/utils/helperUtils';
import { fetchJwt, fetchUserContacts } from '@/lib/utils/userUtils';
import { io, Socket } from 'socket.io-client';
import { ThreadMessage, UserContact, useContacts } from '@/context/contactsContext';
import { useGStatus } from '@/context/globalContext';


const Chatbot: React.FC<{
}> = ({ }) => {
    // User contacts context
    const { userContacts, setUserContacts } = useContacts();
    // General status context
    const { gStatus, handleGStatus } = useGStatus();
    // Up to date gStatus.activeContact
    const activeContactRef = useRef<number | null>(null);
    activeContactRef.current = gStatus.activeContact;
    // Up to date gStatus.chatbotActive
    const chatbotActiveRef = useRef<boolean>(false);
    chatbotActiveRef.current = gStatus.chatbotActive;

    // User context
    const { userData } = useUser();
    // Message input
    const [messageInput, setMessageInput] = useState('');

    // Fetch thread list for messaging (PART OF THE TEMPLATE, MOUNTS ONCE)
    useEffect(() => {
        if (!userData) return;
        fetchUserContacts().then(data => {
            if (data) {
                setUserContacts(data);
            } else {
                handleGStatus('informationModal', {
                    type: 'error',
                    text: 'Mesajlaşmalarınız getirilemedi. Üzgünüz!'
                })
            }
        });
    }, [userData]);

    // Scroll down in chat box automatically
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    // Scrolls down for sure when chat is retrieved for the first time
    const [isInitialScroll, setIsInitialScroll] = useState(true);
    // Check if someone is above the height of the box.
    // If yes, don't touch it. If close to bottom, scroll down
    const shouldScrollToBottom = () => {
        if (!messagesEndRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesEndRef.current;
        //console.log(scrollTop, scrollHeight, clientHeight);
        // Check if the user has manually scrolled up
        const should = scrollHeight - (clientHeight * 2) < scrollTop;
        return should;
    };
    // Scroll action
    const scrollToBottom = () => {
        // isInitialScroll makes sure first time scroll works but manual doesn't
        if (messagesEndRef.current && (shouldScrollToBottom() === true || isInitialScroll)) {
            //console.log(isInitialScroll);
            messagesEndRef.current.scrollTo({
                top: messagesEndRef.current.scrollHeight,
                behavior: isInitialScroll ? 'instant' : 'smooth'
            });
        }
        if (isInitialScroll) {
            setIsInitialScroll(false);
        }
    }

    // Function for fetching a thread's messages
    const fetchThreadMessages = async (contactId: number, method: 'initial' | 'all') => {
        // Check cache, if exist, no need for fetching because chat is updated in real-time
        const cache = userContacts.find(contact => contact.ReceiverId === contactId);
        // If cache exists, and if either thread has no more messages or method is initial which means it doesn't care about hasMore
        if (cache && cache.CachedThread && (cache.ThreadHasMore === false || method === 'initial')) {
            return {
                messages: cache.CachedThread as ThreadMessage[],
                hasMore: cache.ThreadHasMore
            }
        }
        // Check jwt
        const jwt = fetchJwt();
        if (!jwt) return {
            messages: null,
            hasMore: undefined
        };
        return await fetch(`${apiUrl}/chat/get-thread/${contactId}/${method}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${jwt}`
            }
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                // Cache the messages
                /*const updatedContacts = [...userContacts];
                updatedContacts.find(contact => contact.ReceiverId === contactId)!.CachedThread = data.messages;
                setUserContacts(updatedContacts);*/
                return {
                    messages: data.messages.reverse() as ThreadMessage[],
                    hasMore: data.hasMore as boolean
                }
            })
            .catch((res) => {
                handleGStatus('informationModal', {
                    type: 'error',
                    text: 'Bağlantıda hata. Mesajlar getirilemedi.'
                })
                return {
                    messages: null,
                    hasMore: undefined
                };
            });
    };

    // On/Off for chatbot user menu
    const [chatUMenuActive, setChatUMenuActive] = useState(false);

    // Handle clicking outside chatbot
    const chatbotRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleDocumentClick = (e: any) => {
            // Check if the click target is outside of the chatbot, chatbot button and message request in post page
            if (gStatus.chatbotActive
                && !e.target.closest('.chatbot')
                && !e.target.closest('.open-chatbot-button')
                && !e.target.closest('.message-request')
                && !e.target.closest('.information-modal-container')) {
                handleGStatus('chatbotActive', false);
            }
            if (chatUMenuActive
                && !e.target.closest('.chatbot-user-menu')
                && !e.target.closest('.usermenu-button')) {
                setChatUMenuActive(false);
            }
        };

        // Record clicks
        document.addEventListener("mousedown", handleDocumentClick);

        return () => {
            document.removeEventListener("mousedown", handleDocumentClick);
        };
    }, [gStatus.chatbotActive, chatUMenuActive]);

    // Store the message id that will be animated, becomes null after render using useEffect on currentThread
    const [animateMessageId, setAnimateMessageId] = useState<number | null>(null);


    // Message handler for a chat message from socket
    const handleNewMessageFromSocket = (data: any) => {
        // Create new message from insertion on back end
        const newMessage: ThreadMessage = {
            Id: data.message.Id,
            Body: data.message.Body,
            SenderId: data.message.SenderId,
            CreatedAt: data.message.CreatedAt
        }
        // Set as 'will be animated'
        setAnimateMessageId(newMessage.Id);
        // Cache the new message
        setUserContacts((prev: UserContact[]) => {
            const updatedContacts = [...prev];
            // Get either current user's target contact or the contact that targeted current user
            const contactToUpdate = updatedContacts.find(contact => contact.ReceiverId === data.receiverId || contact.ReceiverId === newMessage.SenderId);
            // If contactToUpdate doesn't exist, it means a new person is messaging the current user
            if (contactToUpdate) {
                // Push the mew message from current or another user in the UserContacts of current user
                if (contactToUpdate.CachedThread) {
                    contactToUpdate.CachedThread.push(newMessage);
                } // Else, let fetchThreadMessages function get the new messages by being undefined

                // Update the date
                contactToUpdate.LastMessageDate = newMessage.CreatedAt;
                // Send notification if the current contact isn't the sender or the active contact
                // userData won't be null because coming here means userContacts are fetched and userData is checked
                if ((newMessage.SenderId !== userData!.sub) &&
                    ((newMessage.SenderId !== activeContactRef.current) || (!chatbotActiveRef.current))) {
                    contactToUpdate.NotificationCount++;
                }
                // Move the updated contact to the beginning of the array
                const index = updatedContacts.indexOf(contactToUpdate);
                updatedContacts.splice(index, 1);
                updatedContacts.unshift(contactToUpdate);

                return updatedContacts;
            }
            else {
                // This is the new contact who sent the new message
                const newContact = {
                    ReceiverId: newMessage.SenderId,
                    LastMessage: newMessage.Body,
                    LastMessageDate: newMessage.CreatedAt,
                    ReceiverUsername: data.message.Username,
                    ReceiverFullName: data.message.FullName,
                    ReceiverAvatar: data.message.Avatar,
                    IsBlocked: false,
                    NotificationCount: 1,
                    CachedThread: [newMessage]
                }
                updatedContacts.unshift(newContact);
                return updatedContacts;
            }
        });
    }

    // WEB SOCKET
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Create connection
        const newSocket = io(apiWebSocketUrl!);

        // Connection opened
        newSocket.on('connect', () => {
            console.log("WS is active.");
            // Store the WebSocket instance in a state for outside use
            setSocket(newSocket);
            // Get jwt and associate the user id with socket id for real time messaging
            const jwt = fetchJwt();
            if (!jwt) return;
            newSocket.emit('setUserId', jwt);
        });

        // Connection closed
        newSocket.on('disconnect', () => {
            console.log("WS is closed.");
            // Reset the socket in state
            setSocket(null);
        });

        // Receive message emit
        newSocket.on('message', (res) => {
            // Check user login // Unnecessary because component mounts only when user is logged in.
            //if (!userData) return;

            const data = JSON.parse(res);
            // status: 'success' | 'error' | 'blocked'
            // TODO: Inform the user if error

            // Check if there is a block, tell the current user that they are blocked.
            // In case current user is the blocker, user is already warned during the handleMessageSubmit function
            if (data.status === 'blocked') {
                handleGStatus('informationModal', {
                    type: 'error',
                    text: 'Bu kişi tarafından engellendiniz.'
                })
                return;
            }
            if (data.status !== 'success') return;
            // Call handler to push the new message
            handleNewMessageFromSocket(data);
        });

        // Unmount
        return () => {
            newSocket.close();
        };
    }, []);


    // Get necessary render properties
    const currentContact = userContacts.find(c => c.ReceiverId === gStatus.activeContact);
    const contactName = currentContact ? currentContact.ReceiverFullName ?? currentContact.ReceiverUsername : 'Kişi seçilmedi';

    // Handle new message by user, acts the same way for receiving since it's using web socket
    const handleMessageSubmit = () => {
        // Check empty
        if (isNullOrEmpty(messageInput)) return;
        // Check user and prepare it for payload
        const jwt = fetchJwt();
        if (!jwt) {
            alert("Üye girişi bu işlem için gereklidir.")
            return;
        }
        // Check contact selection
        if (!gStatus.activeContact) {
            handleGStatus('informationModal', {
                type: 'error',
                text: 'Hedef kişi seçimi gereklidir.'
            })
            return;
        }
        // Check WS connection
        if (!socket) {
            alert("Sunucuyla bağlantıda hata.")
            return;
        }
        // Check block from this user
        if (currentContact && currentContact.IsBlocked) {
            handleGStatus('informationModal', {
                type: 'error',
                text: 'Engellediğiniz kullanıcıya mesaj atamazsınız.'
            })
            return;
        }
        // Payload
        const messageObject = {
            type: 'text',
            content: messageInput,
            receiver: gStatus.activeContact,
            jwt: jwt
        };
        // Send payload through connection
        socket.emit('message', JSON.stringify(messageObject));
        // Reset message input after sending
        setMessageInput('');
    }

    // Handle fetch messages with different methods
    // - Could be merged with fetchThreadMessages but this is better for future
    const handleFetchThreadMessages = (activeContact: number, method: 'initial' | 'all') => {
        fetchThreadMessages(activeContact, method).then((thread) => {
            const updatedContacts = [...userContacts];
            const contact = updatedContacts.find(contact => contact.ReceiverId === gStatus.activeContact);
            if (contact) {
                // Get thread
                contact.CachedThread = thread.messages ?? [];
                contact.ThreadHasMore = thread.hasMore;
                // Remove the notification
                if (contact.NotificationCount > 0) {
                    // Reset for instant visual and not needing to reload
                    contact.NotificationCount = 0;
                    // Check jwt
                    const jwt = fetchJwt();
                    if (jwt && socket) {
                        // Payload
                        const removeNotificationPayload = {
                            contact: gStatus.activeContact,
                            jwt: jwt
                        };
                        // Send payload through connection
                        socket.emit('removeNotification', JSON.stringify(removeNotificationPayload));
                    }
                }
                // Get thread for the contact and update
                setUserContacts(updatedContacts);
            }
        });
    }

    // currentThread rendering for better and easier async scroll
    const [currentThread, setCurrentThread] = useState<ThreadMessage[] | null>(null)
    // Fetch messages associated with this "chat", messages between two users
    useEffect(() => {
        if (!gStatus.activeContact) return;
        handleFetchThreadMessages(gStatus.activeContact, 'initial');
        // Dependenct Array[0] reason: Fetch/check thread messages with every change of contact
        // Dependenct Array[1] reason: Re-run for removing notification if active contact is the same and chat bot is activated once again
    }, [gStatus.activeContact, gStatus.chatbotActive]);

    // Assign currentThread from cache
    useEffect(() => {
        // Run when userContacts updates, like when data is cached and updated
        // Also when activeContact changes because it wouldn't run if cached data already exists, basically not detecting change
        const activeContactThread = userContacts.find(c => c.ReceiverId === gStatus.activeContact)?.CachedThread;
        if (activeContactThread) {
            setCurrentThread([...activeContactThread]);
        }
    }, [gStatus.activeContact, userContacts]);
    useEffect(() => {
        // Prevents initial run, only need this afterwards, also fixes message request from post not scrolling down
        if (!currentThread) return;
        // Scroll down the chat everytime currentThread changes if right conditions are met
        scrollToBottom();
        // Stop animation of the last message
        setAnimateMessageId(null);
    }, [currentThread]);

    // On/Off for contact menu (Only for mobile)
    const [contactMenuActive, setContactMenuActive] = useState(false);
    // Fullscreen or default (Only for desktop)
    const [isChatbotFullscreen, setIsChatbotFullscreen] = useState(false);

    // Chatbot user menu actions
    const toggleChatUserMenu = () => {
        if (gStatus.activeContact) {
            setChatUMenuActive(prev => !prev);
        }
    }
    const handleBlockUser = () => {
        // Check user and prepare it for payload
        const jwt = fetchJwt();
        if (!jwt) {
            alert("Üye girişi bu işlem için gereklidir.")
            return;
        };
        // Check contact selection
        if (!gStatus.activeContact) {
            alert("Hedef kişi seçimi gereklidir.")
            return;
        };

        fetch(`${apiUrl}/block-user-toggle/${gStatus.activeContact}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${jwt}`
            }
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                const updatedContacts = [...userContacts];
                const contact = updatedContacts.find(contact => contact.ReceiverId === gStatus.activeContact);
                if (contact) {
                    contact.IsBlocked = !contact.IsBlocked;
                    setUserContacts(updatedContacts);
                }
            })
            .catch((res) => {
                handleGStatus('informationModal', {
                    type: 'error',
                    text: 'Bağlantıda hata!'
                })
            });
    }

    return (
        <div className={`chatbot-container ${gStatus.chatbotActive ? 'active' : ''}`} ref={chatbotRef}>
            <div className={`chatbot ${isChatbotFullscreen ? 'fullscreen' : ''}`}>
                <div className={`chatbot-menu ${contactMenuActive ? 'active' : ''}`}>
                    <div className="chatbot-menu-header">
                        <h5>Benim ağım</h5>
                        {/*<button type='button' className='chatbot-add-user'>Yeni<PlusLg /></button>*/}
                    </div>
                    <div className="chatbot-contacts">
                        {userContacts.length > 0 ? userContacts.map((contact, i) =>
                            <div key={i}
                                className={`contact-item ${contact.ReceiverId === gStatus.activeContact ? 'active' : 'default'}`}
                                onClick={() => {
                                    // For mobile, disable chatbot menu
                                    setContactMenuActive(false);
                                    // Prevent actions if already selected
                                    if (contact.ReceiverId === gStatus.activeContact) return;
                                    // Indicates this chat needs scrolling down initially
                                    // Before setActiveContact to prevent async problems, can be inside the setActiveContact
                                    setIsInitialScroll(true);
                                    // Switch chat/contact
                                    handleGStatus('activeContact', contact.ReceiverId);
                                }}
                            >
                                <div className="profile-picture">
                                    {contact.ReceiverAvatar
                                        ? <Image
                                            loader={() => avatarLink(contact.ReceiverAvatar!)}
                                            src={avatarLink(contact.ReceiverAvatar)}
                                            alt={'Kişinin profil fotoğrafı'}
                                            priority={false}
                                            width={0}
                                            height={0} />
                                        : <Person className='no-ppic' />}
                                </div>
                                <div className="body">
                                    <div className="person-header">
                                        <span className='name'>{contact.ReceiverFullName ?? contact.ReceiverUsername}</span>
                                        {contact.NotificationCount > 0 ?
                                            <span className='message-alert'>{contact.NotificationCount}</span>
                                            : contact.LastMessageDate ?
                                                <span className="last-contact">{toShortLocal(contact.LastMessageDate)}</span>
                                                : <></>
                                        }
                                    </div>
                                    <span className='last-message'>
                                        {contact.CachedThread && contact.CachedThread.length > 0
                                            ? contact.CachedThread[contact.CachedThread.length - 1].Body
                                            : contact.LastMessage}
                                    </span>
                                </div>
                            </div>
                        ) : <></>}
                    </div>
                </div>
                <div className="chatbot-body">
                    <div className="chatbot-body-header">
                        <button type='button' className='chatbot-shortcut-button contact-menu-button' onClick={() => setContactMenuActive(true)}><PersonLinesFill /></button>
                        <h5>{contactName}</h5>
                        <div className="chatbot-shortcuts">
                            <div className={`chatbot-user-menu ${chatUMenuActive ? 'active' : ''}`}>
                                <ul>
                                    <li onClick={handleBlockUser}>
                                        {currentContact && currentContact.IsBlocked ? 'Engeli Kaldır' : 'Engelle'}
                                    </li>
                                    <li>Şikayet et</li>
                                </ul>
                            </div>
                            <button type='button' className='chatbot-shortcut-button usermenu-button' onClick={toggleChatUserMenu}><ThreeDots /></button>
                            <button type='button' className='chatbot-shortcut-button fullscreen-button' onClick={(e: any) => {
                                e.stopPropagation();
                                setIsChatbotFullscreen(!isChatbotFullscreen);
                            }}>
                                {isChatbotFullscreen
                                    ? <FullscreenExit />
                                    : <Fullscreen />}
                            </button>
                            <button type='button' className='chatbot-shortcut-button' onClick={() => handleGStatus('chatbotActive', false)}><XLg /></button>
                        </div>
                    </div>
                    <div className="message-box">
                        <div className="messages" ref={messagesEndRef}>
                            {currentThread && currentThread.length > 0 ? <>
                                {currentContact?.ThreadHasMore ?
                                    <button type="button" className="show-all-messages" onClick={() => {
                                        handleFetchThreadMessages(currentContact.ReceiverId, 'all');
                                    }}>Hepsini göster</button>
                                    : <></>}
                                {currentThread.map((message, i) => {
                                    // Animate if this is the new message
                                    const animate = animateMessageId === message.Id ? 'animate-new' : '';
                                    // Message owner
                                    const msgOwner = message.SenderId === userData!.sub ? 'you' : 'receiver';

                                    return (
                                        <div key={i} className={`message-item ${msgOwner} ${animate}`}>
                                            <p>{message.Body}</p>
                                            <span className='message-date'>{toShortLocal(message.CreatedAt)}</span>
                                        </div>
                                    )
                                })}
                            </> : currentThread
                                ? <span className='empty-thread'>Mesaj gönderin!</span>
                                : <span className='no-thread-selected'>Mesaj görüntülemek için menüden kişi seçiniz.</span>}
                        </div>
                    </div>
                    <div className="send-message-container">
                        <textarea
                            placeholder='Mesaj gönder...'
                            className='message-input'
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault(); // Prevents line break if shift isn't pressed, it won't work for onKeyUp
                                    handleMessageSubmit();
                                }
                            }}>
                        </textarea>
                        <button className='send' onClick={handleMessageSubmit}><Send /></button>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default Chatbot;