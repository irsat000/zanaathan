
import Template from '@/components/template'
import Image from 'next/image'
import { ImageFill as ImageFillIcon, PlusSquareFill } from 'react-bootstrap-icons'
import Link from 'next/link'
import categoryList from '@/assets/site/categories.json'
import { useEffect, useState } from 'react'
import { NPFormData, NP_Thumbnails } from '@/components/npThumbnails'
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

export default function NewPost() {
  // Create post payload
  const [formData, setFormData] = useState<NPFormData>({
    title: '',
    description: '',
    subCategory: '0',
    district: '0',
    selectedImages: []
  });

  // Extra data that's used for user experience.
  // Example: City selection changing or disabling district select
  const [extraData, setExtraData] = useState({
    category: '0',
    city: '0'
  });

  // Change the payload
  const handleFormChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }
  // Change the selectedAmages from formData
  const handleImageChange = (e: any) => {
    const newImages: File[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      if (file) {
        newImages.push(file);
      }
    }
    setFormData({
      ...formData,
      selectedImages: [...formData.selectedImages, ...newImages]
    });
  };
  // Change the dependencies of payload
  const handleExtraChange = (e: any) => {
    setExtraData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  // Sub categories depending on category Id
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  // Get cities
  const [fetchedCities, setFetchedCities] = useState<City[]>([]);
  useEffect(() => {
    // Check if the data is already cached in local storage
    const cachedCities = localStorage.getItem('cachedCities');

    if (cachedCities) {
      // If cached data exists, parse it and set it in the state
      setFetchedCities(JSON.parse(cachedCities));
    } else {
      fetch(`${apiUrl}/get-cities`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then((data) => {
          // Set the data in the state
          setFetchedCities(data.cities);
          // Cache the data in local storage for future use
          localStorage.setItem('cachedCities', JSON.stringify(data.cities));
        })
        .catch((res) => console.log('Sunucuda hata'));
    }
  }, []);

  // Districts depending on City Id
  const [districtsAll, setDistrictsAll] = useState<Map<number, District[]>>(new Map());

  // Get the selected city's districts, keep the previously fetched districts for future use
  const fetchDistricts = (cityId: string) => {
    // Ignore if city is set or default value of '0'
    if (cityId === '0') return;
    else if (districtsAll.has(Number(cityId))) return;

    // Check if the data is in localStorage this time
    const cachedData = localStorage.getItem(`cachedDistricts_${cityId}`);
    if (cachedData) {
      // If data is found in localStorage, update the state with the cached data
      const parsedData = JSON.parse(cachedData);
      const updatedDistrictsAll = new Map(districtsAll);
      updatedDistrictsAll.set(Number(cityId), parsedData);
      setDistrictsAll(updatedDistrictsAll);
    } else {
      fetch(`${apiUrl}/get-districts?city_id=${cityId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then((data) => {
          // Make a copy
          const updatedDistrictsAll = new Map(districtsAll);
          // Assign the new values
          updatedDistrictsAll.set(Number(cityId), data.districts);
          // Update the state
          setDistrictsAll(updatedDistrictsAll);
          // Update the cache in localStorage
          localStorage.setItem(`cachedDistricts_${cityId}`, JSON.stringify(data.districts));
        })
        .catch((res) => console.log('Sunucuda hata'));
    }
  }





  // Send form
  const handleNewPostSubmit = (e: any) => {
    e.preventDefault();

    const multiPartFormData = new FormData();
    multiPartFormData.append('title', formData.title);
    multiPartFormData.append('description', formData.description);
    multiPartFormData.append('subCategory', formData.subCategory);
    multiPartFormData.append('district', formData.district);
    formData.selectedImages.forEach((pic, index) => {
      multiPartFormData.append(`postImages`, pic);
    });

    fetch(`${apiUrl}/create-post`, {
      method: "POST",
      body: multiPartFormData
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        console.log(data.postId);
      })
      .catch((res) => {
        if (res.status === 400) {
          alert("Geçersiz form verisi")
        } else console.log('Sunucuyla bağlantıda hata')
      });
  }

  // Resets all values
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subCategory: '0',
      district: '0',
      selectedImages: []
    });
    setExtraData({
      category: '0',
      city: '0'
    });
    setSubCategories([]);
  };

  // Drag starts and sets the dragged object's index
  /*const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };*/

  // Sets the index that's hovered upon to find where it's dropped
  /*const handleDragEnter = throttle((index: number) => {
    setHoverIndex(index);
  }, 200);*/

  return (
    <Template>
      <div className="new-post-page">
        <h2 className='new-post-heading'>Yeni İlan</h2>
        <form className="new-post-form" onSubmit={handleNewPostSubmit}>
          <div className="np-primary">
            <input className='np-title' type='text' name='title' placeholder='Başlık' onChange={handleFormChange} />
            <textarea className='np-description' name='description' placeholder='Açıklama' onChange={handleFormChange}></textarea>
            <NP_Thumbnails formData={formData} setFormData={setFormData} />
            <label className='np-image-upload'>
              <input type='file'
                accept="image/*"
                multiple
                onChange={handleImageChange} />
              <span className='icon'>
                <ImageFillIcon />
                <PlusSquareFill />
              </span>
              <span className='text'>Fotoğraf Ekle</span>
            </label>
            <span className='image-upload-note'>Not: İlk sıradaki birincil fotoğraf olarak seçilir. Sürükleyip fotoğraf sırasını değiştirebilirsiniz.</span>
          </div>
          <div className="np-secondary">
            <select name='category' onChange={(e) => {
              handleExtraChange(e); // For reset
              // We change sub categories here with the latest value
              const category = categoryList.find(cate => cate.Id.toString() === e.target.value);
              setSubCategories(category?.SubCategories ?? []);
            }}>
              <option value={'0'}>Kategori</option>
              {categoryList.map((cate, i) => <option key={i} value={cate.Id}>{cate.Name}</option>)};
            </select>
            <select name='subCategory' onChange={handleFormChange} disabled={subCategories.length === 0}>
              <option value={'0'}>Alt kategori</option>
              {subCategories.map((sub, i) => <option key={i} value={sub.Id}>{sub.Name}</option>)}
            </select>
            <span className='seperator'></span>
            <select name='city' onChange={(e) => {
              handleExtraChange(e);
              fetchDistricts(e.target.value);
            }}>
              <option value={'0'}>Şehir</option>
              {fetchedCities.map((city, i) => <option key={i} value={city.Id}>{city.Name}</option>)}
            </select>
            <select name='district' onChange={handleFormChange} disabled={extraData.city === '0'}>
              <option value={'0'}>İlçe</option>
              {districtsAll.get(Number(extraData.city))?.map((district, i) =>
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