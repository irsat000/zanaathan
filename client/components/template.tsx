
import { ReactNode, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { Bell, ChevronDown, List, PersonAdd, PersonPlus, PlusSquare, XLg } from 'react-bootstrap-icons'
import Link from 'next/link'

const Template: React.FC<{
	children: ReactNode
}> = ({ children }) => {
	const [loggedIn, setLoggedIn] = useState(false);
	const [loginModalActive, setLoginModalActive] = useState('none');
	const [drawerActive, setDrawerActive] = useState(false);

	const handleLoginModal = (type: string) => {
		if (drawerActive) {
			setDrawerActive(false);
		}
		setLoginModalActive(type);
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
				<div className={`login-modal-container ${loginModalActive !== 'none' && 'active'}`} onClick={() => setLoginModalActive('none')}>
					<div className='login-modal' onClick={(e) => { e.stopPropagation() }}>
						<button type='button' className='close-login-button' onClick={() => setLoginModalActive('none')}><XLg /></button>
						<div className="login-tab-buttons">
							<span className={`login-tab-button ${loginModalActive === 'signin' ? 'active' : 'inactive'}`}
								onClick={() => setLoginModalActive('signin')}>Giriş Yap</span>
							<span className={`register-tab-button ${loginModalActive === 'signup' ? 'active' : 'inactive'}`}
								onClick={() => setLoginModalActive('signup')}>Kayıt Ol</span>
						</div>
						{loginModalActive === 'signin' ?
							<form className='login-form' onSubmit={(e) => { e.preventDefault() }}>
								<input type='text' placeholder='Kullanıcı Adı' className='form-input' />
								<input type='password' placeholder='Şifre' className='form-input' />
								<div className="login-button-container">
									<button type='submit' className='submit-button'>Giriş</button>
									<Link href={'/'}>Unuttum</Link>
								</div>
							</form> :
							<form className='register-form' onSubmit={(e) => { e.preventDefault() }}>
								<input type='text' placeholder='E-Posta' className='form-input' />
								<input type='text' placeholder='Kullanıcı Adı' className='form-input' />
								<input type='password' placeholder='Şifre' className='form-input' />
								<div className="register-button-container">
									<button type='submit' className='submit-button'>Kayıt ol</button>
								</div>
							</form>}
						<span className='or-seperator'>Ya da</span>
						<button type='button' className='google-button-temp'>Google ile</button>
						<span className='line-seperator'></span>
						<span className='signup-instead'>Hesabın yok mu? <Link href={'/kayit'}>Kayıt ol</Link></span>
					</div>
				</div>
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
									<button type='button' className='signin-button' onClick={() => setLoginModalActive('signin')}>Giriş yap</button>
									<button type='button' className='signup-button' onClick={() => setLoginModalActive('signup')}><PersonPlus /></button>
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