export class CreateProjectCallCenterDto {
  numberOfAgents?: number;
  numberOfCallsPerDay?: number;
  callTypes?: string;
  slaTarget?: string;
  averageHandleTime?: string;
  estimatedBudget?: number;
  estimatedDurationDays?: number;
  mainGoals?: string;
  keyMetrics?: string;
  dependencies?: string;
  risks?: string;
  additionalNotes?: string;
}
