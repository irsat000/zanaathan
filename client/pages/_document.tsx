import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="tr-TR" data-colorset-1>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Caudex:wght@700&family=Cinzel&family=Fira+Sans:wght@300;400;500&family=Poppins:wght@300;400&family=Righteous&display=swap" rel="stylesheet" />
        {/*<link href="https://fonts.googleapis.com/css2?family=Cinzel&family=Fira+Sans:wght@300;400;500&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet" />*/}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
