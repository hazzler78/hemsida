import Link from 'next/link';
import type { BreadcrumbItem } from '@/lib/seo';

type Props = {
  items: BreadcrumbItem[];
};

export default function BreadcrumbNav({ items }: Props) {
  return (
    <nav
      aria-label="Brödsmulor"
      style={{
        marginBottom: '1rem',
        fontSize: '0.85rem',
        color: '#6b7280',
        lineHeight: 1.5,
      }}
    >
      <ol
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.35rem',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={item.path}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {index > 0 && (
                <span aria-hidden="true" style={{ color: '#9ca3af' }}>
                  /
                </span>
              )}
              {isLast ? (
                <span aria-current="page" style={{ color: '#374151', fontWeight: 500 }}>
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.path}
                  style={{ color: 'var(--primary)', textDecoration: 'none' }}
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
