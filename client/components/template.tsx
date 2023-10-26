
import { ReactNode, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { Bell, ChevronDown, List, PersonAdd, PersonPlus, PlusSquare, XLg } from 'react-bootstrap-icons'
import Link from 'next/link'
import AuthModal from './authModal'

const Template: React.FC<{
	children: ReactNode
}> = ({ children }) => {
	const [loggedIn, setLoggedIn] = useState(false);
	const [authModalActive, setAuthModalActive] = useState('none');
	const [drawerActive, setDrawerActive] = useState(false);

	const handleLoginModal = (type: string) => {
		if (drawerActive) {
			setDrawerActive(false);
		}
		setAuthModalActive(type);
	}


	return (
		<>
			<Head>
				<title>Zanaat sanattır, görmek için ödenir | ZanaatHan</title>
				<meta name="description" content="Generated by create next app" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className='page-content'>
				<AuthModal authModalActive={authModalActive} setAuthModalActive={setAuthModalActive} />
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
							{loggedIn ? <>
								<div className="shortcut-wrapper">
									<button onClick={() => alert("Hii!")}>
										<PlusSquare />
									</button>
									<button onClick={() => alert("Hi!")}>
										<Bell />
									</button>
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