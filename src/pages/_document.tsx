import Document, { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <meta name="fc:miniapp" content='{
  "version":"next",
  "imageUrl":"https://www.reap.deals/embed-image.png",
  "button":{
      "title":"launch Reap",
      "action":{
      "type":"launch_miniapp",
      "name":"Reap",
      "url":"https://www.reap.deals"
      }
  }
  }' />
          <script src="" defer />
          <link rel="manifest" href="/manifest.json" />
        </Head>
        <body>
          <Main />
          <NextScript />
          {/* Google Analytics via next/script */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-RNVC517N8T"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RNVC517N8T');
            `}
          </Script>
          
        </body>
      </Html>
    );
  }
}

export default MyDocument;
