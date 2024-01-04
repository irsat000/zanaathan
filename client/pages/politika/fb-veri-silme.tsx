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
                        ZanaatHan, kişisel verilerinizi depolamaz; yalnızca giriş için kullanılır. Facebook Platform kurallarına göre, Kullanıcı Verisi Silme Geri Çağrı URL&apos;si veya Veri Silme Talimatları URL&apos;si sağlamamız gerekiyor. ZanaatHan&apos;daki etkinliklerinizi silmek istiyorsanız, aşağıdaki talimatları izleyin:
                    </p>
                    <ol>
                        <li>Facebook hesabınızın Ayarlar ve Gizlilik bölümüne gidin. &quot;Ayarlar&quot; ı tıklayın.</li>
                        <li>Ardından, &quot;Uygulamalar ve Web Siteleri&quot;ne gidin ve tüm Uygulama etkinliklerinizi göreceksiniz.</li>
                        <li>ZanaatHan için seçenek kutusunu işaretleyin.</li>
                        <li>&quot;Kaldır&quot; düğmesine tıklayın.</li>
                    </ol>

                </div>
            </div>
        </Template>
    );
};

export default FBDataDeletionInstructions;