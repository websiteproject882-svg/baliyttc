# Balieytc - Video System & UX Implementation Guide

Current status (May 21, 2026): the hero background video now lives at `public/videos/hero-yoga-1080.mp4`, and review videos live under `public/reviews/`. Use this guide when replacing existing assets or adding new campus/course videos.

## 🎬 Video Integration Instructions

### Option 1: YouTube (Recommended)
**Best for:** High-quality streaming, no hosting needed

1. Upload your Balieytc campus tour video to YouTube
2. Get the video ID (last part of the URL: `youtube.com/watch?v=VIDEO_ID`)
3. Edit `src/components/home/VideoShowcase.tsx`:
```typescript
<VideoPlayer
  youtubeId="YOUR_VIDEO_ID_HERE"
  poster={IMG.heroCeremony}
  title="Balieytc Campus Tour - Yoga & Wellness in Ubud"
  autoPlay={false}
  muted={true}
/>
```

### Option 2: Vimeo (Premium Alternative)
**Best for:** Professional video hosting, better controls

1. Upload to Vimeo and get your video ID
2. Edit `src/components/home/VideoShowcase.tsx`:
```typescript
<VideoPlayer
  vimeoId="YOUR_VIMEO_ID_HERE"
  poster={IMG.heroCeremony}
  title="Balieytc Campus Tour"
  autoPlay={false}
/>
```

### Option 3: Self-Hosted (Full Control)
**Best for:** Maximum control, no platform restrictions

1. Place your MP4 file in `public/videos/` folder (e.g., `public/videos/balieytc-tour.mp4`)
2. Edit `src/components/home/VideoShowcase.tsx`:
```typescript
<VideoPlayer
  src="/videos/balieytc-tour.mp4"
  poster={IMG.heroCeremony}
  title="Balieytc Campus Tour"
  autoPlay={false}
/>
```

---

## 🎨 Design Improvements Summary

### 1. **Hero Section**
- ✅ Video background with premium overlays
- ✅ Mute/unmute button
- ✅ Gradient text effects
- ✅ Trust metrics with emoji
- ✅ Scroll indicator

### 2. **Video Showcase Section** (NEW)
- ✅ Professional video player
- ✅ Campus benefits grid
- ✅ Why choose us section
- ✅ Trust indicators
- ✅ Fully responsive

### 3. **Apply Form**
**Psychology Enhancements:**
- ✅ **Reduced friction**: 3 simple steps
- ✅ **Trust signals**: Guarantees, no payment upfront
- ✅ **Clear feedback**: Validation, loading states
- ✅ **Success celebration**: Animated confirmation
- ✅ **Error recovery**: Helpful error messages

**Visual Improvements:**
- ✅ Progress bar showing step completion
- ✅ Smooth animations between steps
- ✅ Better field organization
- ✅ Trust box with check icons
- ✅ Mobile-optimized layout

### 4. **All Home Page Sections**
- ✅ Professional gradients
- ✅ Advanced animations (Framer Motion)
- ✅ Improved typography
- ✅ Better hover states
- ✅ Mobile-first design
- ✅ Trust metrics throughout

---

## 📊 User Psychology Principles Applied

### **1. Trust Building**
- "No payment required yet" messaging
- RYS certification badge
- "5000+ students trained"
- "Money-back guarantee"
- Testimonials with real photos

### **2. Reduced Friction**
- Minimal form fields
- Progress visualization
- Clear step labels
- One action per step
- Mobile-friendly input

### **3. Social Proof**
- Student count (5000+)
- Star ratings (4.9★)
- Teacher experience (15+ years)
- Success stories
- Trust indicators

### **4. Urgency & FOMO**
- "Limited spots available"
- "Early registrants get discounts"
- "Join our global community"
- Teacher photos with credentials

### **5. Clarity & Guidance**
- Step-by-step form
- Helpful field labels
- Error messages
- Expected outcomes
- What happens next

### **6. Visual Hierarchy**
- Gradient buttons (primary action)
- Clear typography sizing
- Proper spacing
- Color coding (success, trust)
- Icon usage for quick scanning

---

## 🎯 Video Best Practices for Yoga Website

### **Campus Tour Video Recommendations:**
- **Duration**: 3-5 minutes
- **Content**:
  - 0:00-0:30: Aerial/opening shots of campus
  - 0:30-1:30: Yoga studios (peaceful, authentic)
  - 1:30-2:30: Accommodations (clean, comfortable)
  - 2:30-3:30: Meals, gardens, social areas
  - 3:30-4:00: Student testimonial clips
  - 4:00-5:00: Sunrise yoga, ceremonies

### **Video Quality Settings:**
- Resolution: 1080p minimum
- Frame rate: 30fps
- Aspect ratio: 16:9
- File size: Optimized for web

### **Poster Image:**
- Already set to `IMG.heroCeremony`
- Should be the best frame from your video
- 16:9 aspect ratio
- High quality JPG

---

## 💡 Conversion Optimization Tips

### **For Better Signups:**
1. ✅ First section (Hero + Video Showcase) - Build trust
2. ✅ See courses and features
3. ✅ Read testimonials
4. ✅ Apply button scattered throughout
5. ✅ Final CTA section

### **Mobile Optimization:**
- All sections responsive
- Touch-friendly buttons (min 44px)
- Easy form input on mobile
- Clear CTA buttons
- Fast loading (optimized images)

### **SEO Benefits:**
- Video increases time on page
- Reduces bounce rate
- Better engagement metrics
- Improved ranking signals

---

## 📱 Testing Checklist

- [ ] Video plays on desktop (all browsers)
- [ ] Video plays on mobile (Chrome, Safari)
- [ ] Mute button works
- [ ] Fullscreen works
- [ ] Poster image loads
- [ ] Form validates on all browsers
- [ ] Success message shows
- [ ] Mobile layout responsive
- [ ] Images load correctly
- [ ] Animations smooth

---

## 🚀 Performance Metrics

**Current Implementation:**
- Lazy loading: ✅ Images
- Video: ✅ Embedded (platform handles)
- Animations: ✅ GPU-accelerated
- Mobile: ✅ Optimized
- Accessibility: ✅ ARIA labels, semantic HTML

**Target Lighthouse Scores:**
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >95

---

## 📝 Next Steps

1. **Upload your video**
   - YouTube: Recommended (easiest)
   - Update video ID in VideoShowcase.tsx

2. **Test the form**
   - Fill out all steps
   - Check validation
   - Verify success message

3. **Mobile testing**
   - Test on actual phone
   - Check form inputs
   - Verify video playback

4. **Analytics setup**
   - Track form starts
   - Track completions
   - Track video views
   - Monitor user flow

5. **Monitor performance**
   - Check Lighthouse scores
   - Monitor page load time
   - Track form abandonment
   - Check conversion rates

---

## 🎬 Sample Video Integration (YouTube)

```typescript
// In src/components/home/VideoShowcase.tsx

<VideoPlayer
  youtubeId="dQw4w9WgXcQ"  // Replace with your video ID
  poster={IMG.heroCeremony}
  title="Balieytc Campus Tour - Yoga & Wellness in Ubud"
  autoPlay={false}
  muted={true}
  onPlay={() => {
    // Track video view in analytics
    console.log('User started watching campus tour');
  }}
/>
```

---

**Status**: ✅ Ready for production  
**Last Updated**: May 5, 2026  
**Framework**: React 18 + TypeScript + Framer Motion  
**Styling**: Tailwind CSS 3
