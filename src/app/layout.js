import './globals.css';

export const metadata = {
    title: 'Blöf Oyunu - Çok Oyunculu Kelime Oyunu',
    description: 'Arkadaşlarınla oyna! Masa kur, kelimeni gör, blöfçüyü bul. Gerçek zamanlı çok oyunculu kelime blöf oyunu.',
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
    },
    themeColor: '#0a0a1a',
    manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
    return (
        <html lang="tr">
            <head>
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            </head>
            <body>
                <div className="bg-gradient" />
                {children}
            </body>
        </html>
    );
}
