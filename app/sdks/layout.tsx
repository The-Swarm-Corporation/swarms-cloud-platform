import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildMetadata({
  title: 'SDKs, Python, TypeScript, Go, Java & C# Clients',
  description:
    'Build with the Swarms API in any language. Official, typed client libraries for Python, TypeScript, Go, Java, and C#, plus a Model Context Protocol server for Claude Desktop and Cursor.',
  path: '/sdks',
  keywords: [
    'Swarms SDK',
    'Swarms API client',
    'Python SDK',
    'TypeScript SDK',
    'JavaScript SDK',
    'Go SDK',
    'Java SDK',
    'C# SDK',
    'dotnet SDK',
    'MCP server',
    'Model Context Protocol',
    'swarms-client',
    'swarms-ts',
    'swarms-ts-mcp',
    'swarms-client-go',
    'swarms-java',
    'swarms-csharp',
    'Claude Desktop',
    'Cursor',
    'AI agent SDK',
    'multi-agent SDK',
    'pip install swarms',
    'npm swarms',
    'AI client library',
    'LLM SDK',
    'agent API client',
  ],
});

export default function SDKsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd('SDKs', '/sdks')} />
      {children}
    </>
  );
}
