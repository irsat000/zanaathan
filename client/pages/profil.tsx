
import Template from '@/components/template'
import { useUser } from '@/context/userContext';
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react';
import { Post } from './[category]';
import { fetchJwt } from '@/lib/utils/userUtils';
import { apiUrl, formatSecondsAgo, postImageLink } from '@/lib/utils/helperUtils';

interface UserPost extends Post {
  CategoryCode: string;
  CurrentStatusId: 1 | 2 | 3;
}

export default function Home() {
  // Get user context
  const { userData } = useUser();

  // Fetch posts
  const [postList, setPostList] = useState<UserPost[]>([]);
  useEffect(() => {
    /*const jwt = fetchJwt();
    if(!jwt) return;*/
    if (!userData || !userData.sub) return;
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
      .catch((res) => console.log('Sunucuda hata'));
  }, [userData])

  const CSMap = {
    1: 'Cevap bekliyor',
    2: 'Anlaşıldı',
    3: 'Tamamlandı'
  };

  return (
    <Template>
      {userData ?
        <div className='profile-page'>
          <div className="profile-panel">
            <div className="personal-info-container">
              <div className="user-avatar">
                <Image src={require('@/assets/site/user.png')} alt={'Profil fotoğrafı'} />
              </div>
              <span className='name'>
                {userData.fullName
                  ? <><span>{userData.fullName}</span><span>({userData.username})</span></>
                  : userData.username}
              </span>
              <span className='email'>{userData.email}</span>
            </div>
          </div>
          <div className="profile-body">
            <div className="profile-nav">
              <h3>Gönderilerim</h3>
            </div>
            <div className="user-posts listing">
              {postList.map((post, i) =>
                <div className="post" key={post.Id}>
                  <Link href={`/${post.CategoryCode}/${post.Id}`} className='post-link'>
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
                  <div className="date-container">
                    <span className="date">{formatSecondsAgo(post.SecondsAgo)}</span>
                    <span className={`status cs-${post.CurrentStatusId}`}>{CSMap[post.CurrentStatusId]}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        : <></>}
    </Template>
  )
}
