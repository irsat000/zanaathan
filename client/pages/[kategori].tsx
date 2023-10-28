
import Template from '@/components/template'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'react-bootstrap-icons'
import categoryList from '@/assets/site/categories.json'
import { getCategoryInfo } from '@/utils/helperUtils';


export default function Home() {
  const { categoryCode, categoryName } = getCategoryInfo(categoryList);

  return (
    <Template>
      <div className='category-page'>
        <div className="breadcrumb-trail-container">
          <Link href={'/'}>Anasayfa</Link>
          <span><ChevronRight /></span>
          <Link href={'/' + categoryCode}>{categoryName}</Link>
        </div>
        <div className='listing-options'>
          <button className='filter-button'>Filtrele</button>
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
              <Link href={'/ilan/' + i} className='post-link'>
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
