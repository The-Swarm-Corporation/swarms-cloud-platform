import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildMetadata({
  title: 'Workflow Builder — Visual Drag & Drop Multi-Agent Workflows',
  description:
    'Visually build multi-agent workflows on Swarms Cloud. Drag agents onto a canvas, connect them into a directed flow, then run it on the platform or export the request as Python, TypeScript, Go, or cURL.',
  path: '/workflow-builder',
  keywords: [
    'workflow builder',
    'visual workflow builder',
    'multi-agent workflow',
    'agent flow',
    'node editor',
    'flow builder',
    'workflow orchestration',
    'graph workflow',
    'drag and drop AI workflow',
    'no-code AI workflow',
    'visual agent builder',
    'AI workflow designer',
    'agent canvas',
    'DAG workflow builder',
    'AI pipeline builder',
    'workflow automation tool',
  ],
});

export default function WorkflowBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={pageBreadcrumbJsonLd('Workflow Builder', '/workflow-builder')}
      />
      {children}
    </>
  );
}
