import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Workflow Builder',
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
  ],
});

export default function WorkflowBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
