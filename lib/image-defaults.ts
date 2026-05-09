/**
 * Fallback URLs must use hosts allowed in next.config.js `images.remotePatterns`.
 * Avoid `/images/...` or `/placeholder.jpg` — those files are not shipped in this repo.
 */
export const IMG_FALLBACK_PRODUCT =
  'https://via.placeholder.com/800x800/f3f4f6/9ca3af?text=Nazaraty'

export const IMG_FALLBACK_SMALL =
  'https://via.placeholder.com/128x128/f3f4f6/9ca3af?text=%E2%80%94'

/** Hero / carousel fallback when settings row is missing */
export const IMG_FALLBACK_HERO =
  'https://images.unsplash.com/photo-1577803640713-968371208f31?w=1920&q=80'

/** Category pills when `category.image` is null */
export const CATEGORY_IMAGE_FALLBACKS = [
  'https://images.unsplash.com/photo-1577803640713-968371208f31?w=128&h=128&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511499767150-a48a237e0083?w=128&h=128&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579686385129-b041ba745efe?w=128&h=128&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=128&h=128&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509697485642-9891a6e9920e?w=128&h=128&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=128&h=128&fit=crop&q=80',
] as const
