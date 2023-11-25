
import Template from '@/components/template'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Search, XLg } from 'react-bootstrap-icons'
import categoryList from '@/assets/site/categories.json'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { apiUrl, formatSecondsAgo, postImageLink } from '@/lib/utils/helperUtils'
import { City, District, fetchAndCacheCities, fetchAndCacheDistricts } from '@/lib/utils/fetchUtils'

export interface Post {
  Id: number;
  Title: string;
  SecondsAgo: number;
  MainImage: string | null;
  ImageError: undefined | boolean;
}

export default function Category() {
  // Get category from path
  const router = useRouter();
  const { category, subc, city, district, sortby } = router.query;

  // This state is for filters
  const [categoryInfo, setCategoryInfo] = useState<{
    id: number | null,
    code: string | null,
    name: string | null,
    subCates: Array<{
      Id: number;
      Name: string;
    }>
  }>({ id: null, code: null, name: null, subCates: [] });

  // Get category info by category code
  useEffect(() => {
    if (!category) return;

    // Get name by searching with code in category list from categories.json file
    // and assign both to categoryInfo
    const categoryObj = categoryList.find(cate => cate.Code === category);
    if (categoryObj) {
      const id = categoryObj.Id;
      const code = categoryObj.Code;
      const name = categoryObj.Name;
      const subCates = categoryObj.SubCategories;
      setCategoryInfo({ id, code, name, subCates });
    }
  }, [router.query]);

  // Filter data options
  const [filterData, setFilterData] = useState<{
    subcategory: number[],
    city: number,
    district: number,
    sortBy: 'new' | 'old'
  }>({
    subcategory: [],
    city: 0,
    district: 0,
    sortBy: 'old'
  });

  useEffect(() => {
    const subcategoryQuery = Array.isArray(subc)
      ? subc.map(s => parseInt(s, 10))
      : typeof subc === 'string'
        ? [parseInt(subc, 10)]
        : [];
    const cityQuery = city && typeof city === 'string' ? parseInt(city, 10) : 0;
    const districtQuery = district && typeof district === 'string' ? parseInt(district, 10) : 0;
    const sortbyQuery = sortby === 'new' ? 'new' : 'old';

    setFilterData({
      subcategory: subcategoryQuery,
      city: cityQuery,
      district: districtQuery,
      sortBy: sortbyQuery
    });
  }, [router.query])

  // Fetch posts
  const [postList, setPostList] = useState<Post[]>([]);
  useEffect(() => {
    if (!categoryInfo.id) return;
    // Get parameters as a string, e.g. ?subc=1&city=5
    const queryParams = window.location.search;
    // api url + get-posts + category id as path + query parameters
    const fetchPostsUrl = `${apiUrl}/get-posts/${categoryInfo.id}${queryParams}`;
    fetch(fetchPostsUrl, {
      method: "GET",
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        setPostList(data.posts);
      })
      .catch((res) => console.log('Sunucuda hata'));
  }, [categoryInfo])

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
  useEffect(() => {
    if (filterData.city === 0) return;
    fetchAndCacheDistricts(filterData.city.toString(), districtsAll).then(data => {
      if (data) setDistrictsAll(data);
    });
  }, [filterData.city])

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

  // Filter cities by city search change
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const handleCitySearchChange = (e: any) => {
    setCitySearchTerm(e.target.value.toLocaleLowerCase('tr'));
  };
  // Filter districts by district search change
  const [districtSearchTerm, setDistrictSearchTerm] = useState('');
  const handleDistrictSearchChange = (e: any) => {
    setDistrictSearchTerm(e.target.value.toLocaleLowerCase('tr'));
  };
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
    setCitySearchTerm('');
  }
  // Change district id and close the select2
  const handleDistrictChange = (districtId: number) => {
    setFilterData({
      ...filterData,
      district: districtId
    });
    toggleDistrictSelect();
    setDistrictSearchTerm('');
  }
  // Handle sub category
  const handleSubCateChange = (val: number) => {
    setFilterData({
      ...filterData,
      subcategory: filterData.subcategory.includes(val)
        ? filterData.subcategory.filter(cate => cate !== val)
        : [...filterData.subcategory, val]
    });
  };

  // Get names for filter modal
  const selectedCity = fetchedCities.find(c => c.Id === filterData.city);
  const selectedCityName = selectedCity?.Name ?? 'Şehir seç';
  const selectedDistrict = districtsAll.get(filterData.city.toString())?.find(d => d.Id == filterData.district);
  const selectedDistrictName = selectedDistrict?.Name ?? 'İlçe seç';

  // Update the url with new filters
  const handleFilterSubmit = () => {
    const { pathname, query } = router;
    const newParams = {} as any;

    const updatedQuery = { ...query };

    if (filterData.subcategory.length > 0) newParams.subc = filterData.subcategory;
    else delete updatedQuery.subc;

    if (filterData.city !== 0) newParams.city = filterData.city;
    else delete updatedQuery.city;

    if (filterData.district !== 0) newParams.district = filterData.district;
    else delete updatedQuery.district;

    if (filterData.sortBy !== 'old') newParams.sortby = filterData.sortBy;
    else delete updatedQuery.sortby;

    // Use the push method to update the query string
    router.push({
      pathname,
      query: { ...updatedQuery, ...newParams },
    });
  }
  const handleSortByChange = (e: any) => {
    const { pathname, query } = router;
    const newParams = {} as any;
    const updatedQuery = { ...query };

    // Update state but use the sortByVal for up to date value
    const sortByVal = e.target.value;
    setFilterData({
      ...filterData,
      sortBy: sortByVal
    });

    if (sortByVal !== 'old') newParams.sortby = sortByVal;
    else delete updatedQuery.sortby;

    // Use the push method to update the query string
    router.push({
      pathname,
      query: { ...updatedQuery, ...newParams },
    });
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
                  <input type='text' placeholder='Ara' className='option-search' value={citySearchTerm} onChange={handleCitySearchChange} />
                  <Search />
                </div>
                <ul className="option-list">
                  <li onClick={() => {
                    handleCityChange(0);
                  }}>Şehir seç</li>
                  {fetchedCities.map((city, i) =>
                    <li
                      key={i}
                      onClick={() => {
                        handleCityChange(city.Id);
                      }}
                      className={`${citySearchTerm !== '' && !city.Name.toLocaleLowerCase('tr').includes(citySearchTerm) ? 'hidden' : ''}`}
                    >{city.Name}</li>)
                  }
                </ul>
              </div>
            </div>
            {filterData.city !== 0 ?
              <div className={`select2 ${districtSelectActive ? 'list-active' : ''}`}>
                <span className='s2-chosen' onClick={toggleDistrictSelect}>{selectedDistrictName}<ChevronDown /></span>
                <div className='option-container'>
                  <div className='option-search-container'>
                    <input type='text' placeholder='Ara' className='option-search' value={districtSearchTerm} onChange={handleDistrictSearchChange} />
                    <Search />
                  </div>
                  <ul className="option-list">
                    <li onClick={() => {
                      handleDistrictChange(0);
                    }}>İlçe seç</li>
                    {districtsAll.get(filterData.city.toString())?.map((district, i) =>
                      <li
                        key={i}
                        onClick={() => {
                          handleDistrictChange(district.Id);
                        }}
                        className={`${districtSearchTerm !== '' && !district.Name.toLocaleLowerCase('tr').includes(districtSearchTerm) ? 'hidden' : ''}`}
                      >{district.Name}</li>
                    )}
                  </ul>
                </div>
              </div>
              : <></>}
          </div>
          <div className="filter-action-container">
            <button type='button' className="filter-submit" onClick={handleFilterSubmit}>Filtrele</button>
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
            <select onChange={handleSortByChange} value={filterData.sortBy}>
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
                      className='post-image'
                      loader={() => postImageLink(post.MainImage!)}
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
                    <div className="image-error">
                      <Image src={require('@/assets/site/image-not-found.webp')} alt="No image" />
                    </div>
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
