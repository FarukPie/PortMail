# PortMail Sıfırdan Kurulum ve Deploy Rehberi

Bu rehber, projenizi Vercel'den tamamen silip en baştan hatasız bir şekilde kurmanız için hazırlanmıştır.

## 1. Hazırlık (Lokal)

Önce yaptığımız tüm düzeltmelerin GitHub'a yüklendiğinden emin olun.
Terminalde şu komutları çalıştırın:

```bash
git add .
git commit -m "Fix deployment, middleware and cron rls issues"
git push
```

## 2. Vercel'deki Eski Projeyi Silme

1.  Vercel paneline gidin.
2.  Mevcut projenizin ayarlarına (`Settings`) girin.
3.  Sayfanın en altına inin ve **"Delete Project"** butonuna basarak projeyi silin.

## 3. Yeni Proje Oluşturma

1.  Vercel ana sayfasında **"Add New..."** > **"Project"** seçeneğine tıklayın.
2.  GitHub hesabınızdaki `portmail` reposunu seçin ve **"Import"** deyin.

## 4. Environment Variables (Çok Önemli!)

Deploy butonuna basmadan önce **"Environment Variables"** sekmesini açın ve aşağıdaki değerleri tek tek ekleyin. Bu adım eksik olursa proje çalışmaz.

| Key | Value (Değer) | Açıklama |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | *Supabase URL'iniz* | Supabase panelinden kopyalayın. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Supabase Anon Key* | Supabase panelinden kopyalayın. |
| `SUPABASE_SERVICE_ROLE_KEY` | *Supabase Service Role Key* | **YENİ!** Supabase `Settings > API` altındaki `service_role` anahtarı. |
| `GMAIL_USER` | *Gmail Adresiniz* | Örn: `adiniz@gmail.com` |
| `GMAIL_APP_PASSWORD` | *Gmail Uygulama Şifreniz* | Google hesabınızdan aldığınız 16 haneli şifre. |
| `CRON_SECRET` | *Bir Şifre Belirleyin* | Örn: `portmail_cron_sifresi_2025` |

**Not:** Bu değerlerin hepsini `.env.local` dosyanızdan da bakarak kopyalayabilirsiniz. Sadece `SUPABASE_SERVICE_ROLE_KEY` yerelde yoksa Supabase panelinden almanız gerekir.

## 5. Deploy

Değişkenleri ekledikten sonra **"Deploy"** butonuna basın. Kurulumun bitmesini bekleyin.
Yeşil ekranı görünce proje başarıyla kurulmuş demektir.

## 6. Cron Job Kurulumu (1 Dakikalık)

Ücretsiz planda 1 dakikalık gönderim yapmak için **cron-job.org** kullanacağız.

1.  [cron-job.org](https://cron-job.org/) adresine gidin ve giriş yapın.
2.  **"Create Cronjob"** butonuna basın.
3.  **URL:** `https://YENI-VERCEL-ADRESINIZ.vercel.app/api/cron/send-mails`
4.  **Schedule:** "Every 1 minute" (Her dakika).
5.  **Headers (Advanced):**
    *   Key: `Authorization`
    *   Value: `Bearer BELIRLEDIGINIZ_CRON_SECRET`
    *(Adım 4'te `CRON_SECRET` olarak ne yazdıysanız buraya da onu yazın)*

## Test Etme

Her şey bittiğinde:
1.  Sitenize girin ve ileri tarihli bir mail planlayın.
2.  cron-job.org panelinden "Run Now" diyerek veya 1 dakika bekleyerek mailin gidip gitmediğini kontrol edin.
3.  Sorun olursa Vercel panelindeki "Logs" sekmesinden hataları görebilirsiniz.
