export type ClaimSource =
  | 'Written'
  | 'Testimony'
  | 'TutorObservation';

export type CourseworkType = ClaimSource;

export interface Coursework {
  id: string;
  name: string;
  confirmed: boolean;
  date: string | null;
  type: CourseworkType;
}

export interface Claim {
  id: string;
  submissionId?: string;
  courseworkId: string;
}

export interface Criterion {
  id: string;
  title: string;
  guidance: string[];
  claims: Claim[];
  _visible: boolean;
}

export interface Section {
  id: string;
  learningOutcome: string;
  criteria: Criterion[];
  _visible: boolean;
}

export interface Unit {
  id: string;
  learningOutcome: string;
  sections: Section[];
  _visible: boolean;
}

export type RuleScope = 'unit' | 'section';

export interface CriteriaRules {
  // How many times each criterion must be claimed (global count per criterion)
  perCriterion?: {
    count: number;
  };

  // How many claims of each ClaimSource type are required within the chosen scope
  perType?: {
    scope: RuleScope;
    counts: Partial<Record<ClaimSource, number>>;
  };

  placement?: {
    hasPlacement: boolean;
    requiredPlacementHours?: number;
    requiredPlacementClients?: number;
  }
}

export interface CourseSchema {
  courseTitle: string;
  courseCode: string;
  courseYear: string;
  coursework: Coursework[];
  units: Unit[];
  rules?: CriteriaRules;
}

export interface Agency {
  id: string;
  name: string;
  website: string;
  manager: string;
  notes: string;
}

export interface Client {
  id: string;
  anonymousIdentifier: string;
  agencyId: string;
}

export interface PlacementSession {
  id: string;
  date: string;
  clientId?: string;
  agencyId?: string;
  clientName: string;
  agency: string;
  duration: number;
  whatHappened: string;
  personalProcess: string;
  theoryToApply: string;
  important?: boolean;
}

export interface SupervisionClientNote {
  clientId: string;
  notes: string;
}

export interface SupervisionNote {
  id: string;
  date: string;
  supervisorName: string;
  duration: number;
  clientNotes: SupervisionClientNote[];
  notes: string;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  subterms?: GlossaryEntry[]; // nested sub-terms (recursive)
}
