/**
 * Sitemap Generator for Quickart
 *
 * Generates sitemap.xml and robots.txt for SEO.
 * Run: node scripts/generate-sitemap.js
 *
 * This script calls the Quickart API to fetch all categories and products,
 * then generates a sitemap.xml file in the client/public/ directory.
 */

const fs = require('fs')
const path = require('path')

// ============================================================
// CONFIGURATION — Update these for your environment
// ============================================================
const SITE_URL = process.env.VITE_SITE_URL || 'https://quickart.app'
const API_BASE = process.env.API_BASE || 'http://localhost:5000/api'
const OUTPUT_DIR = path.resolve(__dirname, '../client/public')

// ============================================================
// Static Routes
// ============================================================
const STATIC_ROUTES = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/login', priority: '0.3', changefreq: 'monthly' },
  { loc: '/register', priority: '0.3', changefreq: 'monthly' },
  { loc: '/forgot-password', priority: '0.2', changefreq: 'monthly' },
  { loc: '/register-rider', priority: '0.2', changefreq: 'monthly' },
]

// ============================================================
// Generate Sitemap XML
// ============================================================
function generateSitemapXml(urls) {
  const urlset = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(SITE_URL + u.loc)}</loc>
    <changefreq>${u.changefreq || 'weekly'}</changefreq>
    <priority>${u.priority || '0.5'}</priority>
  </url>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ============================================================
// Generate robots.txt
// ============================================================
function generateRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /login
Disallow: /register
Disallow: /register-rider
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /dashboard/*
Disallow: /delivery/*
Disallow: /admin/*

Sitemap: ${SITE_URL}/sitemap.xml
`
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('📍 Generating sitemap for:', SITE_URL)
  console.log('📡 Fetching data from:', API_BASE)
  console.log('')

  const allUrls = [...STATIC_ROUTES]

  // Fetch categories for dynamic URLs
  try {
    const catRes = await fetch(`${API_BASE}/category/get`)
    if (catRes.ok) {
      const catData = await catRes.json()
      if (catData.success && catData.data?.length) {
        console.log(`📂 Found ${catData.data.length} categories`)
        for (const cat of catData.data) {
          allUrls.push({
            loc: `/category/${encodeURIComponent(cat.name?.toLowerCase().replace(/\s+/g, '-'))}-${cat._id}`,
            priority: '0.8',
            changefreq: 'weekly',
          })
        }
      }
    }
  } catch (err) {
    console.warn('⚠️  Could not fetch categories (API may be offline):', err.message)
    console.log('   Continuing with static routes only...')
  }

  // Fetch products for product detail URLs
  try {
    const prodRes = await fetch(`${API_BASE}/product/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: 1, limit: 1000 })
    })
    if (prodRes.ok) {
      const prodData = await prodRes.json()
      if (prodData.success && prodData.data?.length) {
        console.log(`📦 Found ${prodData.data.length} products`)
        for (const prod of prodData.data) {
          allUrls.push({
            loc: `/product/${encodeURIComponent(prod.name?.toLowerCase().replace(/\s+/g, '-'))}-${prod._id}`,
            priority: '0.9',
            changefreq: 'daily',
          })
        }
      }
    }
  } catch (err) {
    console.warn('⚠️  Could not fetch products (API may be offline):', err.message)
    console.log('   Generating sitemap with static routes only...')
  }

  // Write sitemap.xml
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const sitemapPath = path.join(OUTPUT_DIR, 'sitemap.xml')
  fs.writeFileSync(sitemapPath, generateSitemapXml(allUrls), 'utf-8')
  console.log(`\n✅ Sitemap generated: ${sitemapPath} (${allUrls.length} URLs)`)

  // Write robots.txt
  const robotsPath = path.join(OUTPUT_DIR, 'robots.txt')
  fs.writeFileSync(robotsPath, generateRobotsTxt(), 'utf-8')
  console.log(`✅ Robots.txt generated: ${robotsPath}`)

  console.log('\n🎉 Done!')
}

main().catch((err) => {
  console.error('❌ Sitemap generation failed:', err)
  process.exit(1)
})
