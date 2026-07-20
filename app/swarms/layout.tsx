import type { Metadata } from 'next';
import { buildMetadata, pageBreadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildMetadata({
  title: 'Swarm Types, 17+ Multi-Agent Architectures',
  description:
    'Explore every multi-agent architecture supported by the Swarms API, Hierarchical Swarm, Sequential Workflow, Concurrent Workflow, Mixture of Agents, Council as a Judge, Debate with Judge, Multi-Agent Router, Auto Swarm Builder, and more.',
  path: '/swarms',
  keywords: [
    'multi-agent architectures',
    'swarm topologies',
    'HierarchicalSwarm',
    'SequentialWorkflow',
    'ConcurrentWorkflow',
    'MixtureOfAgents',
    'CouncilAsAJudge',
    'DebateWithJudge',
    'MultiAgentRouter',
    'AutoSwarmBuilder',
    'BatchedGridWorkflow',
    'MajorityVoting',
    'PlannerWorkerSwarm',
    'RoundRobin',
    'agent collaboration patterns',
    'multi-agent design patterns',
    'agent orchestration patterns',
    'swarm architecture comparison',
    'agent topology',
    'agent coordination strategies',
    'LLM ensemble',
    'agent teams',
    'AI agent workflows',
  ],
});

export default function SwarmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pageBreadcrumbJsonLd('Swarm Types', '/swarms')} />
      {children}
    </>
  );
}
