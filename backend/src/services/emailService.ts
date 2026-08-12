import nodemailer from 'nodemailer';

// Konfigurasi Transport Nodemailer
// Untuk production, gunakan SMTP sungguhan dari variabel .env (seperti Gmail, SendGrid, dll)
// Namun untuk tahap development/sidang, kita bisa menggunakan ethereal.email atau console.log fallback
export const sendAnomalyEmail = async (recipients: string[], anomalies: any[]) => {
  try {
    if (anomalies.length === 0) return;

    let transporter;
    
    // Jika tidak ada konfigurasi SMTP di .env, kita buat akun testing Ethereal secara otomatis (Gratis)
    if (!process.env.SMTP_HOST) {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, 
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', 
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    const anomalyHtml = anomalies.map(a => `
      <div style="border: 1px solid #ffcccc; background-color: #fff5f5; padding: 15px; margin-bottom: 10px; border-radius: 5px;">
        <h3 style="color: #cc0000; margin-top: 0;">⚠️ ${a.title}</h3>
        <p style="color: #333;">${a.description}</p>
        <small style="color: #666;">Terdeteksi pada: ${new Date(a.date).toLocaleString('id-ID')}</small>
      </div>
    `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #1a1a1a; border-bottom: 2px solid #00d4aa; padding-bottom: 10px;">Laporan Peringatan Anomali PJP</h2>
        <p>Sistem Dasbor telah mendeteksi aktivitas operasional yang tidak wajar pada unggahan data terakhir. Mohon tim operasional segera melakukan investigasi terhadap PJP di bawah ini:</p>
        
        ${anomalyHtml}
        
        <p style="margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
          Email ini dibuat secara otomatis oleh Sistem Pengolahan & Dashboard Analisis Laporan Appeal PJP.<br>
          Harap jangan membalas email ini.
        </p>
      </div>
    `;

    const senderEmail = process.env.SMTP_USER || 'no-reply@appeal-dashboard.com';
    const info = await transporter.sendMail({
      from: `"PJP Dashboard Anomaly System" <${senderEmail}>`,
      to: recipients.join(', '),
      subject: `🚨 [URGENT] ${anomalies.length} Anomali PJP Terdeteksi!`,
      html: htmlContent,
    });

    console.log('✅ Peringatan Anomali berhasil dikirim ke Email: %s', info.messageId);
    
    // Jika menggunakan ethereal, ini akan mencetak URL untuk melihat email palsu di browser
    if (info.messageId && (process.env.SMTP_HOST || 'smtp.ethereal.email').includes('ethereal')) {
      console.log('👀 Preview Email: %s', nodemailer.getTestMessageUrl(info));
    }

  } catch (error) {
    console.error('❌ Gagal mengirim email notifikasi:', error);
  }
};
