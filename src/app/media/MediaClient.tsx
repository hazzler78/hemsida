'use client';

import styled from 'styled-components';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';

const Section = styled.section`
  padding: var(--section-spacing) 0;
  background: transparent;
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255,255,255,0.95);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow-light);
  padding: 3rem 2rem;
`;

const Title = styled.h1`
  font-size: 2.2rem;
  margin-bottom: 1.5rem;
  color: var(--primary);
`;

const Lead = styled.p`
  font-size: 1.2rem;
  color: var(--gray-700);
  margin-bottom: 2rem;
`;

const PageBackground = styled.div`
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(120deg, rgba(0,106,167,0.10) 0%, rgba(254,204,0,0.10) 100%);
  padding: 0;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 2rem;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2.5rem;
  }
`;

const MediaCard = styled(Link)<{ isExpanded: boolean }>`
  background: rgba(255,255,255,0.95);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow-light);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: block;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--glass-shadow-heavy);
    border-color: rgba(0, 106, 167, 0.3);
    text-decoration: none;
    color: inherit;
  }
  
  ${props => props.isExpanded && `
    transform: translateY(-2px);
    box-shadow: var(--glass-shadow-heavy);
    border-color: var(--primary);
  `}
`;

const CardImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  
  @media (max-width: 600px) {
    height: 160px;
  }
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
`;

const CardTitle = styled.h2`
  font-size: 1.4rem;
  margin: 0 0 0.5rem 0;
  color: var(--primary);
  line-height: 1.3;
  
  @media (max-width: 600px) {
    font-size: 1.2rem;
  }
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: var(--gray-500);
`;

const CardTag = styled.span`
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
`;

const ExpandIcon = styled.div`
  margin-left: auto;
  
  svg {
    width: 20px;
    height: 20px;
    color: var(--primary);
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(0, 106, 167, 0.1);
  }
  
  &::placeholder {
    color: var(--gray-600);
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.active ? 'var(--primary)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: var(--radius-full);
  background: ${props => props.active ? 'var(--primary)' : 'rgba(255, 255, 255, 0.9)'};
  color: ${props => props.active ? 'white' : 'var(--gray-700)'};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  
  &:hover {
    background: ${props => props.active ? 'var(--primary-dark)' : 'rgba(0, 106, 167, 0.1)'};
    transform: translateY(-1px);
  }
`;

const MarkdownContent = styled.div`
  color: var(--gray-700);
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  
  h1, h2, h3 {
    color: var(--primary);
    margin: 0.5rem 0;
    font-size: 1rem;
  }
  
  h1 { font-size: 1.1rem; }
  h2 { font-size: 1.05rem; }
  h3 { font-size: 1rem; }
`;

export type SharedCard = {
  id: number;
  title: string;
  summary: string;
  url: string;
  image_url?: string | null;
  created_at: string;
  type?: string;
  tag?: string;
  readTime?: string;
  href?: string;
  date?: string;
};

function categorize(url: string, title: string, summary: string) {
  const domain = new URL(url).hostname.toLowerCase();
  const content = `${title} ${summary}`.toLowerCase();
  if (domain.includes('youtube') || content.includes('video')) return { type: 'video', tag: 'Video' };
  if (domain.includes('linkedin') || content.includes('linkedin')) return { type: 'article', tag: 'LinkedIn' };
  if (domain.includes('twitter') || domain.includes('x.com')) return { type: 'social', tag: 'Social' };
  if (content.includes('nyhet')) return { type: 'news', tag: 'Nyheter' };
  return { type: 'article', tag: 'Artikel' };
}

function renderMarkdown(summary: string) {
  const safe = String(summary || '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  return safe.startsWith('<p>') ? safe : `<p>${safe}</p>`;
}

export default function MediaClient({ initialCards }: { initialCards: SharedCard[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const cards = useMemo(() => {
    return initialCards.map((c) => {
      const cat = categorize(c.url, c.title, c.summary);
      return { ...c, type: cat.type, tag: cat.tag, href: c.url, date: new Date(c.created_at).getFullYear().toString() };
    });
  }, [initialCards]);

  const filtered = useMemo(() => {
    let f = cards;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      f = f.filter((c) => c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q));
    }
    if (activeFilter !== 'all') {
      f = f.filter((c) => c.type === activeFilter);
    }
    return f;
  }, [cards, searchTerm, activeFilter]);

  return (
    <PageBackground>
      <Section>
        <Container>
          <Title>Media</Title>
          <Lead>
            <b>Vi arbetar aktivt med att sprida kunskap om energibesparing och hållbara elavtal.</b>
          </Lead>
          <p>
            Läs mer om vårt arbete och våra senaste nyheter, eller upptäck våra rapporter och analyser om elmarknaden.
          </p>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            <Link href="/fakturaanalys" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
              Analysera din elräkning
            </Link>
            {' · '}
            <Link href="/byt-elavtal" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
              Byt elavtal
            </Link>
            {' · '}
            <Link href="/kunskap" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
              Kunskapsbank
            </Link>
          </p>

          <SearchContainer>
            <SearchInput placeholder="Sök artiklar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <FilterContainer>
              {[
                { k: 'all', n: 'Alla' },
                { k: 'video', n: 'Video' },
                { k: 'article', n: 'Artiklar' },
                { k: 'news', n: 'Nyheter' },
                { k: 'social', n: 'Social' },
              ].map((b) => (
                <FilterButton key={b.k} active={activeFilter === b.k} onClick={() => setActiveFilter(b.k)}>
                  {b.n}
                </FilterButton>
              ))}
            </FilterContainer>
          </SearchContainer>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>Inga artiklar hittades</div>
          ) : (
            <CardsGrid>
              {filtered.map((card) => (
                <MediaCard key={card.id} href={card.href || card.url} isExpanded={false} target="_blank" rel="noopener noreferrer">
                  {card.image_url && (
                    <CardImage
                      src={`/api/image-proxy?src=${encodeURIComponent(card.image_url)}`}
                      alt={card.title}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <CardHeader>
                    <CardTitle>{card.title}</CardTitle>
                    <MarkdownContent dangerouslySetInnerHTML={{ __html: renderMarkdown(card.summary || '') }} />
                    <CardMeta>
                      <CardTag>{card.tag}</CardTag>
                      <span>{card.date}</span>
                      <ExpandIcon>
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </ExpandIcon>
                    </CardMeta>
                  </CardHeader>
                </MediaCard>
              ))}
            </CardsGrid>
          )}
        </Container>
      </Section>
    </PageBackground>
  );
}
