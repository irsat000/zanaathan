import Template from "@/components/template";


const Custom404 = () => {
    return (
        <Template>
            <div className="page-not-found">
                <div className="wrapper">
                    <h1>404 - Bulunamadı</h1>
                    <p>Üzgünüz, aradığınız sayfa bulunamadı.</p>
                </div>
            </div>
        </Template>
    );
};

export default Custom404;