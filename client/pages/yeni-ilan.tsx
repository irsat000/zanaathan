
import Template from '@/components/template'
import { ImageFill as ImageFillIcon, PlusSquareFill } from 'react-bootstrap-icons'
import categoryList from '@/assets/site/categories.json'
import { useEffect, useState } from 'react'
import { NP_Thumbnails } from '@/components/npThumbnails'
import { apiUrl, processImage } from '@/lib/utils/helperUtils'
import { fetchJwt, readJwtCookie } from '@/lib/utils/userUtils'
import { City, District, fetchAndCacheCities, fetchAndCacheDistricts, getSubsByCategory } from '@/lib/utils/fetchUtils'
//import ReactQuill from 'react-quill';
import dynamic from 'next/dynamic'
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false }); // ReactQuill doesn't work on server side, ssr is no good
import 'react-quill/dist/quill.snow.css';
import { useGStatus } from '@/context/globalContext'
//import { checkUnallowed } from '@/lib/utils/nsfwjsUtils'
import { checkProfanity } from '@/lib/utils/profanityUtils'
import Router from 'next/router'
import { useUser } from '@/context/userContext'


export interface NPFormData {
  title: string,
  category: string,
  subCategory: string,
  district: string,
  selectedImages: File[]
}

interface SubCategory {
  Id: number;
  Name: string;
}

export default function NewPost() {
  // Use global context
  const { handleGStatus } = useGStatus();
  // User context
  const { userData } = useUser();

  // Allow anonymous for now
  // Redirect to index if user did not log in
  /*useEffect(() => {
    const info = readJwtCookie();
    if (!info) {
      Router.push('/')
    }
  }, []);*/

  // Create post payload
  const [formData, setFormData] = useState<NPFormData>({
    title: '',
    category: '0',
    subCategory: '0',
    district: '0',
    selectedImages: []
  });
  const [description, setDescription] = useState('');


  // Extra data that's used for user experience.
  // Example: City selection changing or disabling district select
  const [extraData, setExtraData] = useState({
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
    if (!files) return;

    // Check if more than 10 files
    if (files.length + formData.selectedImages.length > 4) {
      handleGStatus('informationModal', {
        type: 'error',
        text: 'En fazla 4 fotoğraf yüklenebilir.'
      })
      return;
    }

    // New array of files
    const newImages: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as File | null;
      if (file) {
        newImages.push(file);
      }
    }

    // Push to the selectedImages
    setFormData({
      ...formData,
      selectedImages: [...formData.selectedImages, ...newImages]
    });

    // Reset the input field to prevent bugs
    e.target.value = '';
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

  // SUBMIT LOADING
  const [creatingPost, setCreatingPost] = useState<boolean | null>(null);

  // Send form
  const handleNewPostSubmit = async (e: any) => {
    e.preventDefault();

    // Basic validation
    if (formData.title.trim().length < 5 || formData.title.trim().length > 255
      || description.trim().length < 10 || description.trim().length > 2000
      || formData.category === '0' || formData.district === '0'
    ) {
      handleGStatus('informationModal', {
        type: 'error',
        text: `Form geçersiz. Kurallar;<br /><ul>
        <li ${formData.title.trim().length < 5 || formData.title.trim().length > 255 ? 'class="fail"' : ''}>Başlık 5-255 karakter arasında olmalıdır</li>
        <li ${description.trim().length < 10 || description.trim().length > 2000 ? 'class="fail"' : ''}>Açıklama 10-2000 karakter arası olmalıdır</li>
        <li ${formData.category === '0' ? 'class="fail"' : ''}>Kategori seçimi</li>
        <li ${formData.district === '0' ? 'class="fail"' : ''}>Bölge seçimi</li></ul>`
      });
      return;
    }

    // Image control loading info
    handleGStatus('informationModal', {
      type: 'loading',
      text: 'İşleminiz devam ediyor, lütfen bekleyiniz...'
    });
    // Check if the title or description contains profanity
    /*if (checkProfanity([formData.title, description])) {
      handleGStatus('informationModal', {
        type: 'error',
        text: 'Başlıkta veya açıklamada uygunsuz kelime tesbit edildi.'
      });
      return;
    }*/
    // Image processing for less traffic
    const imagePromises = formData.selectedImages.map(processImage);
    const processedImages = await Promise.all(imagePromises);
    // Check if proccessed images have any error
    if (processedImages.some(img => !img)) {
      handleGStatus('informationModal', {
        type: 'error',
        text: 'Fotoğraflar üzerinde çalışılırken hata oluştu, üzgünüz.'
      });
      return;
    }
    // If image size reduction failed, get the replace with the old one
    // NEEDS A FIX, A LIBRARY WOULD BE BETTER FOR SIZE REDUCTION
    for (let i = 0; i < processedImages.length; i++) {
      if (processedImages[i].size > formData.selectedImages[i].size) {
        processedImages[i] = formData.selectedImages[i];
      }
    }
    // Check if any image is bigger than 5 mb
    if (processedImages.some(img => img.size > 1000 * 1000 * 5)) {
      handleGStatus('informationModal', {
        type: 'error',
        text: '5 MB altı fotoğraflar yüklenebilir.'
      });
      return;
    };

    // Check if the images contain inappropriate content
    /*const inappropriate = await checkUnallowed(processedImages as File[])
    if (inappropriate) {
      handleGStatus('informationModal', {
        type: 'error',
        text: 'Uygunsuz içerikli fotoğraf tesbit edildi.'
      });
      return;
    }
    handleGStatus('informationModal', null);*/

    // Create multipart form data (necessary for image upload)
    const multiPartFormData = new FormData();
    multiPartFormData.append('title', formData.title);
    multiPartFormData.append('description', description);
    multiPartFormData.append('category', formData.category);
    multiPartFormData.append('subCategory', formData.subCategory);
    multiPartFormData.append('district', formData.district);
    processedImages.forEach(picFile => multiPartFormData.append('postImages', picFile));

    // Check jwt
    const jwt = fetchJwt();
    // if (!jwt) return; // Allow anonymous upload

    // LOADING
    setCreatingPost(true);

    fetch(`${apiUrl}/create-post`, {
      method: "POST",
      headers: { 'Authorization': `Bearer ${jwt}` },
      body: multiPartFormData
    })
      .then(res => {
        if (res.ok) {
          let successMessage = "Başarılı! Gönderi onaylandıktan sonra yayınlanacaktır.";
          if (!userData) {
            successMessage = "Başarılı! Gönderiniz onaylandıktan sonra yayınlanacak ve 14 gün sonra tamamlandı olarak güncellenecektir. Bir hesap ile bu süreyi dilediğiniz kadar uzatabilirsiniz."
          }
          handleGStatus('informationModal', {
            type: 'success',
            text: successMessage
          })
          setCreatingPost(false);
        }
        else Promise.reject(res);
      })
      .catch((res) => {
        let errorMessage = 'Bağlantıda hata.'
        if (res.status === 400) {
          errorMessage = 'Form verisi geçersiz, gönderi oluşturulamadı.'
        } else if (res.status === 403) {
          errorMessage = `Günde en fazla 3 gönderi oluşturabilirsiniz.`
        } else if (res.status === 413) {
          errorMessage = `En az bir fotoğraf çok büyük.`
        } else if (res.status === 417) {
          errorMessage = `En fazla 4 fotoğraf yüklenebilir.`
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
      category: '0',
      subCategory: '0',
      district: '0',
      selectedImages: []
    });
    setDescription('');
    setExtraData({
      city: '0'
    });
    setSubCategories([]);
  };


  return (
    <Template>
      <div className="new-post-page">
        <h2 className='new-post-heading'>Yeni İlan</h2>
        <form className="new-post-form" onSubmit={handleNewPostSubmit}>
          <div className="np-primary">
            <input className='np-title' type='text' name='title' placeholder='Başlık' onChange={handleFormChange} />
            {!userData ?
              <span className='note'>(Kayıt olmadan yaptığınız gönderilerde iletişim bilgilerinizi açıklamaya yazınız.)</span>
              :
              <span className='note'>(Hesabınıza iletişim seçeneği eklemediyseniz iletişim bilgilerinizi açıklamaya yazabilirsiniz.)</span>}
            <div className='description-container'>
              <ReactQuill placeholder='Açıklama' theme="snow" value={description} onChange={setDescription} className='np-description' />
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
            <span className='image-upload-note'>Not: İlk sıradaki birincil fotoğraf olarak seçilir. Basılı tutup, sürükleyerek fotoğraf sırasını değiştirebilirsiniz.</span>
            <span className='image-upload-note'>Not 2: Her biri 5 Megabyte&apos;ın altında olmak üzere en fazla 4 fotoğraf yükleyebilirsiniz.</span>
          </div>
          <div className="np-secondary">
            <select name='category' onChange={(e) => {
              handleFormChange(e); // For reset
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
