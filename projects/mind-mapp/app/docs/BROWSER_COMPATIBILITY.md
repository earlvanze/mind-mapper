# Browser Compatibility Matrix

Mind Mapp targets **modern browsers** and uses feature detection for graceful degradation.

## Supported Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome  | 90+ | Full support including Web Share API |
| Firefox | 88+ | Full support |
| Safari  | 14+ | Clipboard requires user gesture |
| Edge    | 90+ | Full support (Chromium-based) |

## Mobile Support

| Platform | Support Level | Notes |
|----------|--------------|-------|
| iOS Safari | 14+ | Touch gestures, pinch-zoom |
| Chrome Android | 90+ | Touch gestures |
| Firefox Android | 88+ | Touch gestures |
| Samsung Internet | 14+ | Touch gestures |

## Feature Support Matrix

| Feature | Chrome | Firefox | Safari | Edge | Notes |
|---------|--------|---------|--------|------|-------|
| Canvas rendering | ✅ | ✅ | ✅ | ✅ | All modern versions |
| Clipboard API | ✅ | ✅ | ⚠️ | ✅ | Safari requires user gesture |
| Web Share API | ✅ | ❌ | ✅ | ✅ | Firefox fallback to clipboard |
| File API | ✅ | ✅ | ✅ | ✅ | For image uploads |
| CSS Grid | ✅ | ✅ | ✅ | ✅ | Layout engine |
| Intl API | ✅ | ✅ | ✅ | ✅ | Date/number formatting |
| Crypto API | ✅ | ✅ | ✅ | ✅ | Base64 encoding |
| Touch events | ✅ | ✅ | ✅ | ✅ | Pinch zoom support |

## Feature Detection

Mind Mapp uses `src/utils/browserUtils.ts` for runtime feature detection:

```typescript
import { getBrowserInfo, supportsClipboardAPI } from './browserUtils';

const info = getBrowserInfo();
// info.supportsClipboard, info.supportsWebShare, etc.
```

## Known Browser Issues

### Safari (all platforms)
- **Issue:** Clipboard API may require user gesture
- **Workaround:** Share link uses clipboard fallback

### Firefox Android
- **Issue:** Some CSS Grid layouts may not render correctly
- **Workaround:** Falls back to flexbox

### Chrome Android
- **Issue:** Touch events may conflict with pan/zoom gestures
- **Workaround:** Pinch-to-zoom toggle in settings

## Accessibility

- Keyboard navigation: All browsers
- Screen reader: ChromeVox, NVDA, VoiceOver
- `prefers-reduced-motion`: Respected in all browsers

## Build Output

Production build (~560KB gzipped) supports:
- Modern ES modules (98%+ coverage)
- CSS custom properties
- CSS Grid + Flexbox
