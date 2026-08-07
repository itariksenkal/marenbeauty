import type { Metadata } from 'next';

import { ConsentPreferences } from '@/components/analytics/ConsentPreferences';
import { LegalDocumentPage } from '@/components/content/LegalDocumentPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { standardGraph } from '@/lib/schema/graph';
import { pageMetadata } from '@/lib/seo/metadata';
import {
  getAllLegalDocuments,
  getAllServices,
  getLegalDocument,
} from '@/content-layer';

const SLUG = 'cerez-politikasi';

export const metadata: Metadata = pageMetadata({
  title: getLegalDocument(SLUG).title,
  description: getLegalDocument(SLUG).summary,
  path: `/${SLUG}`,
});

export default function CookiePolicyPage() {
  const document = getLegalDocument(SLUG);
  const others = getAllLegalDocuments().filter((doc) => doc.slug !== SLUG);

  return (
    <>
      <JsonLd
        graph={standardGraph({
          path: `/${SLUG}`,
          name: document.title,
          description: document.summary,
          trail: [{ name: document.title, path: `/${SLUG}` }],
          services: getAllServices(),
        })}
      />
      <LegalDocumentPage
        document={document}
        others={others}
        aside={<ConsentPreferences />}
      />
    </>
  );
}
