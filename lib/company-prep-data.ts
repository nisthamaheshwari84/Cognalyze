import { CompanyPrepGuide } from "./question-bank-types";
import {
  COMPANY_INTELLIGENCE_REGISTRY,
  getCompanyIntelligenceGuide
} from "./question-bank/company-intelligence-registry";

export const COMPANY_PREP_GUIDES: Record<string, CompanyPrepGuide> = COMPANY_INTELLIGENCE_REGISTRY;

export function getCompanyPrepGuide(companyNameOrId: string): CompanyPrepGuide {
  return getCompanyIntelligenceGuide(companyNameOrId);
}
