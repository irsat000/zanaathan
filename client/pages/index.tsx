
import Template from '@/components/template'
import Image from 'next/image'
import Link from 'next/link'
import { CheckLg } from 'react-bootstrap-icons'
import categoryList from '@/assets/site/categories.json'


export default function Home() {
  return (
    <Template>
      <div className='index-page'>
        <div className="intro">
          <div className="intro-content">
            <h2>Zanaat <span className='red'>Sanattır.</span><br />Zanaat Han'a Hoşgeldiniz!</h2>
            <p>
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Rem animi reiciendis debitis beatae temporibus, voluptatibus earum molestiae. Dolores tempora consectetur ad possimus veritatis quibusdam aspernatur quod natus unde quas. Culpa.
            </p>
            <div className="intro-buttons">
              <Link href='/yeni-ilan' className='intro-button-1'>İlan ver</Link>
              {/* coming soon
              <button className='intro-button-2'>İş ara</button>*/}
            </div>
          </div>
          <Image src={require('@/assets/site/intro.png')} priority={true} className='intro-image' alt={'Intro image'} />
        </div>
        <div className='category-list-heading-container'>
          <h2>Hizmetler</h2>
        </div>
        <div className="category-list">
          {categoryList.map((cate, i) => {
            return (
              <Link href={'/' + cate.Code} className='category-card' key={i}>
                <div className="category-image">
                  <Image src={require('@/assets/categoryImages/' + cate.Image)} alt={cate.Name} />
                </div>
                <div className="category-details">
                  <span className="category-title">{cate.Name}</span>
                  {/*<div className="category-statistics"><span>0</span><CheckLg /></div>*/}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </Template>
  )
}
