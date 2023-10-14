
import Template from '@/pages/components/template'
import Image from 'next/image'


export default function Home() {
  return (
    <Template>
      <>
        <div className="intro">
          <div className="customer">
            <h2>Müşteri</h2>
            <p>
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Rem animi reiciendis debitis beatae temporibus, voluptatibus earum molestiae. Dolores tempora consectetur ad possimus veritatis quibusdam aspernatur quod natus unde quas. Culpa.
            </p>
            <button>İlan ver</button>
          </div>
          <div className="freelancer">
            <h2>Serbest Çalışan <span>(Freelancer)</span></h2>
            <p>
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Tenetur repellat labore asperiores, a nihil ipsam nisi natus rerum! Officiis ipsam asperiores vero quam aliquam, sequi totam iste est corporis error!
            </p>
            <button>İş ara</button>
          </div>
        </div>
      </>
    </Template>
  )
}
