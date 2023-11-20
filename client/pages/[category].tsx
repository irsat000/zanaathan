
import Template from '@/components/template'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Search, XLg } from 'react-bootstrap-icons'
import categoryList from '@/assets/site/categories.json'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { apiUrl, formatSecondsAgo, postImageLink } from '@/lib/utils/helperUtils'
import { City, District, fetchAndCacheCities, fetchAndCacheDistricts } from '@/lib/utils/fetchUtils'

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

  // Get cities
  const [fetchedCities, setFetchedCities] = useState<City[]>([]);
  useEffect(() => {
    fetchAndCacheCities().then(data => {
      if (data) setFetchedCities(data);
    });
  }, []);
  // Districts depending on City Id
  const [districtsAll, setDistrictsAll] = useState<Map<string, District[]>>(new Map());
  // Get the selected city's districts, keep the previously fetched districts for future use
  const fetchDistricts = (cityId: string) => {
    fetchAndCacheDistricts(cityId, districtsAll).then(data => {
      if (data) setDistrictsAll(data);
    });
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

  const [filterData, setFilterData] = useState<{
    subcategory: number[],
    city: number,
    district: number,
  }>({
    subcategory: [],
    city: 0,
    district: 0,
  });

  // Change the filters utility
  const handleFilterChange = (e: any) => {
    setFilterData({
      ...filterData,
      [e.target.name]: e.target.value
    });
  }
  // Change city id, reset the district, and close the select2
  const handleCityChange = (cityId: number) => {
    setFilterData({
      ...filterData,
      city: cityId,
      district: 0
    });
    toggleCitySelect();
  }
  // Change district id and close the select2
  const handleDistrictChange = (districtId: number) => {
    setFilterData({
      ...filterData,
      district: districtId
    });
    toggleDistrictSelect();
  }

  // Get names for filter modal
  const selectedCity = fetchedCities.find(c => c.Id === filterData.city);
  const selectedCityName = selectedCity?.Name ?? 'Şehir seç';
  const selectedDistrict = districtsAll.get(filterData.city.toString())?.find(d => d.Id == filterData.district);
  const selectedDistrictName = selectedDistrict?.Name ?? 'İlçe seç';

  const handleSubCateChange = (val: number) => {
    if (filterData.subcategory.includes(val)) {
      setFilterData({
        ...filterData,
        subcategory: filterData.subcategory.filter(cate => cate !== val)
      });
    } else {
      setFilterData({
        ...filterData,
        subcategory: [...filterData.subcategory, val]
      });
    }
  };

  console.log(filterData.subcategory);

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
              // TODO: Deactivate all except this one, or choose all of them
            }} /><span>Hepsi</span></label>
            {categoryInfo.subCates.map((c, i) => {
              return <label key={i} className='sub-category-label'>
                <input
                  type='checkbox'
                  checked={filterData.subcategory.includes(c.Id)}
                  onChange={() => handleSubCateChange(c.Id)}
                />
                <span>{c.Name}</span>
              </label>;
            })}
          </div>
          <span className="f-heading">Bölge Seç</span>
          <div className="f-container">
            <div className={`select2 ${citySelectActive ? 'list-active' : ''}`}>
              <span className='s2-chosen' onClick={toggleCitySelect}>{selectedCityName}<ChevronDown /></span>
              <div className='option-container'>
                <div className='option-search-container'>
                  <input type='text' placeholder='Ara' className='option-search' />
                  <Search />
                </div>
                <ul className="option-list">
                  <li onClick={() => {
                    handleCityChange(0);
                  }}>Şehir seç</li>
                  {fetchedCities.map((city, i) => <li key={i} onClick={() => {
                    fetchDistricts(city.Id.toString());
                    handleCityChange(city.Id);
                  }}>{city.Name}</li>)}
                </ul>
              </div>
            </div>
            {filterData.city !== 0 ?
              <div className={`select2 ${districtSelectActive ? 'list-active' : ''}`}>
                <span className='s2-chosen' onClick={toggleDistrictSelect}>{selectedDistrictName}<ChevronDown /></span>
                <div className='option-container'>
                  <div className='option-search-container'>
                    <input type='text' placeholder='Ara' className='option-search' />
                    <Search />
                  </div>
                  <ul className="option-list">
                    <li onClick={() => {
                      handleDistrictChange(0);
                    }}>İlçe seç</li>
                    {filterData.city ? districtsAll.get(filterData.city.toString())?.map((district, i) =>
                      <li key={i} onClick={() => {
                        handleDistrictChange(district.Id);
                      }}>{district.Name}</li>
                    ) : <></>}
                  </ul>
                </div>
              </div>
              : <></>}
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
              <option value='old'>Eski</option>
              <option value='new'>Yeni</option>
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
                      loader={() => postImageLink(post.MainImage!)}
                      unoptimized={true}
                      priority={true}
                      src={postImageLink(post.MainImage)}
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
