
import Template from '@/components/template'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, XLg } from 'react-bootstrap-icons'
import categoryList from '@/assets/site/categories.json'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'


export default function Home() {
  const router = useRouter();
  const [categoryInfo, setCategoryInfo] = useState<{
    code: string | null,
    name: string | null,
    subCates: Array<{
      Id: number;
      Name: string;
    }>
  }>({ code: null, name: null, subCates: [] });

  useEffect(() => {
    // Run only when router is ready, otherwise router.asPath will be initially "/[kategori]"
    if (!router.isReady) return;
    // Get category code from path
    const code = router.asPath.split('/')[1];
    // Get name by searching with code in category list from categories.json file
    // and assign both to categoryInfo
    const category = categoryList.find(cat => cat.Code === code);
    if (category) {
      const name = category.Name;
      const subCates = category.SubCategories;
      setCategoryInfo({ code, name, subCates });
    }
  }, [router.isReady]);

  const [filterModalActive, setFilterModalActive] = useState(false);

  return (
    <Template>
      <div className={`filter-modal-container modal-container ${filterModalActive && 'active'}`} onMouseDown={() => setFilterModalActive(false)}>
        <div className="filter-modal" onMouseDown={(e) => { e.stopPropagation() }}>
          <button type='button' className='close-modal-button' onClick={() => setFilterModalActive(false)}><XLg /></button>
          <span className='modal-heading'>Filtrele</span>
          <span className="f-heading">Alt Kategoriler</span>
          <div className="f-container">
            <label className='sub-category-label'><input type='checkbox' onChange={(e) => {

            }} /><span>Hepsi</span></label>
            {categoryInfo.subCates.map((c, i) => {
              return <label key={i} className='sub-category-label'><input type='checkbox' /><span>{c.Name}</span></label>;
            })}
          </div>
          <span className="f-heading">Bölge Seç</span>
          <div className="f-container">
          </div>
        </div>
      </div>
      <div className='category-page'>
        <div className="breadcrumb-trail-container">
          <Link href={'/'}>Anasayfa</Link>
          <span><ChevronRight /></span>
          <Link href={'/' + categoryInfo.code}>{categoryInfo.name}</Link>
        </div>
        <div className='listing-options'>
          <button className='filter-button' onClick={() => setFilterModalActive(true)}>Filtrele</button>
          <div className='sort-by'>
            <span>Sırala</span>
            <select>
              <option value='mix'>Karışık</option>
              <optgroup label='Çalışanlar'>
                <option value='popular'>Popüler</option>
                <option value='new-freelancer'>Yeni</option>
              </optgroup>
              <optgroup label='İlanlar'>
                <option value='old'>Eski</option>
                <option value='new-work'>Yeni</option>
              </optgroup>
            </select>
          </div>
        </div>

        <div className="listing">
          {[...Array(10)].map((a, i) =>
            <div className="post" key={i}>
              <Link href={`/${categoryInfo.code}/${i}`} className='post-link'>
                <div className="post-image-carousel">
                  <Image src={require('../assets/site/painter2.jpg')} alt={''} />
                </div>
                <h4 className='title'>Tüm evin badanaya ihtiyacı var!</h4>
              </Link>
              <span className="date">1 gün önce</span>
              <p className='description'>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur ullam culpa quaerat commodi necessitatibus dolore beatae eius voluptatem rem veniam exercitationem vel amet, nesciunt ipsa dignissimos alias ratione fuga labore.
              </p>
            </div>
          )}
        </div>



      </div>
    </Template>
  )
}
