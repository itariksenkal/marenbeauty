import type { Metadata } from 'next';

import { LegalDocumentPage } from '@/components/content/LegalDocumentPage';
import { getAllLegalDocuments, getLegalDocument } from '@/content-layer';

const SLUG = 'kullanim-kosullari';

export const metadata: Metadata = {
  title: getLegalDocument(SLUG).title,
  description: getLegalDocument(SLUG).summary,
};

export default function TermsPage() {
  const document = getLegalDocument(SLUG);
  const others = getAllLegalDocuments().filter((doc) => doc.slug !== SLUG);

  return <LegalDocumentPage document={document} others={others} />;
}
