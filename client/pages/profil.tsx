
import Template from '@/components/template'
import { useUser } from '@/context/userContext';
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react';
import { Post } from './[category]';
import { fetchJwt } from '@/lib/utils/userUtils';
import { apiUrl, avatarLink, formatSecondsAgo, postImageLink } from '@/lib/utils/helperUtils';
import { ChevronDown } from 'react-bootstrap-icons';
import GridLoader from 'react-spinners/GridLoader';
import { useGStatus } from '@/context/globalContext';

type CurrentStatus = 1 | 2 | 3;

interface UserPost extends Post {
  CategoryCode: string;
  CurrentStatusId: CurrentStatus;
  UpdateMenuActive?: boolean;
}

export default function Home() {
  // Use global context
  const { handleGStatus } = useGStatus();
  // Get user context
  const { userData } = useUser();

  // Fetch posts
  const [postList, setPostList] = useState<UserPost[]>([]);
  const [profilePostsLoading, setProfilePostsLoading] = useState<boolean | null>(null);
  useEffect(() => {
    /*const jwt = fetchJwt();
    if(!jwt) return;*/
    if (!userData || !userData.sub) return;
    // LOADING
    setProfilePostsLoading(true);
    // api url + get-posts + category id as path + query parameters
    const fetchPostsUrl = `${apiUrl}/get-user-posts/${userData.sub}`;
    fetch(fetchPostsUrl, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        /*Authorization: 'Bearer ' + jwt*/
      }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        setPostList(data.posts);
      })
      .catch((res) => {
        handleGStatus('informationModal', {
          type: 'error',
          text: 'Gönderileri getirirken hata. Üzgünüz!'
        });
      })
      .finally(() => {
        setProfilePostsLoading(false);
      });
  }, [userData])

  // Current status map for id and value
  const CSMap = {
    1: 'Cevap bekliyor',
    2: 'Anlaşıldı',
    3: 'Tamamlandı'
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
                    src={require('@/assets/site/user.png')}
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
                <Link href={'/ayarlar'} type="button" className='edit-profile'>Düzenle</Link>
              </div>
            </div>
          </div>
          <div className="profile-body">
            <div className="profile-nav">
              <h3>Gönderilerim</h3>
            </div>
            {profilePostsLoading || profilePostsLoading === null ?
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
                        <Link href={`/${post.CategoryCode}/${post.Id}`} className='title'>{post.Title}</Link>
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
                            <li className='cs-1' onClick={() => updateStatus(post.Id, 1)}>Cevap bekliyor</li>
                            <li className='cs-2' onClick={() => updateStatus(post.Id, 2)}>Anlaşıldı</li>
                            <li className='cs-3' onClick={() => updateStatus(post.Id, 3)}>Tamamlandı</li>
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
