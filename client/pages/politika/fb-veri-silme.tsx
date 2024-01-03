import Template from "@/components/template";
import LegalNav from "./components/legal-nav";


const FBDataDeletionInstructions = () => {
    return (
        <Template>
            <div className="legal-page">
                <LegalNav page='fb-data-deletion' />
                <div className="legal-body">
                    <h1>Facebook Veri Silme Adımları</h1>
                    <p>
                        ZanaatHan, kişisel verilerinizi depolamaz; yalnızca giriş için kullanılır. Facebook Platform kurallarına göre, Kullanıcı Verisi Silme Geri Çağrı URL'si veya Veri Silme Talimatları URL'si sağlamamız gerekiyor. ZanaatHan'daki etkinliklerinizi silmek istiyorsanız, aşağıdaki talimatları izleyin:
                    </p>
                    <ol>
                        <li>Facebook hesabınızın Ayarlar ve Gizlilik bölümüne gidin. "Ayarlar" ı tıklayın.</li>
                        <li>Ardından, "Uygulamalar ve Web Siteleri"ne gidin ve tüm Uygulama etkinliklerinizi göreceksiniz.</li>
                        <li>ZanaatHan için seçenek kutusunu işaretleyin.</li>
                        <li>"Kaldır" düğmesine tıklayın.</li>
                    </ol>

                </div>
            </div>
        </Template>
    );
};

export default FBDataDeletionInstructions;