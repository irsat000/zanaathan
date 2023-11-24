import { UserContext } from '@/context/userContext'
import '@/styles/global.css'
import '@/styles/index.css'
import '@/styles/category.css'
import '@/styles/post.css'
import '@/styles/new-post.css'
import '@/styles/profile.css'
import type { AppProps } from 'next/app'

import { ContactsProvider } from '@/context/contactsContext'
import { GStatusProvider } from '@/context/globalContext'
import { GoogleOAuthProvider } from '@react-oauth/google'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <GoogleOAuthProvider clientId='714554272496-8aan1i53sdgkp9o9s78mlnu5af214ipk.apps.googleusercontent.com'>
      <UserContext>
        <GStatusProvider>
          <ContactsProvider>
            <Component {...pageProps} />
          </ContactsProvider>
        </GStatusProvider>
      </UserContext>
    </GoogleOAuthProvider>
  )
}
