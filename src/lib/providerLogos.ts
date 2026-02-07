/**
 * Logo-URL:er som bundlas av Next.js så de alltid finns i produktion.
 * Använd för leverantörer där public-filen inte nås (t.ex. Motala).
 */
import motala from '../assets/motala.png';
export const MOTALA_LOGO_SRC: string = motala.src;
