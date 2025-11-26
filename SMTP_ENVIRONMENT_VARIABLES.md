# SMTP Environment Variables

## Required SMTP Configuration

Add these to your **Vercel Dashboard** → **Settings** → **Environment Variables**

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourgmail@gmail.com
SMTP_PASSWORD=your-app-password
SUPPORT_EMAIL=yourgmail@gmail.com
```

---

## 📋 Variable Descriptions

### `SMTP_HOST`
- **Value:** `smtp.gmail.com`
- **Description:** SMTP server hostname
- **For Gmail:** Use `smtp.gmail.com`
- **For other providers:** Check your email provider's SMTP settings

### `SMTP_PORT`
- **Value:** `587`
- **Description:** SMTP server port
- **For Gmail:** Use `587` (TLS) or `465` (SSL)
- **Common ports:** `587` (TLS), `465` (SSL), `25` (unsecured)

### `SMTP_USER`
- **Value:** `yourgmail@gmail.com`
- **Description:** Your email address (used for SMTP authentication)
- **Example:** `chilltours.official@gmail.com`
- **Note:** This is the email address you'll send emails FROM

### `SMTP_PASSWORD`
- **Value:** `your-app-password`
- **Description:** Gmail App Password (⚠️ NOT your regular password)
- **For Gmail:** You MUST use an App Password
- **Generate at:** https://myaccount.google.com/apppasswords
- **Requirements:** 2-Factor Authentication must be enabled

### `SUPPORT_EMAIL`
- **Value:** `yourgmail@gmail.com`
- **Description:** Support/contact email address
- **Example:** `chilltours.official@gmail.com`
- **Used for:** Customer support, reply-to addresses

---

## 🔐 Gmail App Password Setup

1. **Enable 2-Factor Authentication:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter name: "Chill Busan Tours"
   - Click "Generate"
   - Copy the 16-character password

3. **Use the App Password:**
   - Paste it as `SMTP_PASSWORD` value
   - Do NOT use your regular Gmail password

---

## 📝 Complete Example

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=chilltours.official@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SUPPORT_EMAIL=chilltours.official@gmail.com
```

---

## ⚠️ Important Notes

1. **Gmail App Password Required:**
   - Regular Gmail password will NOT work
   - Must use App Password for Gmail accounts

2. **Security:**
   - Never commit these values to git
   - Store only in Vercel environment variables
   - Rotate passwords regularly

3. **Other Email Providers:**
   - **Outlook/Hotmail:** `smtp-mail.outlook.com`, port `587`
   - **Yahoo:** `smtp.mail.yahoo.com`, port `587`
   - **Custom SMTP:** Check your provider's documentation

---

## ✅ Verification

After setting these variables:
1. Deploy to Vercel
2. Test booking confirmation email
3. Check that emails are sent successfully
4. Verify emails arrive in customer inbox

