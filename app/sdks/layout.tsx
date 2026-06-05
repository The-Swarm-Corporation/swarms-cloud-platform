import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'SDKs',
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
  ],
});

export default function SDKsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
