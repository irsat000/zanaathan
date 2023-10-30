
import Template from '@/components/template'
import Image from 'next/image'
import { ImageFill as ImageFillIcon, PlusSquareFill } from 'react-bootstrap-icons'
import Link from 'next/link'
import categoryList from '@/assets/site/categories.json'
import { useEffect, useState } from 'react'
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

interface City {
  Id: number;
  Name: string;
}

interface SubCategory {
  Id: number;
  Name: string;
}

interface District {
  Id: number;
  Name: string;
}

interface DistrictCache {
  Id: number;
  Districts: District[]
}

export default function NewPost() {
  // Create post payload
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subCategory: '0',
    district: '0',
  });

  // Extra data that's used for user experience.
  // Example: City selection changing or disabling district select
  const [extraData, setExtraData] = useState({
    category: '0',
    city: '0'
  });

  // Sub categories depending on category Id
  const [subCategories, setSubCategories] = useState<SubCategory[] | null>(null);

  // Get cities
  const [fetchedCities, setFetchedCities] = useState<City[] | null>(null);
  useEffect(() => {
    fetch(`${apiUrl}/api/get-cities`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        setFetchedCities(data.cities);
      })
      .catch((res) => console.log('Sunucuda hata'));
  }, []);

  // Districts depending on City Id
  const [districtsCache, setDistrictsCache] = useState<DistrictCache[]>([]);

  // Get districts
  // Get only the selected city's districts and cache them with DistrictCache model
  const fetchDistricts = (cityId: string) => {
    // Ignore if city is cached or default value of '0'
    if (cityId === '0') return;
    else if (districtsCache.find((cache) => cache.Id.toString() === cityId)) return;

    fetch(`${apiUrl}/api/get-districts?city_id=${cityId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        // Create a new DistrictCache object for the city and add it to the existing array
        const newDistrictCache = {
          Id: Number(cityId),
          Districts: data.districts
        };

        // Update the state by adding the new DistrictCache object
        setDistrictsCache((prev) => [...prev, newDistrictCache]);
      })
      .catch((res) => console.log('Sunucuda hata'));
  }





  // Send form
  const handleNewPostSubmit = (e: any) => {
    e.preventDefault();

  }

  // Change the payload
  const handleFormChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }
  // Change the dependencies of payload
  const handleExtraChange = (e: any) => {
    setExtraData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  // Resets all values
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subCategory: '0',
      district: '0',
    });
    setExtraData({
      category: '0',
      city: '0'
    });
    setSubCategories(null);
  };

  return (
    <Template>
      <div className="new-post-page">
        <h2 className='new-post-heading'>Yeni İlan</h2>
        <form className="new-post-form" onSubmit={handleNewPostSubmit}>
          <div className="np-primary">
            <input className='np-title' type='text' name='title' placeholder='Başlık' onChange={handleFormChange} />
            <textarea className='np-description' name='description' placeholder='Açıklama' onChange={handleFormChange}></textarea>
            <div className="np-thumbnail-wrapper"></div>
            <label className='np-image-upload'>
              {/*<input type='file' />*/}
              <span className='icon'>
                <ImageFillIcon />
                <PlusSquareFill />
              </span>
              <span className='text'>Fotoğraf Ekle</span>
            </label>
          </div>
          <div className="np-secondary">
            <select name='category' onChange={(e) => {
              handleExtraChange(e); // For reset
              // We change sub categories here with the latest value
              const category = categoryList.find(cate => cate.Id.toString() === e.target.value);
              setSubCategories(category?.SubCategories ?? null);
            }}>
              <option value={'0'}>Kategori</option>
              {categoryList.map((cate, i) => <option key={i} value={cate.Id}>{cate.Name}</option>)};
            </select>
            <select name='subCategory' onChange={handleFormChange} disabled={!subCategories}>
              <option value={'0'}>Alt kategori</option>
              {subCategories && subCategories.map((sub, i) => <option key={i} value={sub.Id}>{sub.Name}</option>)}
            </select>
            <select name='city' onChange={(e) => {
              handleExtraChange(e);
              fetchDistricts(e.target.value);
            }}>
              <option value={'0'}>Şehir</option>
              {fetchedCities && fetchedCities.map((city, i) => <option key={i} value={city.Id}>{city.Name}</option>)}
            </select>
            <select name='district' onChange={handleFormChange} disabled={extraData.city === '0'}>
              <option value={'0'}>İlçe</option>
              {districtsCache.find((cache) => cache.Id.toString() === extraData.city)?.Districts.map((district, i) =>
                <option key={i} value={district.Id}>{district.Name}</option>
              )}
            </select>
            <button type='submit' className='submit-button'>
              Paylaş
            </button>
            <button type='reset' className='reset-button' onClick={resetForm}>
              Temizle
            </button>
          </div>
        </form>
      </div>
    </Template>
  )
}
