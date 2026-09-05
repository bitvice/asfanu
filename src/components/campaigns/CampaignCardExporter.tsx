'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';

interface CampaignCardExporterProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  fileName?: string;
}

export async function generateCardPdfBase64(el: HTMLDivElement): Promise<string> {
  if (document.fonts) {
    await document.fonts.ready;
  }

  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(el, {
    scale: 3, // High-DPI resolution (~300 DPI print quality, crisp & light)
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 0,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
    width: el.offsetWidth,
    height: el.offsetHeight,
    onclone: (clonedDoc) => {
      const cardEl = clonedDoc.querySelector('[data-card-export="true"]') as HTMLElement;
      if (cardEl) {
        cardEl.style.setProperty('-webkit-font-smoothing', 'antialiased');
        cardEl.style.textRendering = 'optimizeLegibility';
      }
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 277;
  const pdfHeight = (277 * 270) / 428;
  const x = (297 - pdfWidth) / 2;
  const y = (210 - pdfHeight) / 2;

  pdf.addImage(imgData, 'JPEG', x, y, pdfWidth, pdfHeight, undefined, 'FAST');
  return pdf.output('datauristring');
}

export function CampaignCardExporter({ cardRef, fileName = 'cupon-asfanu' }: CampaignCardExporterProps) {
  const [exportingType, setExportingType] = React.useState<'png' | 'pdf' | null>(null);

  async function handleExportPNG() {
    if (!cardRef.current) {
      console.warn('CampaignCardExporter: cardRef.current is null');
      return;
    }
    setExportingType('png');

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const el = cardRef.current;
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, {
        scale: 4, // Crisp 300+ DPI print quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 0,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: el.offsetWidth,
        height: el.offsetHeight,
        onclone: (clonedDoc) => {
          const cardEl = clonedDoc.querySelector('[data-card-export="true"]') as HTMLElement;
          if (cardEl) {
            cardEl.style.setProperty('-webkit-font-smoothing', 'antialiased');
            cardEl.style.textRendering = 'optimizeLegibility';
          }
        },
      });

      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export PNG failed:', err);
      alert('Eroare la generarea fișierului PNG. Vă rugăm încercați din nou.');
    } finally {
      setExportingType(null);
    }
  }

  async function handleExportPDF() {
    if (!cardRef.current) {
      console.warn('CampaignCardExporter: cardRef.current is null');
      return;
    }
    setExportingType('pdf');

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const el = cardRef.current;
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(el, {
        scale: 3, // High DPI print resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: el.offsetWidth,
        height: el.offsetHeight,
        onclone: (clonedDoc) => {
          const cardEl = clonedDoc.querySelector('[data-card-export="true"]') as HTMLElement;
          if (cardEl) {
            cardEl.style.setProperty('-webkit-font-smoothing', 'antialiased');
            cardEl.style.textRendering = 'optimizeLegibility';
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      
      // Standard A4 Landscape PDF format (297mm x 210mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Fit card proportionally on A4 Landscape with 10mm margins
      const pdfWidth = 277; // 297mm - 20mm margins
      const pdfHeight = (277 * 270) / 428; // ~174.7mm
      const x = (297 - pdfWidth) / 2; // 10mm margin left
      const y = (210 - pdfHeight) / 2; // ~17.6mm margin top

      pdf.addImage(imgData, 'JPEG', x, y, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error('Export PDF failed:', err);
      alert('Eroare la generarea fișierului PDF. Vă rugăm încercați din nou.');
    } finally {
      setExportingType(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPNG}
        disabled={exportingType !== null}
        className="text-xs gap-1.5 font-medium"
      >
        {exportingType === 'png' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{exportingType === 'png' ? 'Se descarcă PNG...' : 'Descarcă PNG'}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={exportingType !== null}
        className="text-xs gap-1.5 font-medium"
      >
        {exportingType === 'pdf' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
        ) : (
          <FileText className="w-3.5 h-3.5" />
        )}
        <span>{exportingType === 'pdf' ? 'Se descarcă PDF...' : 'Descarcă PDF'}</span>
      </Button>
    </div>
  );
}
