
import Template from '@/components/template'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Search, XLg } from 'react-bootstrap-icons'
import categoryList from '@/assets/site/categories.json'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { apiUrl, formatSecondsAgo, imageLink } from '@/utils/helperUtils'

interface Post {
  Id: number;
  Title: string;
  SecondsAgo: number;
  MainImage: string | null;
  ImageError: undefined | boolean;
}

export default function Category() {
  // Get category from path
  const router = useRouter();
  const { category } = router.query;

  // This state is for filters
  const [categoryInfo, setCategoryInfo] = useState<{
    code: string | null,
    name: string | null,
    subCates: Array<{
      Id: number;
      Name: string;
    }>
  }>({ code: null, name: null, subCates: [] });

  // Get category info by category code
  useEffect(() => {
    if (!category) return;

    // Get name by searching with code in category list from categories.json file
    // and assign both to categoryInfo
    const categoryObj = categoryList.find(cate => cate.Code === category);
    if (categoryObj) {
      const code = categoryObj.Code;
      const name = categoryObj.Name;
      const subCates = categoryObj.SubCategories;
      setCategoryInfo({ code, name, subCates });
    }
  }, [category]);

  // Fetch posts
  const [postList, setPostList] = useState<Post[]>([]);
  useEffect(() => {
    if (!category) return;

    fetch(`${apiUrl}/get-posts`, {
      method: "GET",
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        setPostList(data.posts);
      })
      .catch((res) => console.log('Sunucuda hata'));
  }, [category])

  // Filter values
  const [filterModalActive, setFilterModalActive] = useState(false);
  const [citySelectActive, setCitySelectActive] = useState(false);
  const [districtSelectActive, setDistrictSelectActive] = useState(false);


  // Close selects
  const closeSelects = () => {
    if (citySelectActive) {
      setCitySelectActive(false);
    }
    if (districtSelectActive) {
      setDistrictSelectActive(false);
    }
  }

  // Toggle selects
  const toggleCitySelect = () => {
    closeSelects();
    setCitySelectActive(!citySelectActive);
  }
  const toggleDistrictSelect = () => {
    closeSelects();
    setDistrictSelectActive(!districtSelectActive);
  }

  // Upon closing filter modal
  const handleFilterModalClose = () => {
    setFilterModalActive(false);
    closeSelects();
  }

  // Detect click on the filter modal
  const handleFilterModalClick = (e: any) => {
    if (!e.target.closest('.select2')) {
      closeSelects();
    }
  }

  return (
    <Template>
      <div className={`filter-modal-container modal-container ${filterModalActive && 'active'}`} onMouseDown={handleFilterModalClose}>
        <div className="filter-modal" onMouseDown={(e) => {
          e.stopPropagation();
          // On mouse down to prevent accidental swipe to outside option-container
          // SAME AS ALL OUTSIDE CLICKS
          handleFilterModalClick(e);
        }}>
          <button type='button' className='close-modal-button' onClick={handleFilterModalClose}><XLg /></button>
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
            <div className={`select2 ${citySelectActive && 'list-active'}`}>
              <span className='s2-chosen' onClick={toggleCitySelect}>Şehir seç<ChevronDown /></span>
              <div className='option-container'>
                <div className='option-search-container'>
                  <input type='text' placeholder='Ara' className='option-search' />
                  <Search />
                </div>
                <ul className="option-list">
                  <li>Adana</li>
                  <li>Antalya</li>
                  <li>Balıkesir</li>
                  <li>Bursa</li>
                  <li>İstanbul</li>
                  <li>Muş</li>
                  <li>Kahramanmaraş</li>
                </ul>
              </div>
            </div>
            <div className={`select2 ${districtSelectActive && 'list-active'}`}>
              <span className='s2-chosen' onClick={toggleDistrictSelect}>İlçe seç<ChevronDown /></span>
              <div className='option-container'>
                <div className='option-search-container'>
                  <input type='text' placeholder='Ara' className='option-search' />
                  <Search />
                </div>
                <ul className="option-list">
                  <li>Yıldırım</li>
                  <li>Osmangazi</li>
                  <li>Orhangazi</li>
                  <li>İnegöl</li>
                  <li>Nilüfer</li>
                </ul>
              </div>
            </div>
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
          {postList.map((post, i) =>
            <div className="post" key={post.Id}>
              <Link href={`/${categoryInfo.code}/${post.Id}`} className='post-link'>
                <div className="post-image-carousel">
                  {post.MainImage && !post.ImageError ?
                    <Image
                      loader={() => imageLink(post.MainImage!)}
                      unoptimized={true}
                      priority={true}
                      src={imageLink(post.MainImage)}
                      alt={`${i + 1}. ilanın birincil fotoğrafı`}
                      width={0}
                      height={0}
                      onError={() => {
                        // Set ImageError to true if the image is not found
                        const updatedPostList = postList.map((p) => {
                          if (p.Id === post.Id) {
                            return { ...p, ImageError: true };
                          }
                          return p;
                        });
                        setPostList(updatedPostList);
                      }}
                    />
                    :
                    <div className="image-error"><span>Fotoğraf yok</span></div>
                  }
                </div>
                <h4 className='title'>{post.Title}</h4>
              </Link>
              <span className="date">{formatSecondsAgo(post.SecondsAgo)}</span>
            </div>
          )}
        </div>



      </div>
    </Template>
  )
}
