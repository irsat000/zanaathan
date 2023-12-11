
import Template from '@/components/template'
import Image from 'next/image'
import { ImageFill as ImageFillIcon, PlusSquareFill } from 'react-bootstrap-icons'
import Link from 'next/link'
import categoryList from '@/assets/site/categories.json'
import { useEffect, useState } from 'react'
import { NPFormData, NP_Thumbnails } from '@/components/npThumbnails'
import { apiUrl } from '@/lib/utils/helperUtils'
import { fetchJwt } from '@/lib/utils/userUtils'
import { City, District, fetchAndCacheCities, fetchAndCacheDistricts, getSubsByCategory } from '@/lib/utils/fetchUtils'
//import ReactQuill from 'react-quill';
import dynamic from 'next/dynamic'
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false }); // ReactQuill doesn't work on server side, ssr is no good
import 'react-quill/dist/quill.snow.css';
import { useGStatus } from '@/context/globalContext'


interface SubCategory {
  Id: number;
  Name: string;
}

export default function NewPost() {
  // Use global context
  const { handleGStatus } = useGStatus();

  // Create post payload
  const [formData, setFormData] = useState<NPFormData>({
    title: '',
    subCategory: '0',
    district: '0',
    selectedImages: []
  });
  const [description, setDescription] = useState('');


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
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return
    let above10MB: number[] = [];

    // Check if more than 10 files
    if (files.length + formData.selectedImages.length > 10) {
      handleGStatus('informationModal', {
        type: 'error',
        text: 'En fazla 10 fotoğraf yüklenebilir.'
      })
      return;
    }

    // New array of files
    const newImages: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as File | null;
      if (file && file.size > 1024 * 1024 * 10) {
        above10MB.push(i);
      } else if (file) {
        newImages.push(file);
      }
    }

    // Push to the selectedImages
    setFormData({
      ...formData,
      selectedImages: [...formData.selectedImages, ...newImages]
    });

    if (above10MB.length > 0) {
      handleGStatus('informationModal', {
        type: 'error',
        text: `${above10MB.length} adet fotoğraf 10 MB'dan büyük olduğu için eklenmedi.`
      })
    }
  };
  // Change the dependencies of payload, city and category
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



  const [creatingPost, setCreatingPost] = useState<boolean | null>(null);

  // Send form
  const handleNewPostSubmit = (e: any) => {
    e.preventDefault();

    // Basic validation
    if (formData.title.length < 5 || formData.title.length > 255
      || description.length < 50 || description.length > 2000
      || formData.subCategory === '0' || formData.district === '0'
    ) {
      handleGStatus('informationModal', {
        type: 'error',
        text: `Form geçersiz. Kurallar;<br /><ul>
        <li ${formData.title.length < 5 || formData.title.length > 255 ? 'class="fail"' : ''}>Başlık 5-255 karakter arasında olmalıdır</li>
        <li ${description.length < 50 || description.length > 2000 ? 'class="fail"' : ''}>Açıklama 50-2000 karakter arası olmalıdır</li>
        <li ${formData.subCategory === '0' ? 'class="fail"' : ''}>Kategori seçimi</li>
        <li ${formData.district === '0' ? 'class="fail"' : ''}>Bölge seçimi</li></ul>`
      })
      return;
    }

    const multiPartFormData = new FormData();
    multiPartFormData.append('title', formData.title);
    multiPartFormData.append('description', description);
    multiPartFormData.append('subCategory', formData.subCategory);
    multiPartFormData.append('district', formData.district);
    formData.selectedImages.forEach((pic, index) => {
      multiPartFormData.append(`postImages`, pic);
    });

    // Check jwt
    const jwt = fetchJwt();
    if (!jwt) return;

    // LOADING
    setCreatingPost(true);

    fetch(`${apiUrl}/create-post`, {
      method: "POST",
      headers: { 'Authorization': `Bearer ${jwt}` },
      body: multiPartFormData
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        handleGStatus('informationModal', {
          type: 'success',
          text: 'Başarılı! Gönderi onaylandıktan sonra yayınlanacaktır.'
        })
        setCreatingPost(false);
      })
      .catch((res) => {
        let errorMessage = 'Bağlantıda hata.'
        if (res.status === 400) {
          errorMessage = 'Form verisi geçersiz, gönderi oluşturulamadı.'
        } else if (res.status === 413) {
          errorMessage = `Fotoğraf çok büyük. İşlenmiş fotoğraf boyutu en fazla 5 MB olabilir.`
        } else if (res.status === 417) {
          errorMessage = `En fazla 10 fotoğraf yüklenebilir.`
        } else if (res.status === 401) {
          errorMessage = `Giriş yapmanız gerekmektedir.`
        }
        handleGStatus('informationModal', {
          type: 'error',
          text: errorMessage
        })
        setCreatingPost(null);
      })
  }

  // Resets all values
  const resetForm = () => {
    setFormData({
      title: '',
      subCategory: '0',
      district: '0',
      selectedImages: []
    });
    setDescription('');
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
            <div className='description-container'>
              <ReactQuill theme="snow" value={description} onChange={setDescription} className='np-description' />
            </div>
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
              // We change sub categories here with the new category id
              setSubCategories(getSubsByCategory(e.target.value));
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
              {districtsAll.get(extraData.city)?.map((district, i) =>
                <option key={i} value={district.Id}>{district.Name}</option>
              )}
            </select>
            <button type='submit' className='submit-button' disabled={creatingPost === null ? false : true}>
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
