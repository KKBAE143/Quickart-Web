import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Quickart'
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://quickart.com'
const DEFAULT_IMAGE = '/logo.png'
const TWITTER_HANDLE = '@quickart'

// OG image standard dimensions (Facebook, WhatsApp, Twitter)
const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

/**
 * Resolve the final absolute URL for an image.
 * - If it's already an absolute URL (http), use as-is
 * - If it's a Cloudinary URL, add OG-friendly transformations
 * - Otherwise, prepend SITE_URL
 */
function resolveOgImage(image) {
  if (!image) return `${SITE_URL}${DEFAULT_IMAGE}`

  if (image.startsWith('http')) {
    // Cloudinary — add transformations for optimal OG preview size
    if (image.includes('res.cloudinary.com')) {
      // Insert transformation params after '/image/upload/'
      const transform = `w_${OG_IMAGE_WIDTH},h_${OG_IMAGE_HEIGHT},c_fill,f_auto,q_auto`
      const uploadMarker = '/image/upload/'
      const idx = image.indexOf(uploadMarker)
      if (idx !== -1) {
        const base = image.slice(0, idx + uploadMarker.length)
        const rest = image.slice(idx + uploadMarker.length)
        // Avoid double-transformations (if already has params)
        if (rest.startsWith('v') || /^\d+/.test(rest)) {
          return `${base}${transform}/${rest}`
        }
      }
    }
    return image
  }

  // Relative path — prepend site URL
  return `${SITE_URL}${image}`
}

/**
 * SEO component — injects meta tags, Open Graph, Twitter Cards, and JSON-LD.
 *
 * Usage:
 *   <SEO title="Product Name" description="..." image="..." />
 *   <SEO title="Category" description="..." />
 *   <SEO type="product" product={{ name, description, image, price, ... }} />
 */
const SEO = ({
  title,
  description = 'Quickart — Your go-to quick commerce platform for groceries, essentials, and more. Fast delivery in 10 minutes.',
  image = DEFAULT_IMAGE,
  url,
  type = 'website',        // website, article, product
  publishedTime,
  author,
  noindex = false,
  nofollow = false,
  // Product-specific props for rich snippets
  product,
  // Category-specific
  category,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Fresh & Fast Delivery`
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL
  const robots = noindex || nofollow
    ? `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`
    : 'index, follow'

  const ogImageUrl = resolveOgImage(image)

  return (
    <Helmet>
      {/* ===== Standard Meta Tags ===== */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      {/* ===== Open Graph ===== */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:image:width" content={OG_IMAGE_WIDTH} />
      <meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
      <meta property="og:locale" content="en_IN" />

      {/* ===== Twitter Cards ===== */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* ===== Article Meta ===== */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* ===== JSON-LD Structured Data ===== */}
      {type === 'product' && product && product?.name && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description || description,
            image: product.image?.[0] || image,
            ...(product.sku && { sku: product.sku }),
            ...(product.brand && {
              brand: { '@type': 'Brand', name: product.brand }
            }),
            ...(product.category && {
              category: product.category
            }),
            offers: {
              '@type': 'Offer',
              price: product.discount
                ? (product.price - (product.price * product.discount / 100)).toFixed(2)
                : product.price?.toFixed(2),
              priceCurrency: 'INR',
              availability: product.stock !== undefined
                ? (product.stock > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock')
                : undefined,
              url: canonicalUrl,
            },
            ...(product.rating && product.rating > 0 && {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.reviewCount || 0,
              }
            })
          })}
        </script>
      )}

      {type === 'website' && category && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${category} - ${SITE_NAME}`,
            description: description,
          })}
        </script>
      )}

      {/* ===== Breadcrumb structured data ===== */}
      {type === 'collection' && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
              { '@type': 'ListItem', position: 2, name: category || 'Category', item: canonicalUrl },
            ]
          })}
        </script>
      )}
    </Helmet>
  )
}

export default SEO
