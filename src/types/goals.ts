export type GoalPeriodType = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
export type GoalStatus = 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'ACHIEVED';

export interface Goal {
  id: string;
  name: string;
  platform: string;
  metricKey: string;
  targetValue: number;
  periodType: GoalPeriodType;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalProgress {
  goalId: string;
  goal: Goal;
  currentValue: number;
  targetValue: number;
  percentComplete: number;
  status: GoalStatus;
}
