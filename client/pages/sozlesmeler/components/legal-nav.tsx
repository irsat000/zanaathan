import Link from "next/link";

const LegalNav: React.FC<{
    page: string
}> = ({ page }) => {
    return (
        <div className="legal-nav">
            <ul>
                <li>
                    <Link href='/sozlesmeler' className={page === 'terms-and-conditions' ? 'active' : ''}>Kullanım Koşulları</Link>
                </li>
                <li>
                    <Link href='/sozlesmeler/gizlilik-politikasi' className={page === 'privacy-policy' ? 'active' : ''}>Gizlilik Politikası</Link>
                </li>
                <li>
                    <Link href='/sozlesmeler/cerez-politikasi' className={page === 'cookie-policy' ? 'active' : ''}>Çerez Politikası</Link>
                </li>
            </ul>
        </div>
    );
};

export default LegalNav;