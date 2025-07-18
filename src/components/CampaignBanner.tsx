"use client";
import styled from "styled-components";

const Banner = styled.div`
  width: 100%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  text-align: center;
  padding: 1.2rem 0.5rem;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: var(--glass-shadow-light);
  z-index: 2000;
  position: relative;
`;

const Highlight = styled.span`
  color: #FFD700;
  background: rgba(255, 215, 0, 0.2);
  padding: 0.1em 0.4em;
  border-radius: 0.4em;
  margin: 0 0.2em;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 215, 0, 0.3);
`;

const StyledLink = styled.a`
  color: #FFD700;
  margin: 0 0.2em;
  text-decoration: underline;
  font-weight: 700;
  transition: color 0.2s;
  
  &:hover {
    color: #FFED4E;
  }
`;

export default function CampaignBanner() {
  return (
    <Banner>
      🎉 Vi skänker bort el för <Highlight>1 miljon kronor!</Highlight>
      Alla som registrerar sig för
      <StyledLink href="https://www.svekraft.com/elchef-rorligt/" target="_blank" rel="noopener noreferrer">Rörligt avtal</StyledLink>
      får <Highlight>500 kr rabatt</Highlight> med koden <Highlight>Elchef500</Highlight>!
    </Banner>
  );
} 