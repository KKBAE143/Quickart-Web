const mobileOtpTemplate = ({ name = "", otp, intent = "login" }) => {
  const greeting = name ? `Hi ${name},` : `Hi,`
  const purpose = intent === 'register' ? 'to complete your signup' : 'to login to your account'
  const digits = String(otp).split('').slice(0,6)
  const box = (d) => `<div style="display:inline-block;width:48px;height:48px;line-height:48px;text-align:center;border:1px solid #e5e7eb;border-radius:8px;margin:0 6px;background:#fff;font-weight:700;font-size:20px;color:#111827;">${d}</div>`
  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Quickart OTP</title>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f8fafc;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
              <tr>
                <td style="background:linear-gradient(90deg,#dc2626,#b91c1c);padding:20px 24px;color:#ffffff;font-weight:700;font-size:18px;">
                  Quickart
                </td>
              </tr>
              <tr>
                <td style="padding:24px 24px 8px 24px;font-size:16px;">
                  <div style="font-size:16px;">${greeting}</div>
                  <div style="margin-top:8px;color:#334155;">Use the code below ${purpose}. This code expires in <strong>5 minutes</strong>.</div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:16px 24px 8px 24px;">
                  <div style="display:inline-block;padding:12px;border:1px dashed #fecaca;border-radius:12px;background:#fff6f6;">
                    ${digits.map(box).join('')}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 24px 24px 24px;color:#64748b;font-size:13px;">
                  Do not share this code with anyone. If you didn’t request this, you can safely ignore this email.
                </td>
              </tr>
              <tr>
                <td style="background:#f9fafb;padding:16px 24px;color:#475569;font-size:12px;border-top:1px solid #e5e7eb;">
                  © ${new Date().getFullYear()} Quickart. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
}

export default mobileOtpTemplate