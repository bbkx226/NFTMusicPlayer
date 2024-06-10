import { Html, Head, Main, NextScript } from 'next/document'

// Next.js uses the Document component to augment the <html> and <body> tags. 
// This is useful for setting global CSS, setting up a language for your site, or adding external resources like a CDN.
  
// Html is the root component of a document.
// Head is a component that appends elements to the <head> of a page.
// Main is a component that gets replaced with the page content.
// NextScript is a component that includes Next.js scripts for page functionality.
export default function Document() {
  return (
    <Html lang="en"> 
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}