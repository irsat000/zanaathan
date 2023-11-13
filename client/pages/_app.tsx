import { UserContext } from '@/context/userContext'
import '@/styles/global.css'
import '@/styles/index.css'
import '@/styles/category.css'
import '@/styles/post.css'
import '@/styles/new-post.css'
import type { AppProps } from 'next/app'
import { ContactsProvider } from '@/context/contactsContext'
import { GStatusProvider } from '@/context/globalContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserContext>
      <GStatusProvider>
        <ContactsProvider>
          <Component {...pageProps} />
        </ContactsProvider>
      </GStatusProvider>
    </UserContext>
  )
}
