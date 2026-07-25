# 📍 Location Accuracy Fix Guide

## The Problem
Getting **±5.5km accuracy** instead of **5-50m** due to GPS denial and WiFi fallback.

## Solution Implemented

### Files Modified
| File | Purpose |
|------|---------|
| `client/src/utils/LocationService.js` | Multi-method detection (GPS → WiFi → IP) |
| `client/src/components/AddAddress.jsx` | Uses LocationService, clean toasts |
| `client/src/components/AddressSelector.jsx` | Same improvements |
| `client/src/pages/AgentDashboard.jsx` | Accuracy filtering (>500m ignored) |

---

## Key Configuration

### 1. Enable High Accuracy
```javascript
navigator.geolocation.getCurrentPosition(callback, {
  enableHighAccuracy: true,  // ← Forces GPS
  timeout: 8000,             // Quick fail-over
  maximumAge: 0              // Fresh data
});
```

### 2. Timeout Cascade
```
GPS (8 sec) → 5-50m ✅
WiFi (10 sec) → 50-500m ✅
IP (instant) → ~5km ⚠️
Manual → User confirms ✅
```

### 3. Google Maps Script
```html
<script async 
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places,marker&loading=async">
</script>
```

---

## Testing Checklist

- [ ] Allow GPS → Should show city within 3 seconds
- [ ] Block GPS → Should fallback to WiFi/IP
- [ ] Check console for: `📍 Location method: gps/wifi/ip`
- [ ] Toast shows only ONE message (no spam)
- [ ] Pin dragging updates address fields

---

## Console Output (Expected)
```
🛰️ Attempting GPS detection...
✅ GPS success: ±47m
📍 Location method: gps
🎯 Accuracy: ±47m
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Permission denied" | User must allow in browser |
| "GPS timeout" | Falls back to WiFi/IP |
| Low accuracy (>1km) | IP-based, prompt user to drag pin |
| Google Maps not loading | Check API key in `.env` |
