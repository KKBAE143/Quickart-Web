import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Quickart'
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://quickart.app'
const DEFAULT_IMAGE = '/logo.png'
const TWITTER_HANDLE = '@quickart'

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
      <meta property="og:image" content={image?.startsWith('http') ? image : `${SITE_URL}${image}`} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type === 'product' ? 'product' : 'website'} />
      <meta property="og:locale" content="en_IN" />

      {/* ===== Twitter Cards ===== */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image?.startsWith('http') ? image : `${SITE_URL}${image}`} />

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
