
import Template from '@/pages/components/template'
import Image from 'next/image'


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
          <Image src={require('./assets/site/painter2.jpg')} className='intro-image' alt={''} />
        </div>
      </>
    </Template>
  )
}
