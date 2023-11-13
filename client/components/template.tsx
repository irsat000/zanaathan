
import { ReactNode, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { Bell, ChatDots, List, PersonPlus, PlusSquare, XLg } from 'react-bootstrap-icons'
import Link from 'next/link'
import AuthModal, { AuthModalState } from './authModal'
import { useUser } from '@/context/userContext'
import { readJwtCookie, removeJwtCookie } from '@/lib/utils/userUtils'
import Chatbot from './chatbot'
import { useContacts } from '@/context/contactsContext'
import { useGStatus } from '@/context/globalContext'



const Template: React.FC<{
	children: ReactNode
}> = ({ children }) => {
	// Get contacts for messaging
	/*const first: UserContacts = {
		ReceiverId: 5,
		LastMessage: "string",
		LastMessageDate: "string",
		ReceiverAvatar: "string",
		ReceiverFullName: "string",
		ReceiverUsername: "string",
		CachedThread: undefined
	}*/
	// User contacts context
	const { userContacts, setUserContacts } = useContacts();
	// General status context
	const { gStatus, setGStatus, handleGStatus } = useGStatus();


	// User context
	const { userData, setUserData } = useUser();
	// Decode jwt and login if token is still there
	useEffect(() => {
		const info = readJwtCookie();
		if (info) {
			setUserData(info);
		}
	}, []);
	// Logout function
	// Empties the user context and removes the cookie
	const handleSignOut = () => {
		setUserData(null);
		removeJwtCookie();
		setUserContacts([]);
	}

	const [authModalActive, setAuthModalActive] = useState<AuthModalState>('none'); // Login/Register modal = auth modal
	const [drawerActive, setDrawerActive] = useState(false); // Drawer for mobile
	const [userMenuActive, setUserMenuActive] = useState(false); // User menu drop down

	// Will close the drawer and open auth modal
	const handleLoginModal = (type: AuthModalState) => {
		if (drawerActive) {
			setDrawerActive(false);
		}
		setAuthModalActive(type);
	}

	// Handle clicking outside user-menu
	const userMenuRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const handleDocumentClick = (e: any) => {
			// Check if the click target is outside of the user-menu dropdown div and user-menu button
			if (userMenuActive && !userMenuRef.current?.contains(e.target) && !e.target.closest('.user-menu-button')) {
				setUserMenuActive(false);
			}
		};

		// Record clicks
		document.addEventListener("click", handleDocumentClick);

		return () => {
			// Probably won't go here because this is from the template
			document.removeEventListener("click", handleDocumentClick);
		};
	}, [userMenuActive]);


	return (
		<>
			<Head>
				<title>Zanaat sanattır, görmek için ödenir | ZanaatHan</title>
				<meta name="description" content="Generated by create next app" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className='page-content'>
				{userData ? <Chatbot /> : <></>}
				<AuthModal
					authModalActive={authModalActive} setAuthModalActive={setAuthModalActive}
					setUserContacts={setUserContacts}
				/>
				<div className={`drawer-container ${drawerActive && 'active'}`} onClick={() => setDrawerActive(false)}>
					<div className="drawer" onClick={(e) => { e.stopPropagation() }}>
						<Link href={'/'} className='drawer-site-logo'>Zanaat.Han</Link>
						<div className="drawer-list">
							<a className='drawer-button' onClick={() => handleLoginModal('signin')}>Giriş yap</a>
							<a className='drawer-button' onClick={() => handleLoginModal('signup')}>Kayıt ol</a>
						</div>
					</div>
				</div>
				<header>
					<div className="header-container">
						<div className='search-bar'>
							<input type='text' placeholder='Hizmetleri hızlıca ara' />
							<div className="search-recommendations">
								<ul>
									<li>Boya Badana</li>
									<li>Sıhhi Tesisat</li>
									<li>Fayans İşçiliği</li>
								</ul>
							</div>
						</div>
						<Link href='/' className="site-logo-wrapper">
							<span className='m'>Z<b>.</b>H</span>
							<span className='d'>Zanaat<b>.</b>Han</span>
						</Link>
						<button className='drawer-button' onClick={() => setDrawerActive(true)}>
							<List />
						</button>
						<div className="user-container">
							{userData ? <>
								<div className="shortcut-wrapper">
									<Link href={'/yeni-ilan'}>
										<PlusSquare />
									</Link>
									<button className='open-chatbot-button' onClick={() => handleGStatus('chatbotActive', !gStatus.chatbotActive)}>
										<ChatDots />
									</button>
									<button onClick={() => alert("Hi!")}>
										<Bell />
									</button>
								</div>
								<button type='button' className='user-menu-button' onClick={() => setUserMenuActive(!userMenuActive)}>
									<Image src={require('@/assets/site/user.png')} alt={userData.username} />
								</button>
								<div className={`user-menu ${userMenuActive && 'active'}`} ref={userMenuRef}>
									<div className='user-menu-close'>
										<button type='button' onClick={() => setUserMenuActive(false)}><XLg /></button>
									</div>
									<span className='um-username'>{userData.fullName ?? userData.username}</span>
									<button type='button' className='sign-out-button' onClick={handleSignOut}>Çıkış yap</button>
								</div>
							</> : <>
								<div className="user-auth-buttons">
									<button type='button' className='signin-button' onClick={() => setAuthModalActive('signin')}>Giriş yap</button>
									<button type='button' className='signup-button' onClick={() => setAuthModalActive('signup')}><PersonPlus /></button>
								</div>
							</>}
						</div>
					</div>
				</header>
				<main>
					{children}
				</main>
				<footer>

				</footer>
			</div>
		</>
	);
}

export default Template;