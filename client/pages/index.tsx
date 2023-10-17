
import Template from '@/components/template'
import Image from 'next/image'
import Link from 'next/link'
import { CheckLg } from 'react-bootstrap-icons'


export default function Home() {
  return (
    <Template>
      <>
        <div className="intro">
          <div className="intro-content">
            <h2>Zanaat sanattır, ödemesini bilmeli.</h2>
            <p>
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Rem animi reiciendis debitis beatae temporibus, voluptatibus earum molestiae. Dolores tempora consectetur ad possimus veritatis quibusdam aspernatur quod natus unde quas. Culpa.
            </p>
            <div className="intro-buttons">
              <button>İlan ver</button>
              <button>İş ara</button>
            </div>
          </div>
          <Image src={require('../assets/site/painter2.jpg')} className='intro-image' alt={''} />
        </div>
        <div className='category-list-heading-container'>
          <h2>Hizmetler</h2>
        </div>
        <div className="category-list">
          {[...Array(10)].map((a, i) => {
            return (
              <Link href={'/kategori'} className='category-card' key={i}>
                <div className="category-image">
                  <Image src={require('../assets/site/painter2.jpg')} alt={''} />
                </div>
                <div className="category-details">
                  <span className="category-title">Boya Badana</span>
                  <div className="category-statistics"><span>0</span><CheckLg /></div>
                </div>
              </Link>
            )
          })}
        </div>
      </>
    </Template>
  )
}
