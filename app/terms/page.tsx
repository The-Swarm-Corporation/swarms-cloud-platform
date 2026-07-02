import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Terms of Service',
  description:
    'The agreement governing your use of the Swarms Cloud platform, API, and related services.',
  path: '/terms',
  keywords: ['Swarms terms of service', 'terms and conditions', 'API terms'],
});

const EFFECTIVE_DATE = 'June 5, 2026';

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of terms',
    body: (
      <p>
        These Terms of Service (“Terms”) govern your access to and use of the
        Swarms Cloud platform and related services (the “Service”) provided by
        Swarms Corporation (“Swarms”, “we”, “us”). By using the Service you
        agree to these Terms. If you are using the Service on behalf of an
        organization, you represent that you have authority to bind that
        organization.
      </p>
    ),
  },
  {
    id: 'accounts',
    title: 'Accounts and API keys',
    body: (
      <p>
        You are responsible for safeguarding your account credentials and API
        keys, for all activity that occurs under your account, and for keeping
        your contact information current. Notify us immediately of any
        unauthorized use of your account.
      </p>
    ),
  },
  {
    id: 'use',
    title: 'Acceptable use',
    body: (
      <>
        <p>
          You agree not to use the Service to (a) violate any applicable law or
          regulation; (b) infringe intellectual-property or privacy rights of
          others; (c) transmit malware or interfere with the Service’s
          operation; (d) generate content that is unlawful, harmful, or
          deceptive; or (e) attempt to reverse engineer, scrape, or otherwise
          circumvent technical restrictions of the Service.
        </p>
        <p>
          We may suspend or terminate access for conduct that we reasonably
          believe violates these Terms or harms the Service or its users.
        </p>
      </>
    ),
  },
  {
    id: 'content',
    title: 'Your content',
    body: (
      <p>
        You retain ownership of all input you submit and output you generate
        through the Service (“Customer Content”). You grant Swarms a worldwide,
        non-exclusive license to host, process, and transmit Customer Content
        solely to operate and improve the Service. You are responsible for
        ensuring you have the rights necessary to submit Customer Content.
      </p>
    ),
  },
  {
    id: 'fees',
    title: 'Fees and billing',
    body: (
      <p>
        Paid plans are billed in advance and are non-refundable except where
        required by law. Usage-based charges (including credits consumed by
        agent and swarm executions) are billed as incurred. Fees are exclusive
        of taxes, which you are responsible for paying.
      </p>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-party services',
    body: (
      <p>
        The Service may route requests to third-party model providers,
        retrieval sources, or tools. Your use of such third-party services may
        be subject to their own terms. Swarms is not responsible for the
        availability or content of third-party services.
      </p>
    ),
  },
  {
    id: 'ip',
    title: 'Intellectual property',
    body: (
      <p>
        The Service, including its software, design, and trademarks, is owned
        by Swarms and its licensors and is protected by intellectual-property
        laws. Except for the limited license granted in these Terms, no rights
        are transferred to you.
      </p>
    ),
  },
  {
    id: 'termination',
    title: 'Termination',
    body: (
      <p>
        You may stop using the Service at any time. We may suspend or terminate
        your access if you materially breach these Terms or if required by law.
        Provisions that by their nature should survive termination will
        survive, including ownership, disclaimers, and limitations of
        liability.
      </p>
    ),
  },
  {
    id: 'warranty',
    title: 'Disclaimers',
    body: (
      <p>
        THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE”, WITHOUT WARRANTIES
        OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED
        WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT. SWARMS DOES NOT WARRANT THAT THE SERVICE WILL BE
        UNINTERRUPTED OR ERROR-FREE.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <p>
        TO THE FULLEST EXTENT PERMITTED BY LAW, SWARMS WILL NOT BE LIABLE FOR
        INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
        FOR ANY LOSS OF PROFITS OR DATA, ARISING FROM YOUR USE OF THE SERVICE.
        OUR TOTAL LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS WILL NOT
        EXCEED THE AMOUNTS PAID BY YOU TO SWARMS IN THE TWELVE (12) MONTHS
        PRIOR TO THE EVENT GIVING RISE TO LIABILITY.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing law',
    body: (
      <p>
        These Terms are governed by the laws of the State of Delaware, without
        regard to its conflict-of-laws provisions. The state and federal courts
        located in Delaware will have exclusive jurisdiction over any dispute
        arising from these Terms.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <p>
        We may update these Terms from time to time. We will post the updated
        version on this page and update the “Effective” date at the top. Your
        continued use of the Service after the effective date constitutes
        acceptance of the updated Terms.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p>
        Questions about these Terms can be sent to{' '}
        <a
          href="mailto:legal@swarms.ai"
          className="text-foreground underline underline-offset-2 hover:text-accent"
        >
          legal@swarms.ai
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="page-wrapper">
      <Navbar />

      <main className="page-main px-4 sm:px-6 lg:px-8 py-6 lg:py-10 box-border">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex flex-col gap-1 mb-8 pb-6 border-b border-border">
            <p className="text-xs text-muted-foreground">Legal</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Terms of Service
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
