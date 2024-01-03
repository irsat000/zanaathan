import Link from "next/link";

const LegalNav: React.FC<{
    page: string
}> = ({ page }) => {
    return (
        <div className="legal-nav">
            <ul>
                <li>
                    <Link href='/politika' className={page === 'terms-and-conditions' ? 'active' : ''}>Kullanım Koşulları</Link>
                </li>
                <li>
                    <Link href='/politika/gizlilik-politikasi' className={page === 'privacy-policy' ? 'active' : ''}>Gizlilik Politikası</Link>
                </li>
                <li>
                    <Link href='/politika/cerez-politikasi' className={page === 'cookie-policy' ? 'active' : ''}>Çerez Politikası</Link>
                </li>
                <li>
                    <Link href='/politika/fb-veri-silme' className={page === 'fb-data-deletion' ? 'active' : ''}>Facebook Veri Silme</Link>
                </li>
            </ul>
        </div>
    );
};

export default LegalNav;