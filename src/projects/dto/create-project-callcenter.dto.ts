export class CreateProjectCallCenterDto {
  numberOfAgents?: number;
  numberOfCallsPerDay?: number;
  callTypes?: string;          // "Tech;Support;Sales"
  slaTargetSeconds?: number;   // remplace slaTarget (string)
  averageHandleTimeSec?: number; // remplace averageHandleTime (string)
  estimatedDurationDays?: number;
  CSAT?: number;
  FCR?: number;
  risksScore?: number;
  dependencies?: string;       // "AI;CRM;IVR"
  mainGoals?: string;
  additionalNotes?: string;
  teamSize?: number;
}