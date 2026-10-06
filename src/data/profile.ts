/**
 * Single source of truth for site content. Every section and the terminal
 * read from here, so editing a fact means editing it exactly once.
 */

export interface Role {
  title: string
  org: string
  orgNote?: string
  start: string
  end: string
  current?: boolean
  /** Earlier roles render as one-line commits. */
  compact?: boolean
  points: string[]
  stack: string[]
}

export interface Build {
  name: string
  role: string
  summary: string
  points: string[]
  stack: string[]
}

export interface SkillGroup {
  id: string
  label: string
  items: string[]
}

export const profile = {
  name: 'Andrew Palo',
  handle: 'andrewtpalo',
  title: 'Senior Cybersecurity Engineer',
  focus: ['Security Architecture', 'Full-Stack & Cloud Engineering', 'AI Systems'],
  location: 'Columbus, OH · open to remote',
  domain: 'andrewtpalo.com',
  github: 'https://github.com/andrewtpalo',
  resume: '/Andrew_Palo_Resume.pdf',
  // Stored split so the address is never present as a scrapeable literal in the bundle.
  emailParts: ['andrewtpalo', 'gmail.com'] as const,

  tagline: 'I build the security platforms that drive down cyber risk.',
  intro:
    "Creator and owner of Fiserv's enterprise-wide cybersecurity analytics platform, the primary security reporting tool for one of the world's largest fintechs, used by 200+ people every day. Its risk scoring, which I designed, rates every application, endpoint, person, and account on likelihood × impact, so remediation goes where it cuts the most risk.",
  summary:
    "Senior cybersecurity engineer and creator/owner of Fiserv's enterprise-wide cybersecurity analytics platform, the primary security reporting tool for one of the world's largest fintechs, serving 200+ daily active users. I blend security architecture, vulnerability management, and risk mitigation with full ownership of the secure SDLC: cloud-native design on GCP, Infrastructure-as-Code and CI/CD automation, RBAC and secure data handling, and production AI/agentic systems. I also translate complex security data into decision-ready insight for technical and executive audiences.",

  stats: [
    { value: '200+', label: 'daily active users on a platform I architected' },
    { value: '#1', label: 'source of security reporting company-wide, and I built it' },
    { value: 'L × I', label: 'risk scoring across apps, endpoints, people & accounts' },
    { value: '0 → prod', label: 'owned end to end: architecture, IaC, CI/CD, GCP' },
  ],
}

export const experience: Role[] = [
  {
    title: 'Senior Cybersecurity Professional',
    org: 'Fiserv',
    orgNote: 'Fortune 500 fintech',
    start: '2022',
    end: 'Present',
    current: true,
    points: [
      "Conceived, architected, and own the enterprise's primary cybersecurity metrics & analytics platform, adopted company-wide as the authoritative source of security reporting, with 200+ daily active users, thousands of daily pageviews, and thousands of monthly unique users across security, engineering, and leadership.",
      'Designed the platform\'s risk scoring algorithms on a likelihood × impact model, scoring applications, endpoints, people, and accounts and rolling them up to an overall enterprise risk posture, so remediation effort goes to the exposures that reduce the most cyber risk.',
      'Own the full secure SDLC: full-stack build in Node.js, Express, and React, containerized with Docker & Kubernetes and provisioned via Terraform (IaC), deployed on Google Cloud through GitLab CI/CD pipelines, delivered within Agile/Scrum ceremonies.',
      'Serve as architecture SME for a second enterprise application (Next.js on GCP), leading security and architecture design reviews and guiding scalable, secure design decisions.',
      'Drive vulnerability management and remediation tracking: triaging findings across cloud, endpoint, asset-inventory, and application security (SAST, DAST, SCA, ASPM) tooling and SIEM data, enriched with CMDB asset context, and partnering with engineering teams to prioritize and close risk.',
      'Integrated production AI/LLM features into security applications, turning raw telemetry into reporting that drives remediation priorities and executive decision-making.',
    ],
    stack: ['Node.js', 'Express', 'React', 'Next.js', 'Docker', 'Kubernetes', 'Terraform', 'GCP', 'GitLab CI/CD', 'LLMs'],
  },
  {
    title: 'Patent Engineer',
    org: 'Eschweiler & Potashnik, LLC',
    orgNote: 'Cleveland, OH',
    start: 'Jun 2020',
    end: 'Mar 2022',
    points: [
      'Automated patent-prosecution workflows by building custom VBA tooling, and managed the firmwide workload/billings database used to optimize work allocation.',
      'Drafted patent applications across advanced technical fields in collaboration with in-house counsel at Fortune 500 companies in the US and abroad.',
    ],
    stack: ['Patent drafting', 'Patent prosecution', 'VBA', 'Workflow automation', 'Database management'],
  },
  {
    title: 'Software Development Intern',
    org: 'Liberty Mutual',
    start: '2019',
    end: '2019',
    compact: true,
    points: ['Full-stack Java / Vue.js, AWS, CI/CD.'],
    stack: ['Java', 'Vue.js', 'AWS', 'CI/CD'],
  },
  {
    title: 'Systems Administration Intern',
    org: 'L Brands',
    start: '2018',
    end: '2018',
    compact: true,
    points: ['Endpoint security & incident response for PCI compliance.'],
    stack: ['Endpoint security', 'Incident response', 'PCI'],
  },
]

/** The analytics platform, broken into the layers drawn in the architecture diagram. */
export const platform = {
  name: 'Enterprise Cybersecurity Analytics Platform',
  org: 'Fiserv',
  sources: [
    // Capability categories only: naming an employer's security vendors publicly maps its defenses.
    { group: 'Cloud & endpoint', items: ['CNAPP', 'Endpoint management'] },
    { group: 'Asset inventory & ownership', items: ['CAASM', 'CMDB'] },
    { group: 'Application security', items: ['SAST', 'DAST', 'SCA', 'ASPM'] },
    { group: 'Security operations', items: ['SIEM'] },
  ],
  layers: [
    {
      id: 'api',
      label: 'Service layer',
      tech: ['Node.js', 'Express'],
      detail: 'Turns raw findings and telemetry from every tool into consistent, decision-ready security metrics.',
    },
    {
      id: 'risk',
      label: 'Risk scoring engine',
      tech: ['likelihood × impact'],
      detail: 'Scores every application, endpoint, person, and account, then rolls up to an overall risk posture.',
    },
    {
      id: 'ai',
      label: 'AI / LLM features',
      tech: ['LLM integration'],
      detail: 'Production AI features embedded in the security workflow.',
    },
    {
      id: 'ui',
      label: 'Reporting UI',
      tech: ['React'],
      detail: 'The authoritative source of security reporting company-wide.',
    },
  ],
  consumers: ['Security', 'Engineering', 'Leadership'],
  delivery: ['GitLab CI/CD', 'Terraform (IaC)', 'Docker', 'Kubernetes', 'Google Cloud'],
  guardrails: ['RBAC', 'Secure SDLC', 'Agile / Scrum'],
}

/** Independent work, intentionally high-level. */
export const builds: Build[] = [
  {
    name: 'Confidere',
    role: 'Founder',
    summary: 'Secure file-sharing and AI document analysis for sensitive financial documents.',
    points: [
      'AI-driven document scanning, grading, and automated report generation.',
      'Security-first by design: role-based access control, least privilege, and encrypted object storage on Google Cloud.',
    ],
    stack: ['GCP', 'Cloud Storage', 'RBAC', 'LLMs'],
  },
  {
    name: 'Discovify',
    role: 'Co-Creator',
    summary: 'An agentic AI platform of leader and specialist agents organized into business suites.',
    points: [
      'Built for trust: human-in-the-loop approvals and audit-logged agent actions, with on-demand or scheduled runs and real-time visibility.',
      'Shipped on GCP Cloud Run using AI-assisted development (Claude Code).',
    ],
    stack: ['Cloud Run', 'Multi-agent orchestration', 'HITL', 'Audit logging'],
  },
]

export const skills: SkillGroup[] = [
  {
    id: 'security',
    label: 'Security',
    items: [
      'Security architecture & design reviews',
      'Vulnerability management & remediation',
      'Risk mitigation',
      'Cyber risk scoring (likelihood × impact)',
      'Security metrics & analytics',
      'SIEM / log analysis',
      'Cloud, endpoint & asset security (CNAPP, CAASM)',
      'CMDB & asset ownership',
      'AppSec: SAST, DAST, SCA, ASPM',
      'RBAC / IAM',
      'Secure SDLC',
      'Audit logging',
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering',
    items: [
      'JavaScript / TypeScript',
      'Node.js',
      'Express',
      'React',
      'Next.js',
      'Vue',
      'Python',
      'Java',
      'Full-stack architecture → production operation',
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud & DevOps',
    items: [
      'Google Cloud (Cloud Run, Cloud Storage, Cloud SQL)',
      'Terraform / Infrastructure-as-Code',
      'Docker & Kubernetes',
      'GitLab CI/CD',
      'GitOps',
      'AWS fundamentals',
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    items: [
      'LLM / AI feature integration',
      'Agentic systems & multi-agent orchestration',
      'Human-in-the-loop design',
      'AI-assisted development (Claude Code)',
    ],
  },
  {
    id: 'ip',
    label: 'Patent & IP',
    items: [
      'Patent application drafting',
      'Patent prosecution',
      'Collaboration with in-house counsel',
      'Prosecution workflow automation (VBA)',
    ],
  },
]

export const education = {
  school: 'The Ohio State University',
  degree: 'B.S. Electrical & Computer Engineering',
  minor: 'Business Minor',
  date: 'May 2020',
  honors: ['GPA 3.93', 'Summa Cum Laude', 'Honors Research Distinction'],
  research: {
    title: 'Kalman Filter for Noise Reduction in Aerial Vehicles using Echoic Flow',
    short: 'Echoic flow UAV control',
    advisors: ['Dr. Inder Gupta', 'Dr. Graeme Smith'],
    date: 'Spring 2020',
    thesisUrl: 'https://kb.osu.edu/server/api/core/bitstreams/6f0b9201-3ced-47ae-b330-03f456379400/content',
    award: {
      place: '1st Place',
      event: 'Undergraduate Research Forum for Engineering and Architecture',
      edition: '11th annual',
      host: "Ohio State's College of Engineering, Knowlton School of Architecture, and Tau Beta Pi",
      date: 'May 2020',
      field: '28 student presenters, judged by 26 faculty members and graduate students',
      url: 'https://engineering.osu.edu/news/2020/05/six-students-earn-awards-colleges-first-virtual-undergraduate-research-forum',
    },
    summary:
      'Used echoic flow, the time-to-contact cue bats use to close on prey, to control the landing of a quadcopter (Parrot AR.Drone 2.0, 15 Hz ultrasonic range sensor). I ported the control stack from JavaScript to Python, calibrated the range sensor and velocity commands, and built a Kalman filter with altitude-dependent measurement noise. Then I validated it against quadratic regression and no filtering in real flights and 1,000 simulated descents per filter.',
    /** Echoic-flow descent error over 1,000 simulated descents per filter (thesis, Table 5). */
    results: [
      { method: 'No filter', medianCm: 49.04, spreadCm: 75.45, under10: 0.4 },
      { method: 'Quadratic regression', medianCm: 22.05, spreadCm: 48.14, under10: 18.2 },
      { method: 'Kalman filter', medianCm: 14.11, spreadCm: 11.97, under10: 32.6 },
    ],
  },
}

export const email = () => profile.emailParts.join('@')

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** Sortable key for dates like "Present", "Mar 2022", "May 2020" or "2019". */
export function dateKey(date: string): number {
  if (/present/i.test(date)) return Number.POSITIVE_INFINITY
  const match = /([a-z]{3})?[a-z]*\s*(\d{4})/i.exec(date)
  if (!match) return 0
  const month = match[1] ? MONTHS.indexOf(match[1].toLowerCase()) + 1 : 0
  return Number(match[2]) + month / 100
}

export type TimelineEntry = { kind: 'role'; role: Role } | { kind: 'education' }

/** Roles and the degree, newest first: the order of the experience "git log". */
export const timeline: TimelineEntry[] = [
  ...experience.map((role) => ({ key: dateKey(role.end), entry: { kind: 'role', role } as TimelineEntry })),
  { key: dateKey(education.date), entry: { kind: 'education' } as TimelineEntry },
]
  .sort((a, b) => b.key - a.key)
  .map((item) => item.entry)
