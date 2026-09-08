"use client";

import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { isPdfFile, pdfToJpeg } from '@/lib/pdfToJpeg';
import { getOrCreateSessionId } from '@/lib/sessionId';
import { trackFunnelEvent } from '@/lib/trackFunnelEvent';

const BillUploadContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: 18px;
  padding: 1.5rem 1.2rem;
  margin: 8px 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--glass-shadow-light);
`;

const Title = styled.h3`
  margin: 0 0 12px 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #17416b;
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Description = styled.p`
  margin: 0 0 16px 0;
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.5;
`;

const UploadArea = styled.div<{ $isDragOver: boolean; $hasFile: boolean }>`
  border: 2px dashed ${props => props.$hasFile ? 'var(--primary)' : props.$isDragOver ? 'var(--primary)' : 'rgba(148, 163, 184, 0.5)'};
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  background: ${props => props.$hasFile ? 'rgba(0, 106, 167, 0.05)' : 'rgba(248, 250, 252, 0.8)'};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    border-color: var(--primary);
    background: rgba(0, 106, 167, 0.05);
  }
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 8px;
  opacity: 0.7;
`;

const UploadText = styled.div`
  font-size: 0.95rem;
  color: #64748b;
  margin-bottom: 4px;
`;

const UploadSubtext = styled.div`
  font-size: 0.85rem;
  color: #94a3b8;
`;

const FileInfo = styled.div`
  background: rgba(0, 106, 167, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin: 12px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FileName = styled.span`
  font-size: 0.9rem;
  color: #17416b;
  font-weight: 500;
`;

const RemoveButton = styled.button`
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
`;

const ConsentCheckbox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 16px 0;
  padding: 12px;
  background: rgba(0, 106, 167, 0.05);
  border-radius: 8px;
`;

const Checkbox = styled.input`
  width: 1.1rem;
  height: 1.1rem;
  accent-color: var(--primary);
  margin-top: 2px;
`;

const CheckboxLabel = styled.label`
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
  cursor: pointer;
`;

const AnalyzeButton = styled.button`
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
  padding: 0.9rem 1.7rem;
  border: none;
  border-radius: 999px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--glass-shadow-light);
  width: 100%;
  margin-top: 8px;

  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--glass-shadow-medium);
    background: linear-gradient(135deg, var(--primary-dark), var(--secondary-dark));
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    transform: none;
  }
`;

const Message = styled.div<{ $type: 'success' | 'error' }>`
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  margin-top: 8px;
  background: ${props => props.$type === 'success' ? '#dcfce7' : '#fef2f2'};
  color: ${props => props.$type === 'success' ? '#166534' : '#dc2626'};
  border: 1px solid ${props => props.$type === 'success' ? '#bbf7d0' : '#fecaca'};
`;

interface BillUploadProps {
  onAnalyzed?: (result: string) => void;
}

export default function BillUpload({ onAnalyzed }: BillUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [convertingPdf, setConvertingPdf] = useState(false);
  const [pdfInfo, setPdfInfo] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>('');

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
  }, []);

  const handleFileChange = async (selectedFile: File) => {
    setError('');
    setPdfInfo('');
    // Validate file size (20MB max)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('Filen är för stor. Max storlek är 20MB');
      return;
    }

    if (isPdfFile(selectedFile)) {
      setConvertingPdf(true);
      try {
        const converted = await pdfToJpeg(selectedFile, 3, 2);
        setFile(converted.file);
        setPdfInfo(
          converted.pageCount > 1
            ? `${selectedFile.name} (${converted.pageCount} sidor konverterade)`
            : selectedFile.name,
        );
      } catch (convErr) {
        console.error('PDF-konvertering misslyckades:', convErr);
        setFile(null);
        setPdfInfo('');
        setError(
          'Kunde inte läsa PDF:en. Prova att ladda upp en skärmdump eller foto av fakturan i stället (JPG/PNG).',
        );
      } finally {
        setConvertingPdf(false);
      }
      return;
    }

    // Validate image file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Endast JPG, PNG eller PDF stöds');
      return;
    }

    setFile(selectedFile);
    setPdfInfo('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileChange(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError('');
    setPdfInfo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!file || !consent) return;

    setLoading(true);
    setError('');

    try {
      trackFunnelEvent('ocr_started', {
        path: '/grokchat-bill-upload',
        meta: { file_type: file.type, file_size: file.size },
      });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('consent', String(consent));

      const response = await fetch('/api/gpt-ocr', {
        method: 'POST',
        body: formData,
        headers: {
          'x-session-id': sessionIdRef.current || '',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Något gick fel vid analysen');
      }

      const data = await response.json();
      
      if (!data.gptAnswer) {
        throw new Error('Inget svar från AI:n');
      }

      // Check if AI returned an error message
      if (data.gptAnswer.includes("I'm sorry") || data.gptAnswer.includes("can't assist") || 
          data.gptAnswer.includes("Tyvärr") || data.gptAnswer.includes("kan inte") ||
          data.gptAnswer.includes("Jag kan inte") || data.gptAnswer.includes("kan inte hjälpa")) {
        throw new Error('AI:n kunde inte analysera fakturan. Kontrollera att bilden är tydlig och innehåller en elräkning.');
      }

      // Clean up mathematical formulas from the response
      let cleanedResult = data.gptAnswer;
      cleanedResult = cleanedResult.replace(/\( \\frac\{[^}]+\}\{[^}]+\} = [^)]+ \)/g, '');
      cleanedResult = cleanedResult.replace(/\( [^)]*\+[^)]* = [^)]+ \)/g, '');

      if (onAnalyzed) {
        onAnalyzed(cleanedResult);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Något gick fel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BillUploadContainer>
      <Title>
        📄 Analysera din elräkning
      </Title>
      
      <Description>
        Ladda upp en bild av din elräkning så analyserar vår AI den och visar exakt hur mycket du kan spara.
      </Description>

      {error && (
        <Message $type="error">
          ❌ {error}
        </Message>
      )}

      <UploadArea
        $isDragOver={isDragOver}
        $hasFile={!!file}
        onClick={() => { if (!convertingPdf) fileInputRef.current?.click(); }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={convertingPdf ? { pointerEvents: 'none', opacity: 0.7 } : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,application/pdf,.pdf"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={convertingPdf}
        />
        
        {convertingPdf ? (
          <FileInfo>
            <FileName>Konverterar PDF…</FileName>
          </FileInfo>
        ) : file ? (
          <FileInfo>
            <FileName>{pdfInfo || file.name}</FileName>
            <RemoveButton onClick={(e) => { e.stopPropagation(); removeFile(); }}>
              Ta bort
            </RemoveButton>
          </FileInfo>
        ) : (
          <>
            <UploadIcon>📁</UploadIcon>
            <UploadText>Klicka för att välja fil eller dra och släpp här</UploadText>
            <UploadSubtext>JPG, PNG eller PDF • Max 20MB</UploadSubtext>
          </>
        )}
      </UploadArea>

      <ConsentCheckbox>
        <Checkbox
          type="checkbox"
          id="billConsent"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <CheckboxLabel htmlFor="billConsent">
          Jag samtycker till att min elräkning lagras säkert för analys och förbättring av tjänsten. 
          Alla uppgifter behandlas enligt vår integritetspolicy.
        </CheckboxLabel>
      </ConsentCheckbox>

      <AnalyzeButton 
        onClick={handleAnalyze} 
        disabled={!file || !consent || loading || convertingPdf}
      >
        {convertingPdf ? 'Konverterar…' : loading ? 'Analyserar...' : 'Analysera elräkning'}
      </AnalyzeButton>
    </BillUploadContainer>
  );
}
