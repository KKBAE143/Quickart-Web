# 📱 Mobile Testing Guide for Quickart

## Quick Start: Test on Your Phone

### Method 1: Using ngrok (Recommended) ✅

**Step 1: Start Your Dev Server**
```bash
cd client
npm run dev
```
Wait until you see: `Local: http://localhost:5173/`

**Step 2: Start ngrok Tunnel**
Open a **new terminal** and run:
```bash
# Windows (PowerShell)
.\start-ngrok.ps1

# OR Windows (Command Prompt)
start-ngrok.bat

# OR Manual command
ngrok http 5173
```

**Step 3: Get Your Mobile URL**
ngrok will show something like:
```
Forwarding  https://abc123xyz.ngrok-free.app -> http://localhost:5173
```

**Step 4: Open on Your Phone**
1. Copy the `https://abc123xyz.ngrok-free.app` URL
2. Open it in your phone's browser
3. **That's it!** Your app is now accessible on mobile

---

### Method 2: Using Local Network IP (Faster, No Internet Required)

**Step 1: Find Your Computer's IP Address**

**Windows:**
```powershell
ipconfig
```
Look for `IPv4 Address` under your active network adapter (usually `192.168.x.x` or `10.x.x.x`)

**Step 2: Start Dev Server with Network Access**
```bash
cd client
npm run dev -- --host
```

**Step 3: Access from Phone**
1. Make sure phone and computer are on **same WiFi network**
2. Open browser on phone
3. Go to: `http://YOUR_IP:5173`
   - Example: `http://192.168.1.100:5173`

---

## 🎯 Testing Location Detection on Mobile

### Why Mobile is Better:
- ✅ **Real GPS hardware** (10-50m accuracy)
- ✅ **Better location services**
- ✅ **Native browser support**
- ✅ **Faster detection**

### What to Test:

**1. Location Detection:**
- [ ] Click "Use My Location"
- [ ] Should detect within 10-50m (not 6000m!)
- [ ] Map should show your exact location
- [ ] Address should auto-fill correctly

**2. Pin Dragging:**
- [ ] Drag red pin to your exact building
- [ ] Address should update automatically
- [ ] Form fields should refresh

**3. Address Search:**
- [ ] Type in search box
- [ ] See Google Places suggestions
- [ ] Select a suggestion
- [ ] Map should jump to that location

**4. Form Submission:**
- [ ] Fill all required fields
- [ ] Click "Save Address"
- [ ] Should save successfully

---

## 🔧 Troubleshooting

### ngrok Issues:

**"ngrok: command not found"**
- Install ngrok: https://ngrok.com/download
- Or use local network method instead

**"Tunnel not working"**
- Make sure dev server is running on port 5173
- Check firewall isn't blocking ngrok

**"Connection refused"**
- Verify dev server is running: `http://localhost:5173`
- Restart dev server if needed

### Local Network Issues:

**"Can't connect from phone"**
- Ensure phone and computer on same WiFi
- Check Windows Firewall allows port 5173
- Try disabling firewall temporarily for testing

**"IP address not working"**
- Make sure you used `--host` flag: `npm run dev -- --host`
- Check IP address is correct (not 127.0.0.1)

---

## 📊 Expected Results on Mobile

**Location Accuracy:**
- Desktop: ±200-2000m (WiFi triangulation)
- **Mobile: ±10-50m (GPS)** ✅

**Detection Speed:**
- Desktop: 3-5 seconds
- **Mobile: 2-3 seconds** ✅

**GPS Lock:**
- Desktop: Rarely gets GPS
- **Mobile: Usually gets GPS within 2-3 seconds** ✅

---

## 🎁 Pro Tips

1. **Use ngrok for testing from anywhere**
   - Works even if phone is on different network
   - Great for testing with friends/family

2. **Use local network for faster testing**
   - No internet required
   - Faster connection
   - But requires same WiFi

3. **Test on real device**
   - Emulators don't have real GPS
   - Real phone = real GPS accuracy

4. **Enable location permissions**
   - Allow browser to access location
   - Enable "High accuracy" mode in phone settings

---

## 🚀 Quick Commands

**Start everything:**
```bash
# Terminal 1: Dev server
cd client && npm run dev

# Terminal 2: ngrok tunnel
ngrok http 5173
```

**Access URLs:**
- Local: `http://localhost:5173`
- Mobile (ngrok): `https://abc123.ngrok-free.app`
- Mobile (local): `http://192.168.1.100:5173`

---

## ✅ Success Checklist

- [ ] Dev server running on port 5173
- [ ] ngrok tunnel active (or local network configured)
- [ ] Phone can access the URL
- [ ] Location detection works (10-50m accuracy)
- [ ] Map shows correctly
- [ ] Pin dragging works
- [ ] Address search works
- [ ] Form submission works

**You're ready to test!** 🎉

