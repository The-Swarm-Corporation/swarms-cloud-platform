import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'How Swarms collects, uses, and protects your data across the Swarms Cloud platform, API, and dashboard.',
  path: '/privacy',
  keywords: ['Swarms privacy policy', 'data protection', 'GDPR', 'CCPA'],
});

const EFFECTIVE_DATE = 'June 5, 2026';

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: 'overview',
    title: 'Overview',
    body: (
      <p>
        This Privacy Policy describes how Swarms Corporation (“Swarms”, “we”,
        “us”) collects, uses, discloses, and safeguards information when you
        use the Swarms Cloud platform, including the orchestration dashboard,
        API, and related services (collectively, the “Service”).
      </p>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information we collect',
    body: (
      <>
        <p>We collect the following categories of information:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>
            <span className="text-foreground">Account information</span> - email
            address, API keys, and billing details you provide when registering.
          </li>
          <li>
            <span className="text-foreground">Usage data</span> - agent
            configurations, swarm executions, logs, token counts, and timestamps
            generated through normal use of the Service.
          </li>
          <li>
            <span className="text-foreground">Content</span> - task prompts,
            tool calls, and model outputs that pass through the Service.
          </li>
          <li>
            <span className="text-foreground">Technical data</span> - browser
            user agent, IP address, device identifiers, and diagnostic logs.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-information',
    title: 'How we use information',
    body: (
      <>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>Operate, maintain, and improve the Service.</li>
          <li>
            Authenticate requests, enforce rate limits, and protect against
            abuse.
          </li>
          <li>Bill for usage and manage subscriptions.</li>
          <li>
            Provide support, send service notices, and respond to your
            requests.
          </li>
          <li>Comply with legal obligations.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'How we share information',
    body: (
      <p>
        We do not sell personal information. We share information with
        third-party model providers solely to fulfill your agent execution
        requests, with infrastructure providers that host the Service, with
        professional advisors, and where required by law. Each subprocessor is
        subject to confidentiality and data-protection obligations.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'Data retention',
    body: (
      <p>
        We retain account information for as long as your account is active and
        thereafter only as long as needed to comply with legal obligations and
        resolve disputes. Execution logs are retained per the data-retention
        window of your plan and may be deleted by you at any time.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        We employ administrative, technical, and physical safeguards designed
        to protect information against unauthorized access, alteration, and
        disclosure. No method of transmission or storage is perfectly secure,
        and we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: (
      <p>
        Depending on your jurisdiction, you may have the right to access,
        correct, delete, or port your personal information, to restrict or
        object to certain processing, and to lodge a complaint with a
        supervisory authority. To exercise any of these rights, contact us at
        the address below.
      </p>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: (
      <p>
        The Service is not directed to children under 13, and we do not
        knowingly collect personal information from children under 13.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. We will post the
        updated version on this page and update the “Effective” date at the
        top. Material changes will be communicated by additional notice where
        required by law.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p>
        Questions about this Privacy Policy can be sent to{' '}
        <a
          href="mailto:privacy@swarms.ai"
          className="text-foreground underline underline-offset-2 hover:text-accent"
        >
          privacy@swarms.ai
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-10 box-border">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex flex-col gap-1 mb-8 pb-6 border-b border-border">
            <p className="text-xs text-muted-foreground">Legal</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Effective {EFFECTIVE_DATE}
            </p>
          </div>

          <nav
            aria-label="On this page"
            className="rounded-lg border border-border bg-card p-4 mb-8"
          >
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              On this page
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <article className="space-y-10 text-sm text-muted-foreground leading-relaxed">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2.5">
                  {s.title}
                </h2>
                <div className="space-y-2">{s.body}</div>
              </section>
            ))}
          </article>
        </div>
      </main>
    </div>
  );
}
