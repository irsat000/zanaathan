
import { ReactNode, useEffect } from 'react'
import Head from 'next/head'
import { ChevronDown } from 'react-bootstrap-icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/context/userContext';
import { readJwtCookie } from '@/lib/utils/userUtils';

const PanelTemplate: React.FC<{
    children: ReactNode,
    tabName: string
}> = ({ children, tabName }) => {
    const router = useRouter();
    const currentPath = router.pathname;

    // User context
    const { userData, setUserData } = useUser();
    // Decode jwt and login if token is still there
    useEffect(() => {
        const info = readJwtCookie();
        if (info && info.roles && info.roles.length > 0) {
            setUserData(info);
        } else {
            router.push('/panel/giris');
        }
    }, []);

    return (
        <>
            <Head>
                <title>ZanaatHan Admin</title>
                <meta name="description" content="Generated by create next app" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className='panel-page'>
                <nav className='panel-nav'>
                    <h2 className='nav-logo'>Zanaat.Han Admin</h2>
                    <ul>
                        <li className={`${currentPath === '/panel/onay-bekleyenler' ? 'active' : ''}`}>
                            <Link href={'/panel/onay-bekleyenler'}>Onay bekleyenler</Link>
                        </li>
                        <li className={`${currentPath === '/panel/raporlar' ? 'active' : ''}`}>
                            <Link href={'/panel/raporlar'}>Raporlar</Link>
                        </li>
                        <li className={`${currentPath === '/panel/kullanicilar' ? 'active' : ''}`}>
                            <Link href={'/panel/kullanicilar'}>Kullanıcıları yönet</Link>
                        </li>
                        <li className={`${currentPath === '/panel/admin' ? 'active' : ''}`}>
                            <Link href={'/panel/admin'}>Hesap</Link>
                        </li>
                    </ul>
                </nav>
                <div className='panel'>
                    <header>
                        <h2 className='tab-name'>{tabName}</h2>
                        <div className="admin-container">
                            <span>{userData?.username}</span>
                            <ChevronDown />
                        </div>
                    </header>
                    <main>
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}

export default PanelTemplate;