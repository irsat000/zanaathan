
import { ReactNode, useEffect, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { Bell, ChatDots, CheckCircle, List, PersonPlus, PlusSquare, XCircle, XLg } from 'react-bootstrap-icons'
import Link from 'next/link'
import categoryList from '@/assets/site/categories.json'
import AuthModal from './authModal'
import { useUser } from '@/context/userContext'
import { readJwtCookie, removeJwtCookie } from '@/lib/utils/userUtils'
import Chatbot from './chatbot'
import { useContacts } from '@/context/contactsContext'
import { AuthModalState, useGStatus } from '@/context/globalContext'
import { avatarLink } from '@/lib/utils/helperUtils'
import { HashLoader } from 'react-spinners'
import Router from 'next/router'
import NotificationModal from './notificationModal'
import { useNotifications } from '@/context/notificationsContext'
import { Notifications } from './notifications'


interface SearchRecommendation {
	text: string;
	link: string;
}

const Template: React.FC<{
	children: ReactNode,
	title?: string
}> = ({ children, title }) => {
	// User's contacts context
	const { userContacts, setUserContacts } = useContacts();
	// General status context
	const { gStatus, handleGStatus } = useGStatus();
	// User's notifications context
	const { notifications, setNotifications } = useNotifications();

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
		setUserContacts(null);
		setNotifications(null);
		// If facebook is connected, logout from FB aswell
		try {
			window.FB.getLoginStatus(function (response: any) {
				if (response.status === 'connected') {
					window.FB.logout();
				}
			});
		} catch (e) { }
	}

	const [drawerActive, setDrawerActive] = useState(false); // Drawer for mobile
	const [userMenuActive, setUserMenuActive] = useState(false); // User menu drop down
	const [notificationBoxActive, setNotificationBoxActive] = useState(false); // Notification list box
	const [activeNotificationIndex, setActiveNotificationIndex] = useState<number | null>(null); // Notification details modal on/off and index info

	// Will close the drawer and open auth modal
	const handleLoginModal = (type: AuthModalState) => {
		if (drawerActive) {
			setDrawerActive(false);
		}
		handleGStatus('authModalActive', type);
	}

	// Handle clicking outside
	useEffect(() => {
		const handleDocumentClick = (e: any) => {
			// Check if the click target is outside of the relevant elements
			if (userMenuActive && !e.target.closest('.user-menu') && !e.target.closest('.user-menu-button')) {
				setUserMenuActive(false);
			}
			if (notificationBoxActive
				&& !e.target.closest('.notification-wrapper')
				&& !e.target.closest('.notification-modal-container')) {
				setNotificationBoxActive(false);
			}
		};

		// Record clicks
		document.addEventListener("mousedown", handleDocumentClick);

		return () => {
			document.removeEventListener("mousedown", handleDocumentClick);
		};
	}, [userMenuActive, notificationBoxActive]);

	// Search feature
	const [searchBar, setSearchBar] = useState('');
	const [searchRecommendations, setSearchRecommendations] = useState<SearchRecommendation[]>([]);
	const handleSearchBarChange = (e: any) => {
		// Get value from input
		const value = e.target.value;

		// Set value for input
		setSearchBar(value);

		// Create empty recommendations array
		const updated: { text: string, link: string }[] = [];

		// Coming soon
		// or initialize it with written text
		/*value !== '' ? [{
			text: value + ' - Ara',
			link: "/search?key=" + encodeURIComponent(value)
		}] : [];*/

		// Get categories and subcategories that includes the value substring
		categoryList.forEach(c => {
			if (c.Name.toLocaleLowerCase('tr').includes(value.toLocaleLowerCase('tr'))) {
				updated.push({
					text: c.Name,
					link: '/' + c.Code
				});
			}
			c.SubCategories.forEach((s: any) => {
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
	const hasMessageNotification = userContacts ? userContacts.some(c => c.NotificationCount > 0) : false;
	const hasNotification = notifications ? notifications.some(n => n.isSeen === false) : false;

	let pageTitle: string = "ZanaatHan - "
	if (title) pageTitle += title;
	else pageTitle += 'İş ilanı ver, ustalarla tanış, serbest çalış';

	return (
		<>
			<Head>
				<title>{pageTitle}</title>
				<meta name="description" content="İş ilanı verin veya serbest çalışmaya başlayın. Ustalarla konuşup anlaşın. Kombi tamiri, ev tadilatı, boya badana, hurda satışı ve dahası." />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
				<meta
					property="og:description"
					content="İş ilanı ver, ustalarla tanış, serbest çalış"
				/>
				{/*<meta
					property="og:image"
					content="later"
				/>*/}
			</Head>
			<div className='page-content'>
				{userData ? <Chatbot /> : <></>}
				<AuthModal />
				{activeNotificationIndex !== null && notifications && notifications[activeNotificationIndex]
					? <NotificationModal activeNotificationIndex={activeNotificationIndex} setActiveNotificationIndex={setActiveNotificationIndex} notification={notifications[activeNotificationIndex]} />
					: <></>}
				{gStatus.informationModal ?
					<div className={`information-modal-container modal-container ${gStatus.informationModal ? 'active' : ''}`}
						onClick={() => handleGStatus('informationModal', null)}>
						<div className="information-modal" onClick={(e) => e.stopPropagation()}>
							<div className='icon'>
								{gStatus.informationModal.type === 'success'
									? <CheckCircle style={{ color: '#34c532' }} />
									: gStatus.informationModal.type === 'error'
										? <XCircle style={{ color: '#c53232' }} />
										: gStatus.informationModal.type === 'loading'
											? <HashLoader color="#36d7b7" />
											: <></>}
							</div>
							<span dangerouslySetInnerHTML={{ __html: gStatus.informationModal.text }} />
							<button type='button' className='okay-button' onClick={() => handleGStatus('informationModal', null)}>Tamam</button>
						</div>
					</div>
					: <></>}
				<div className={`drawer-container ${drawerActive && 'active'}`} onClick={() => setDrawerActive(false)}>
					<div className="drawer" onClick={(e) => { e.stopPropagation() }}>
						<Link href={'/'} className='drawer-site-logo'>Zanaat Han</Link>
						{userData ? <>
							<Link href={'/profil'} className='user-image'>
								{userData.avatar
									? <Image
										loader={() => avatarLink(userData.avatar!)}
										src={avatarLink(userData.avatar)}
										alt={'Profil fotoğrafı'}
										priority={false}
										unoptimized={true}
										width={0}
										height={0}
										onError={(e: any) => {
											e.target.src = "/user.webp";
											e.target.onerror = null;
										}} />
									: <img
										src="/user.webp"
										alt={'Profil fotoğrafı yok'} />}
							</Link>
							<Link href={'/profil'} className='dr-profile-button'>
								<span className='dr-username'>{userData.fullName ?? userData.username}</span>
								<span className='dr-email'>{userData.email}</span>
							</Link>
							<div className="drawer-list">
								<Link href={'/ayarlar'}>Ayarlar</Link>
								<Link href={'/yeni-ilan'}>İlan oluştur</Link>
								{userData.roles && userData.roles.length > 0 ?
									<Link href={'/panel/onay-bekleyenler'}>Panel</Link>
									: <></>}
							</div>
							<button type='button' className='sign-out-button' onClick={handleSignOut}>Çıkış yap</button>
						</> : <>
							<div className="drawer-list">
								<a onClick={() => handleLoginModal('signin')}>Giriş yap</a>
								<a onClick={() => handleLoginModal('signup')}>Kayıt ol</a>
							</div>
						</>}
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
									{searchRecommendations.slice(0, 5).map((r, index) =>
										<li key={index}><Link href={r.link} onMouseDown={() => {
											setSearchBar('')
											Router.push(r.link)
										}}>{r.text}</Link></li>
									)}
								</ul>
							</div>
						</div>
						<Link href='/' className="site-logo-wrapper">
							{userData ?
								<button className='open-chatbot-button' onClick={() => handleGStatus('chatbotActive', !gStatus.chatbotActive)}>
									<div className={`icon-wrap ${hasMessageNotification ? 'icon-alert' : ''}`}>
										<ChatDots />
									</div>
								</button> :
								<span className='m'>Z.H</span>}
							<span className='d'>Zanaat Han</span>
						</Link>
						<button className='drawer-button' onClick={() => setDrawerActive(true)}>
							<List />
						</button>
						<div className="user-container">
							{userData ? <>
								<div className="shortcut-wrapper">
									<Link href={'/yeni-ilan'} className='shortcut-button'>
										<PlusSquare />
									</Link>
									<button className='open-chatbot-button shortcut-button' onClick={() => handleGStatus('chatbotActive', !gStatus.chatbotActive)}>
										<div className={`icon-wrap ${hasMessageNotification ? 'icon-alert' : ''}`}>
											<ChatDots />
										</div>
									</button>
									<div className="notification-wrapper">
										<button className='shortcut-button' onClick={() => setNotificationBoxActive(!notificationBoxActive)}>
											<div className={`icon-wrap ${hasNotification ? 'icon-alert' : ''}`}>
												<Bell />
											</div>
										</button>
										<Notifications {...{ notificationBoxActive, setActiveNotificationIndex }} />
									</div>
								</div>
								<button type='button' className='user-menu-button' onClick={() => setUserMenuActive(!userMenuActive)}>
									{userData.avatar
										? <Image
											loader={() => avatarLink(userData.avatar!)}
											src={avatarLink(userData.avatar)}
											alt={'Profil fotoğrafı'}
											priority={false}
											unoptimized={true}
											width={0}
											height={0}
											onError={(e: any) => {
												e.target.src = "/user.webp";
												e.target.onerror = null;
											}} />
										: <img
											src="/user.webp"
											alt={'Profil fotoğrafı yok'} />}
								</button>
								<div className={`user-menu ${userMenuActive ? 'active' : ''}`}>
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
									<button type='button' className='signin-button' onClick={() => handleGStatus('authModalActive', 'signin')}>Giriş yap</button>
									<button type='button' className='signup-button' onClick={() => handleGStatus('authModalActive', 'signup')}><PersonPlus /></button>
								</div>
							</>}
						</div>
					</div>
				</header>
				<main>
					{children}
				</main>
				<footer>
					<h1>Zanaat Han</h1>
					<div className="copyright">
						<p>Telif Hakkı © 2024 - Tüm haklar saklıdır.</p>
					</div>
				</footer>
			</div>
		</>
	);
}

export default Template;