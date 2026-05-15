'use client';

import React from 'react';
import type { HomepageFunnelStats } from '@/lib/homepageFunnel';
import { formatFunnelRate } from '@/lib/homepageFunnel';

const STEP_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];
const el = (tag: 'div' | 'section' | 'p' | 'span' | 'h2' | 'strong') => tag;

type Props = {
  funnel: HomepageFunnelStats;
  dateRangeLabel: string;
};

export default function HomepageFunnelPanel({ funnel, dateRangeLabel }: Props) {
  const maxCount = Math.max(...funnel.steps.map((s) => s.count), 1);
  const missingContractTracking =
    funnel.heroClicks > 0 && funnel.contractPageViews === 0;

  return React.createElement(
    el('section'),
    {
      style: {
        background: 'white',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
    },
    React.createElement(
      el('div'),
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        },
      },
      React.createElement(el('div'), null, [
        React.createElement(
          el('h2'),
          { key: 'h', style: { margin: '0 0 4px 0', fontSize: '1.25rem', color: '#111827' } },
          'Startsida-funnel'
        ),
        React.createElement(
          el('p'),
          { key: 'p', style: { margin: 0, fontSize: '0.875rem', color: '#6b7280' } },
          `${dateRangeLabel} · Volym per steg (samma besökare kan räknas flera gånger)`
        ),
      ]),
      React.createElement(
        el('div'),
        {
          key: 'imp',
          style: {
            padding: '8px 12px',
            background: '#f0f9ff',
            borderRadius: 8,
            fontSize: '0.8rem',
            color: '#0369a1',
            maxWidth: 320,
          },
        },
        'Hero-visningar: ',
        React.createElement(el('strong'), null, funnel.heroImpressions.toLocaleString('sv-SE')),
        funnel.homepageViews > 0
          ? ` (mot startsida: ${formatFunnelRate(
              funnel.heroImpressions > 0
                ? (funnel.heroImpressions / funnel.homepageViews) * 100
                : null
            )})`
          : ''
      )
    ),
    missingContractTracking
      ? React.createElement(
          el('div'),
          {
            style: {
              marginBottom: 16,
              padding: 12,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 8,
              fontSize: '0.875rem',
              color: '#92400e',
            },
          },
          React.createElement(el('strong'), null, 'Ingen data på avtalssidan ännu. '),
          'Hero-klick registreras, men besök på /rorligt-avtal-v2 spårades inte tidigare. Efter deploy börjar steg 3 fyllas på.'
        )
      : null,
    React.createElement(
      el('div'),
      { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
      funnel.steps.map((step, index) => {
        const widthPct = Math.max((step.count / maxCount) * 100, step.count > 0 ? 4 : 0);
        const color = STEP_COLORS[index] ?? '#6b7280';

        return React.createElement(
          el('div'),
          { key: step.id },
          React.createElement(
            el('div'),
            {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
                flexWrap: 'wrap',
                gap: 8,
              },
            },
            React.createElement(
              el('div'),
              null,
              React.createElement(
                el('span'),
                { style: { fontWeight: 600, color: '#111827' } },
                step.label
              ),
              React.createElement(
                el('span'),
                { style: { fontSize: '0.8rem', color: '#9ca3af', marginLeft: 8 } },
                step.description
              )
            ),
            React.createElement(
              el('div'),
              { style: { textAlign: 'right' } },
              React.createElement(
                el('span'),
                { style: { fontSize: '1.35rem', fontWeight: 700, color } },
                step.count.toLocaleString('sv-SE')
              ),
              step.rateFromPrevious !== null
                ? React.createElement(
                    el('span'),
                    { style: { fontSize: '0.8rem', color: '#6b7280', marginLeft: 10 } },
                    ` från föregående: ${formatFunnelRate(step.rateFromPrevious)}`
                  )
                : null,
              step.rateFromStart !== null && index > 0
                ? React.createElement(
                    el('span'),
                    { style: { fontSize: '0.8rem', color: '#9ca3af', marginLeft: 8 } },
                    ` av startsida: ${formatFunnelRate(step.rateFromStart)}`
                  )
                : null
            )
          ),
          React.createElement(
            el('div'),
            {
              style: {
                height: 28,
                background: '#f3f4f6',
                borderRadius: 6,
                overflow: 'hidden',
              },
            },
            React.createElement(el('div'), {
              style: {
                height: '100%',
                width: `${widthPct}%`,
                background: color,
                borderRadius: 6,
                transition: 'width 0.35s ease',
                minWidth: step.count > 0 ? 4 : 0,
              },
            })
          ),
          index < funnel.steps.length - 1
            ? React.createElement(
                el('div'),
                {
                  style: {
                    textAlign: 'center',
                    color: '#d1d5db',
                    fontSize: '1.1rem',
                    lineHeight: 1,
                    margin: '4px 0',
                  },
                  'aria-hidden': true,
                },
                '↓'
              )
            : null
        );
      })
    ),
    React.createElement(
      el('p'),
      {
        style: { margin: '16px 0 0', fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.5 },
      },
      'Tolkning: Jämför steg-för-steg var flest hoppa av. Hero-CTR kan bli hög om samma person klickar flera gånger medan visning räknas en gång per dag. Affiliate är slutmålet för intäkt.'
    )
  );
}
