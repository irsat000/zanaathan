import Link from "next/link";

const LegalNav: React.FC<{
    page: string
}> = ({ page }) => {
    return (
        <div className="legal-nav">
            <ul>
                <li>
                    <Link href='/politika' rel='nofollow' className={page === 'terms-and-conditions' ? 'active' : ''}>Kullanım Koşulları</Link>
                </li>
                <li>
                    <Link href='/politika/gizlilik-politikasi' rel='nofollow' className={page === 'privacy-policy' ? 'active' : ''}>Gizlilik Politikası</Link>
                </li>
                <li>
                    <Link href='/politika/cerez-politikasi' rel='nofollow' className={page === 'cookie-policy' ? 'active' : ''}>Çerez Politikası</Link>
                </li>
                <li>
                    <Link href='/politika/fb-veri-silme' rel='nofollow' className={page === 'fb-data-deletion' ? 'active' : ''}>Facebook Veri Silme</Link>
                </li>
            </ul>
        </div>
    );
};

export default LegalNav;