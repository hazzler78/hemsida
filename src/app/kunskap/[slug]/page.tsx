import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import BreadcrumbJsonLd from '@/components/BreadcrumbJsonLd';
import { blogPosts, getBlogPostBySlug } from '@/lib/blogPosts';

type Params = {
  slug: string;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Artikel saknas | Elchef.se',
    };
  }

  return {
    title: `${post.title} | Elchef.se`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `/kunskap/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | Elchef.se`,
      description: post.description,
      url: `https://www.elchef.se/kunskap/${post.slug}`,
      type: 'article',
      images: [
        {
          url: '/og-share.png',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
};
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return notFound();
  }

  const otherPosts = blogPosts.filter((p) => p.slug !== slug);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: 'Elchef',
      url: 'https://www.elchef.se',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Elchef',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.elchef.se/elchef-logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.elchef.se/kunskap/${post.slug}`,
    },
  };

  return (
    <main className="container" style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--section-spacing) 0' }}>
      <BreadcrumbJsonLd
        id={`breadcrumb-kunskap-${post.slug}`}
        items={[
          { name: 'Hem', path: '/' },
          { name: 'Kunskap', path: '/kunskap' },
          { name: post.title, path: `/kunskap/${post.slug}` },
        ]}
      />
      <article
        style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: 'var(--glass-shadow-medium)',
          padding: '2.5rem 2rem',
        }}
      >
        <Script id={`article-json-ld-${post.slug}`} type="application/ld+json">
          {JSON.stringify(articleJsonLd)}
        </Script>
        <nav
          aria-label="Brödsmulor för kunskapsbanken"
          style={{
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'flex-start',
          }}
        >
          <Link
            href="/kunskap"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 999,
              border: '1px solid rgba(15,23,42,0.08)',
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 8px 24px rgba(15,23,42,0.1)',
              fontSize: '0.85rem',
              color: '#0f172a',
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: '1rem' }}>←</span>
            <span>Tillbaka till kunskapsbanken</span>
          </Link>
        </nav>
        <header style={{ marginBottom: '1.5rem' }}>
          <p
            style={{
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--primary)',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Kunskap
          </p>
          <h1
            style={{
              fontSize: '2rem',
              margin: '0 0 0.75rem 0',
              color: '#111827',
            }}
          >
            {post.title}
          </h1>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.85rem',
              color: 'var(--gray-500)',
            }}
          >
            <span>{new Date(post.date).toLocaleDateString('sv-SE')}</span>
            {post.readTime && <span>• {post.readTime}</span>}
          </div>
        </header>

        <div
          style={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            paddingTop: '1.5rem',
            color: '#374151',
            fontSize: '0.98rem',
            lineHeight: 1.65,
          }}
        >
          {/* Content sections with headings and lists */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {post.content}
          </div>

          <hr
            style={{
              margin: '2.5rem 0 1.5rem',
              border: 'none',
              borderTop: '1px solid rgba(0,0,0,0.06)',
            }}
          />

          <section
            aria-label="Nästa steg med Elchef"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              fontSize: '0.95rem',
            }}
          >
            <p>
              Vill du se hur mycket du kan spara med rätt elavtal? Börja med att testa{' '}
              <Link href="/fakturaanalys">vår AI-analys av elräkningen</Link> och gå sedan vidare till{' '}
              <Link href="/byt-elavtal">Byt elavtal</Link> om du vill byta till ett mer fördelaktigt avtal.
            </p>
          </section>

          {otherPosts.length > 0 && (
            <section
              aria-label="Fler guider i kunskapsbanken"
              style={{
                marginTop: '2.5rem',
                paddingTop: '1.75rem',
                borderTop: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <h2
                style={{
                  fontSize: '1.3rem',
                  marginBottom: '1rem',
                  color: '#0f172a',
                }}
              >
                Fler guider att läsa
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr)',
                  gap: '1rem',
                }}
              >
                {otherPosts.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/kunskap/${p.slug}`}
                    style={{
                      display: 'block',
                      padding: '0.9rem 1rem',
                      borderRadius: 12,
                      border: '1px solid rgba(15,23,42,0.06)',
                      background: 'rgba(255,255,255,0.96)',
                      boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                      textDecoration: 'none',
                      color: '#111827',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: '#6b7280',
                        marginBottom: '0.15rem',
                      }}
                    >
                      {new Date(p.date).toLocaleDateString('sv-SE')}
                    </div>
                    <div
                      style={{
                        fontSize: '0.98rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        marginBottom: '0.15rem',
                      }}
                    >
                      {p.title}
                    </div>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: '#4b5563',
                      }}
                    >
                      {p.description}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </main>
  );
}

