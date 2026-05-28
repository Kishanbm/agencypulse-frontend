export type KpiFormatType = 'PERCENTAGE' | 'CURRENCY' | 'NUMBER';
export type KpiGoalCondition = 'ABOVE' | 'BELOW' | 'BETWEEN';

export interface KpiDefinition {
  id: string;
  agencyId: string;
  name: string;
  formula: string;
  platform: string;
  formatType?: KpiFormatType;
  goalCondition?: KpiGoalCondition;
  goalTarget?: number;
  createdAt: string;
}

export interface KpiEvaluationResponse {
  base: Record<string, number>;
  derived: Record<string, number | null>;
  custom: Record<string, number | null>;
}

export interface CreateKpiDefinitionDto {
  name: string;
  formula: string;
  platform: string;
  formatType?: KpiFormatType;
  goalCondition?: KpiGoalCondition;
  goalTarget?: number;
}
