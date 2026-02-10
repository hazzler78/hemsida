import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
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
    openGraph: {
      title: `${post.title} | Elchef.se`,
      description: post.description,
      url: `https://www.elchef.se/kunskap/${post.slug}`,
      type: 'article',
    },
};
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return notFound();
  }

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
              <Link href="/jamfor-elpriser">vår AI-analys av elräkningen</Link> och gå sedan vidare till{' '}
              <Link href="/byt-elavtal">Byt elavtal</Link> om du vill byta till ett mer fördelaktigt avtal.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}

