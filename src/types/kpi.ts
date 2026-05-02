export interface KpiDefinition {
  id: string;
  agencyId: string;
  name: string;
  formula: string;
  platform: string;
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
}
