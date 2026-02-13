# Blöf Oyunu - Frontend

Çok oyunculu kelime blöf oyunu için Next.js frontend uygulaması.

## Kurulum

```bash
npm install
```

## Çalıştırma

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

## Environment Variables

`.env.local` dosyası oluştur:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Vercel Deploy

1. GitHub'a push et
2. [vercel.com](https://vercel.com) → Import Git Repository
3. Environment variable ekle: `NEXT_PUBLIC_SOCKET_URL=https://backend-url.railway.app`
4. Deploy! 🚀
