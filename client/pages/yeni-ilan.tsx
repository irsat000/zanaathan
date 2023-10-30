
import Template from '@/components/template'
import Image from 'next/image'
import { ImageFill as ImageFillIcon, PlusSquareFill } from 'react-bootstrap-icons'
import Link from 'next/link'
import categoryList from '@/assets/site/categories.json'


export default function NewPost() {
  return (
    <Template>
      <div className="new-post-page">
        <h2 className='new-post-heading'>Yeni İlan</h2>
        <form className="new-post-form" onSubmit={(e) => e.preventDefault()}>
          <div className="np-primary">
            <input className='np-title' type='text' name='title' placeholder='Başlık' />
            <textarea className='np-description' name='description' placeholder='Açıklama'></textarea>
            <div className="np-thumbnail-wrapper"></div>
            <label className='np-image-upload'>
              <input type='file' />
              <span className='icon'>
                <ImageFillIcon />
                <PlusSquareFill />
              </span>
              <span className='text'>Fotoğraf Ekle</span>
            </label>
          </div>
          <div className="np-secondary">
            <select name='category'>
              <option value={'0'}>Kategori</option>
            </select>
            <select name='subCategory'>
              <option value={'0'}>Alt kategori</option>
            </select>
            <select name='city'>
              <option value={'0'}>Şehir</option>
            </select>
            <select name='district'>
              <option value={'0'}>İlçe</option>
            </select>
            <button type='submit' className='submit-button'>
              Paylaş
            </button>
            <button type='reset' className='reset-button'>
              Temizle
            </button>
          </div>
        </form>
      </div>
    </Template>
  )
}
