
import { ReactNode, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { Bell, ChatDots, CheckCircle, List, PersonPlus, PlusSquare, XCircle, XLg } from 'react-bootstrap-icons'
import Link from 'next/link'
import categoryList from '@/assets/site/categories.json'
import AuthModal, { AuthModalState } from './authModal'
import { useUser } from '@/context/userContext'
import { readJwtCookie, removeJwtCookie } from '@/lib/utils/userUtils'
import Chatbot from './chatbot'
import { useContacts } from '@/context/contactsContext'
import { useGStatus } from '@/context/globalContext'
import { apiUrl, avatarLink } from '@/lib/utils/helperUtils'
import router from 'next/router'


interface SearchRecommendation {
	text: string;
	link: string;
}


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
		// If facebook is connected, logout from FB aswell
		try {
			window.FB.getLoginStatus(function (response: any) {
				if (response.status === 'connected') {
					window.FB.logout();
				}
			});
		} catch (e) { }
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
			document.removeEventListener("click", handleDocumentClick);
		};
	}, [userMenuActive]);

	// Search feature
	const [searchBar, setSearchBar] = useState('');
	const [searchRecommendations, setSearchRecommendations] = useState<SearchRecommendation[]>([]);
	const handleSearchBarChange = (e: any) => {
		// Get value from input
		const value = e.target.value;

		// Set value for input
		setSearchBar(value);

		// Create empty recommendations array or initialize it with written text
		const updated = value !== '' ? [{
			text: value + ' - Ara',
			link: "/search?key=" + encodeURIComponent(value)
		}] : [];

		// Get categories and subcategories that includes the value substring
		categoryList.forEach(c => {
			if (c.Name.toLocaleLowerCase('tr').includes(value.toLocaleLowerCase('tr'))) {
				updated.push({
					text: c.Name,
					link: '/' + c.Code
				});
			}
			c.SubCategories.forEach(s => {
				if (s.Name.toLocaleLowerCase('tr').includes(value.toLocaleLowerCase('tr'))) {
					updated.push({
						text: c.Name + ' > ' + s.Name,
						link: `/${c.Code}?subc=${s.Id}`
					});
				}
			})
		});

		// Update state
		setSearchRecommendations(updated);
	}



	// Check chat notification
	const hasNotification = userContacts.some(c => c.NotificationCount > 0);

	return (
		<>
			<Head>
				<title>Zanaat sanattır | ZanaatHan</title>
				<meta name="description" content="Generated by create next app" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className='page-content'>
				{userData ? <Chatbot /> : <></>}
				<AuthModal
					authModalActive={authModalActive} setAuthModalActive={setAuthModalActive}
				/>
				{gStatus.informationModal ?
					<div className={`information-modal-container modal-container ${gStatus.informationModal ? 'active' : ''}`}>
						<div className="information-modal">
							<div className='icon'>
								{gStatus.informationModal.type === 'success'
									? <CheckCircle style={{ color: '#34c532' }} />
									: gStatus.informationModal.type === 'error'
										? <XCircle style={{ color: '#c53232' }} />
										: <></>}

							</div>
							<span dangerouslySetInnerHTML={{ __html: gStatus.informationModal.text }} />
							<button type='button' className='okay-button' onClick={() => handleGStatus('informationModal', null)}>Tamam</button>
						</div>
					</div>
					: <></>}
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
							<input
								type='text'
								placeholder='Hizmetleri hızlıca ara'
								value={searchBar}
								onChange={handleSearchBarChange}
							/>
							<div className="search-recommendations">
								<ul>
									{searchRecommendations.slice(0, 5).map(r =>
										<li><Link href={r.link} onMouseDown={() => {
											setSearchBar('')
											router.push(r.link)
										}}>{r.text}</Link></li>
									)}
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
										<div className={`icon-wrap ${hasNotification ? 'icon-alert' : ''}`}>
											<ChatDots />
										</div>
									</button>
									<button onClick={() => alert("Hi!")}>
										<Bell />
									</button>
								</div>
								<button type='button' className='user-menu-button' onClick={() => setUserMenuActive(!userMenuActive)}>
									{userData.avatar
										? <Image
											loader={() => avatarLink(userData.avatar!)}
											src={avatarLink(userData.avatar)}
											alt={'Profile fotoğrafı'}
											priority={false}
											width={0}
											height={0} />
										: <Image
											src={require('@/assets/site/user.png')}
											alt={'Profil fotoğrafı yok'}
											width={0}
											height={0} />}
								</button>
								<div className={`user-menu ${userMenuActive ? 'active' : ''}`} ref={userMenuRef}>
									<div className='user-menu-close'>
										<button type='button' onClick={() => setUserMenuActive(false)}><XLg /></button>
									</div>
									<Link href={'/profil'} className='um-profile'>
										<span className='um-username'>{userData.fullName ?? userData.username}</span>
										<span className='um-email'>{userData.email}</span>
									</Link>
									<ul className='user-menu-list'>
										<li><Link href={'/ayarlar'}>Ayarlar</Link></li>
										{userData.roles && userData.roles.length > 0 ?
											<li><Link href={'/panel/onay-bekleyenler'}>Panel</Link></li>
											: <></>}
									</ul>
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