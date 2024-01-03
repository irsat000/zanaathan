
import Template from '@/components/template'
import { useUser } from '@/context/userContext';
import Image from 'next/image'
import Link from 'next/link'
import { ChangeEvent, ChangeEventHandler, useEffect, useRef, useState } from 'react';
import { Post } from './[category]';
import { fetchJwt } from '@/lib/utils/userUtils';
import { apiUrl, avatarLink, formatSecondsAgo, postImageLink, titleToUrl } from '@/lib/utils/helperUtils';
import { ChevronDown, XLg } from 'react-bootstrap-icons';
import GridLoader from 'react-spinners/GridLoader';
import { useGStatus } from '@/context/globalContext';
import { useRouter } from 'next/router';

type CurrentStatus = 1 | 2 | 3 | 5;

interface UserPost extends Post {
  CategoryCode: string;
  CurrentStatusId: CurrentStatus;
  UpdateMenuActive?: boolean;
}
interface ContactInfo {
  Body: string;
  Type: number;
}
const ContactTypes = new Map([
  [1, 'Cep Telefonu'],
  [2, 'İş Telefonu'],
  [3, 'Ev Telefonu'],
  [4, 'E-Posta'],
  [5, 'İnstagram']
]);

export default function Home() {
  const router = useRouter();
  // Use global context
  const { handleGStatus } = useGStatus();
  // Get user context
  const { userData } = useUser();
  //Check login
  useEffect(() => {
    // Check jwt
    const jwt = fetchJwt();
    if (!jwt) {
      router.push('/')
      return
    };
  }, [userData])

  // Fetch profile
  const [postList, setPostList] = useState<UserPost[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [profileLoading, setProfileLoading] = useState<boolean | null>(null);
  useEffect(() => {
    const jwt = fetchJwt();
    if (!jwt) return;
    if (!userData || !userData.sub) return;
    // LOADING
    setProfileLoading(true);
    const fetchProfileUrl = `${apiUrl}/get-user-profile/${userData.sub}`;
    fetch(fetchProfileUrl, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: 'Bearer ' + jwt
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        setPostList(data.posts);
        setContactInfo(data.contactInfo);
      })
      .catch((res) => {
        handleGStatus('informationModal', {
          type: 'error',
          text: 'Profili getirirken hata oluştu. Üzgünüz!'
        });
      })
      .finally(() => {
        setProfileLoading(false);
      });
  }, [userData])

  // Current status map for id and value
  const CSMap = {
    1: 'Cevap bekliyor',
    2: 'Anlaşıldı',
    3: 'Tamamlandı',
    5: 'Onay bekliyor'
  };

  // Check update menus in case one is active, needed for document click
  const updateMenusActive = useRef<boolean>(false);
  updateMenusActive.current = postList.some(p => p.UpdateMenuActive === true);

  // Close update menus if clicked outside
  useEffect(() => {
    const handleDocumentClick = (e: any) => {
      if (!e.target.closest('.update-post') && updateMenusActive.current) {
        setPostList(prev => {
          const updatedPostList = prev.map((p) => {
            return { ...p, UpdateMenuActive: false };
          });
          return updatedPostList;
        });
      }
    };

    // Record clicks
    document.addEventListener("click", handleDocumentClick);

    return () => {
      // Delete event upon component unmount
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  // Update the status of posts with "Cevap bekliyor | Anlaşıldı | Tamamlandı"
  const updateStatus = (postId: number, value: CurrentStatus) => {
    // Check jwt and get necessary items
    const jwt = fetchJwt();
    if (!jwt) return;
    // Payload
    const updatedItem = { newStatusId: value };
    fetch(`${apiUrl}/update-post-status/${postId}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: 'Bearer ' + jwt
      },
      body: JSON.stringify(updatedItem)
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        // Update current status and close update menu on success
        setPostList(prev => {
          const updatedPostList = prev.map((p) => {
            if (p.Id === postId) {
              return { ...p, CurrentStatusId: value, UpdateMenuActive: false };
            }
            return p;
          });
          return updatedPostList;
        });
      })
      .catch((res) => {
        handleGStatus('informationModal', {
          type: 'error',
          text: 'Gönderi güncellenemedi. Üzgünüz!'
        });
      });
  }

  // Contact edit mode
  const [contactInfoEdited, setContactInfoEdited] = useState<ContactInfo[]>([]);
  useEffect(() => {
    setContactInfoEdited(contactInfo);
  }, [contactInfo])

  const [contactEditMode, setContactEditMode] = useState(false);
  const [addNewContactMode, setAddNewContactMode] = useState(false);
  // New contact form
  const [newContactForm, setNewContactForm] = useState({
    body: '',
    type: '0'
  });
  // Update new contact value states
  const handleNewContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewContactForm({
      ...newContactForm,
      [e.target.name]: e.target.value
    })
  }

  // Submit new contact option
  const handleNewContactSubmit = () => {
    // Simple check
    if (newContactForm.body.trim() === '' || newContactForm.type === '0') return;
    // Add new contact
    const updatedList = [...contactInfoEdited]
    updatedList.push({
      Body: newContactForm.body,
      Type: +newContactForm.type
    })
    setContactInfoEdited(updatedList)
    // Reset new contact form
    setNewContactForm({
      body: '',
      type: '0'
    })
    setAddNewContactMode(false);
  }

  // Delete contact option
  const deleteContactOption = (index: number) => {
    const updatedList = [...contactInfoEdited]
    setContactInfoEdited(updatedList.filter((obj, i) => i !== index))
  }

  // Handle close
  const handleCloseContactEditMode = () => {
    setContactEditMode(false);
    setAddNewContactMode(false);
    setContactInfoEdited(contactInfo);
  }

  // LOADING
  const [updatingContacts, setUpdatingContacts] = useState(false);

  // Submit the new contact options as a whole
  const handleContactSubmit = () => {
    if (contactInfo === contactInfoEdited) {
      return;
    }
    // Check jwt
    const jwt = fetchJwt();
    if (!jwt) return;

    setUpdatingContacts(true);
    fetch(`${apiUrl}/update-contact-info`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: 'Bearer ' + jwt
      },
      body: JSON.stringify({ contactInfo: contactInfoEdited })
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        setContactInfo(data.contactInfo);
        handleCloseContactEditMode();
      })
      .catch((res) => {
        handleGStatus('informationModal', {
          type: 'error',
          text: 'İletişim bilgilerinin güncellerken hata oluştu. Üzgünüz!'
        });
      })
      .finally(() => {
        setUpdatingContacts(false);
      });
  }

  return (
    <Template>
      {userData ?
        <div className='profile-page'>
          <div className="profile-panel">
            <div className="personal-info-container">
              <div className="user-avatar">
                {userData.avatar
                  ? <Image
                    loader={() => avatarLink(userData.avatar!)}
                    src={avatarLink(userData.avatar)}
                    alt={'Profile fotoğrafı'}
                    priority={false}
                    width={0}
                    height={0} />
                  : <Image
                    src={require('@/assets/site/user.webp')}
                    alt={'Profil fotoğrafı yok'}
                    width={0}
                    height={0} />}
              </div>
              <div className="user-name-email">
                <span className='name'>
                  {userData.fullName
                    ? <><span>{userData.fullName}</span><span>({userData.username})</span></>
                    : userData.username}
                </span>
                <span className='email'>{userData.email}</span>
                <Link href={'/ayarlar'} className='edit-profile'>Düzenle</Link>
              </div>
            </div>
            <div className={`contact-options ${contactEditMode ? 'edit-mode' : ''}`}>
              <div className='contact-header'>
                <h3>İletişim</h3>
                {contactEditMode ?
                  addNewContactMode ?
                    <button type="button" className='cancel-new-contact-option' onClick={() => setAddNewContactMode(false)}>Vazgeç</button>
                    :
                    <button type="button" className='add-new-contact-option' onClick={() => setAddNewContactMode(true)}>Yeni</button>
                  :
                  <button type="button" className='open-contact-edit-mode' onClick={() => setContactEditMode(true)}>Düzenle</button>
                }
              </div>
              <div className={`new-contact-option-wrapper ${contactEditMode && addNewContactMode ? 'active' : ''}`}>
                <input type="text" name="body" className="body" value={newContactForm.body} onChange={handleNewContactFormChange} placeholder='İletişim bilgisi' />
                <div className='new-contact-footer'>
                  <select name='type' className='type' value={newContactForm.type} onChange={handleNewContactFormChange}>
                    <option value="0">Tür</option>
                    <option value="1">Cep Telefonu</option>
                    <option value="2">İş Telefonu</option>
                    <option value="3">Ev Telefonu</option>
                    <option value="4">E-Posta</option>
                    <option value="5">İnstagram</option>
                  </select>
                  <button type="button" className="add-new" onClick={handleNewContactSubmit}>Ekle</button>
                </div>
              </div>
              {contactInfo.length > 0 || contactEditMode ?
                <ul className="contact-information">
                  {contactEditMode ?
                    contactInfoEdited.map((info, index) =>
                      <li><button type="button" className="remove" onClick={() => deleteContactOption(index)}><XLg /></button><span className='body'>{info.Body}</span> - <span className='type'>{ContactTypes.get(info.Type) ?? '???'}</span></li>
                    ) :
                    contactInfo.map((info, index) =>
                      <li><span className='body'>{info.Body}</span> - <span className='type'>{ContactTypes.get(info.Type) ?? '???'}</span></li>
                    )
                  }
                </ul>
                : <span className="no-information">Seçenek yok...</span>
              }
              {contactEditMode ?
                <div className="contact-edit-options">
                  <button type="button" className="cancel-edit" onClick={handleCloseContactEditMode}>Vazgeç</button>
                  <button type="button" className="save-edit" onClick={handleContactSubmit} disabled={updatingContacts}>Kaydet</button>
                </div>
                : <></>}
            </div>
          </div>
          <div className="profile-body">
            <div className="profile-nav">
              <h3>Gönderilerim</h3>
            </div>
            {profileLoading !== false ?
              <div className="listing-loading">
                <GridLoader color="#598dcc" />
              </div>
              :
              postList.length > 0 ?
                <div className="user-posts listing">
                  {postList.map((post, i) =>
                    <div className="post" key={post.Id}>
                      <div className='post-link'>
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
                        <Link href={`/${post.CategoryCode}/${post.Id}/${titleToUrl(post.Title)}`} className='title'>{post.Title}</Link>
                      </div>
                      <div className="date-container">
                        <span className="date">{formatSecondsAgo(post.SecondsAgo)}</span>
                        <span className={`status cs-${post.CurrentStatusId}`}>{CSMap[post.CurrentStatusId]}</span>
                      </div>
                      <div className="update-post">
                        <button type="button" className="update-post-button" onClick={() => {
                          const updatedPostList = postList.map((p) => {
                            if (p.Id === post.Id) {
                              return { ...p, UpdateMenuActive: !post.UpdateMenuActive };
                            }
                            return { ...p, UpdateMenuActive: false };
                          });
                          setPostList(updatedPostList);
                        }}>Güncelle<ChevronDown /></button>
                        <div className={`update-menu ${post.UpdateMenuActive ? 'active' : ''}`}>
                          <ul className='new-status-list'>
                            <li className='cs-1' onClick={() => updateStatus(post.Id, 1)}>{CSMap[1]}</li>
                            <li className='cs-2' onClick={() => updateStatus(post.Id, 2)}>{CSMap[2]}</li>
                            <li className='cs-3' onClick={() => updateStatus(post.Id, 3)}>{CSMap[3]}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                :
                <div className='no-post-warning'>
                  <h3>Herhangi bir gönderi bulunamadı</h3>
                </div>
            }

          </div>
        </div>
        : <></>}
    </Template>
  )
}
