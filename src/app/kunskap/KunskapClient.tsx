"use client";

import styled from 'styled-components';
import Link from 'next/link';
import { blogPosts } from '@/lib/blogPosts';

const PageBackground = styled.div`
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(120deg, rgba(0, 106, 167, 0.12) 0%, rgba(254, 204, 0, 0.12) 100%);
`;

const Section = styled.section`
  padding: var(--section-spacing) 0;
`;

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: var(--glass-shadow-medium);
  padding: 3rem 2rem;
`;

const Title = styled.h1`
  font-size: 2.2rem;
  margin-bottom: 1rem;
  color: var(--primary);
`;

const Lead = styled.p`
  font-size: 1.1rem;
  color: var(--gray-700);
  margin-bottom: 2rem;
`;

const PostsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
`;

const PostCard = styled(Link)`
  display: block;
  padding: 1.5rem 1.75rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: var(--glass-shadow-light);
  text-decoration: none;
  color: inherit;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--glass-shadow-heavy);
    border-color: rgba(0, 106, 167, 0.3);
    text-decoration: none;
  }
`;

const PostTitle = styled.h2`
  font-size: 1.4rem;
  margin: 0 0 0.5rem 0;
  color: var(--primary);
`;

const PostMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: var(--gray-500);
  margin-bottom: 0.75rem;
`;

const Badge = styled.span`
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: rgba(0, 106, 167, 0.08);
  color: var(--primary);
  font-weight: 600;
  font-size: 0.8rem;
`;

const PostExcerpt = styled.p`
  font-size: 0.95rem;
  color: var(--gray-700);
  margin: 0.25rem 0 0;
`;

export default function KunskapClient() {
  const sortedPosts = [...blogPosts].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <PageBackground>
      <Section>
        <Container>
          <Title>Kunskap om elavtal och elpriser</Title>
          <Lead>
            Här samlar vi guider och artiklar om hur du väljer rätt elavtal, sänker elräkningen och förstår
            elpriset i Sverige. Perfekt att läsa innan du använder vår AI-analys eller byter elavtal.
          </Lead>

          <PostsGrid>
            {sortedPosts.map((post) => (
              <PostCard key={post.slug} href={`/kunskap/${post.slug}`}>
                <PostTitle>{post.title}</PostTitle>
                <PostMeta>
                  <span>{new Date(post.date).toLocaleDateString('sv-SE')}</span>
                  {post.readTime && <span>{post.readTime}</span>}
                  <Badge>Guide</Badge>
                </PostMeta>
                <PostExcerpt>{post.description}</PostExcerpt>
              </PostCard>
            ))}
          </PostsGrid>

          <p style={{ marginTop: '2rem', fontSize: '0.95rem', color: 'var(--gray-600)' }}>
            Vill du direkt se om du kan spara pengar på ditt nuvarande avtal? Testa{' '}
            <Link href="/fakturaanalys">vår AI-analys av elräkningen</Link> eller gå vidare till{' '}
            <Link href="/byt-elavtal">Byt elavtal</Link> när du är redo att ta nästa steg.
          </p>
        </Container>
      </Section>
    </PageBackground>
  );
}
