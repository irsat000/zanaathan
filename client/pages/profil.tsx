
import Template from '@/components/template'
import { useUser } from '@/context/userContext';
import Image from 'next/image'
import Link from 'next/link'


export default function Home() {
  // Get user context
  const { userData } = useUser();

  return (
    <Template>
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
          
        </div>
      </div>
    </Template>
  )
}
