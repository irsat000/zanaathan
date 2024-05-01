
import Template from '@/components/template'
import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'react-bootstrap-icons'
import categoryList from '@/assets/site/categories.json'
import { useUser } from '@/context/userContext'
import { useGStatus } from '@/context/globalContext'

// Must fetch here
import introImage from '@/assets/site/intro.webp';
import Head from 'next/head'
const categoryImages = categoryList.map((cate) => require('@/assets/categoryImages/' + cate.Image));

const Home = () => {
  // Use global context
  const { handleGStatus } = useGStatus();
  // Use user context
  const { userData } = useUser();

  return (
    <Template>
      <Head>
        <meta name="description" content="İş ilanı verin veya serbest çalışmaya başlayın. Ustalarla konuşup anlaşın. Kombi tamiri, ev tadilatı, boya badana, hurda satışı ve dahası." />
      </Head>
      <div className='index-page'>
        <div className="intro">
          <div className="intro-content">
            <h1>Zanaat <span className='red'>Sanattır.</span><br />Zanaat Han&apos;a Hoşgeldiniz!</h1>
            <p>
              Zanaat Han, tamir tadilat ilanı verme ve usta arama sürecini kolaylaştırarak aradığınız nitelikte ustaya ulaşabilmenizi sağlamak amacıyla oluşturulmuştur. Siz ilanınızı verin, ustalar sizi bulsun.
            </p>
            <div className="intro-buttons">
              <Link href='/yeni-ilan' rel='nofollow' className='intro-button-1'>Yeni ilan oluştur <Plus className='icon' /></Link>
              {/* When we disable post creation without account
              onClick={(e) => {
                if (!userData) {
                  e.preventDefault()
                  handleGStatus('authModalActive', 'signin')
                }
              }}*/}
              {/* coming soon
              <button className='intro-button-2'>İş ara</button>*/}
            </div>
          </div>
          <Image
            src={introImage}
            priority={true}
            unoptimized={true}
            className='intro-image'
            alt={'Intro image'} />
        </div>
        <div className='category-list-heading-container'>
          <h2>Hizmetler</h2>
        </div>
        <div className="category-list">
          {categoryList.map((cate, i) => {
            return (
              <Link href={'/' + cate.Code} className='category-card' key={i}>
                <div className="category-image">
                  <Image
                    src={categoryImages[i]}
                    unoptimized={true}
                    alt={cate.Name} />
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

export default Home