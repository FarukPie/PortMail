# Ücretsiz 1 Dakikalık Cron Job Kurulumu

Vercel Hobby planında cron job limitlerine takılmadan, dakikada bir çalışacak mail gönderim sistemini kurmak için aşağıdaki adımları izleyebilirsiniz.

## Hazırlık
Öncelikle Vercel proje ayarlarınızda `CRON_SECRET` isimli bir Environment Variable tanımladığınızdan emin olun. Bu şifre, dışarıdan gelen isteklerin güvenliğini sağlar.

Örnek bir şifre belirleyin (karmaşık olması iyidir):
`my_secure_cron_password_2025`

## Adım 1: cron-job.org Hesabı Açın
1.  [https://cron-job.org/en/](https://cron-job.org/en/) adresine gidin.
2.  **"Sign Up"** butonuna tıklayarak ücretsiz üye olun.
3.  E-postanızı doğrulayıp giriş yapın.

## Adım 2: Cron Job Oluşturun
Panelde **"Create Cronjob"** butonuna tıklayın ve şu bilgileri girin:

*   **Title:** `PortMail Sender` (veya istediğiniz bir isim)
*   **URL:** `https://sizin-proje-adiniz.vercel.app/api/cron/send-mails`
    *   *(Not: `sizin-proje-adiniz.vercel.app` kısmını kendi deploy adresinizle değiştirin)*
*   **Execution Schedule:** `Every 1 minute(s)` seçeneğini seçin.

## Adım 3: Güvenlik Ayarları (Header Ekleme)
Aynı sayfada "Advanced" veya "Headers" bölümünü bulun (genellikle aşağıdadır).

*   **Key:** `Authorization`
*   **Value:** `Bearer SİZİN_BELİRLEDİĞİNİZ_CRON_SECRET`
    *   *(Örneğin: `Bearer my_secure_cron_password_2025`)*

## Adım 4: Kaydet ve Test Et
1.  **"Create Cronjob"** diyerek kaydedin.
2.  Oluşturduğunuz job'ın yanındaki "Test" veya "Run Now" butonuna basarak ilk isteği manuel gönderin.
3.  "History" sekmesinden sonucun "Success" (200 OK) döndüğünü doğrulayın.

Artık sisteminiz Vercel limitlerine takılmadan her dakika mail gönderimi yapacaktır.
