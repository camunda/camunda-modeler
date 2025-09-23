/**
 * Type definitions for Connection Manager Plugin settings
 */

export interface ConnectionManagerSettings {
  id: "connectionManagerPlugin";
  title: string;
  properties: {
    "connectionManagerPlugin.c8connections": ArraySettingsProperty<CamundaConnection>;
  };
}

export interface CamundaConnection {
  id: string;
  name?: string;
  targetType: "camundaCloud" | "selfHosted";

  // Camunda Cloud properties
  camundaCloudClusterUrl?: string;
  camundaCloudClientId?: string;
  camundaCloudClientSecret?: string;

  // Self-hosted properties
  contactPoint?: string;
  authType?: "none" | "basic" | "oauth";

  // Basic auth
  basicAuthUsername?: string;
  basicAuthPassword?: string;

  // OAuth
  clientId?: string;
  clientSecret?: string;
  oauthURL?: string;
  audience?: string;
  scope?: string;
}

export interface ArraySettingsProperty<T> {
  type: "array";
  label: string;
  description: string;
  documentationUrl?: string;
  constraints?: {
    custom?: (api: any) => (values: T[], context: any) => string | null;
  };
  formConfig: {
    placeholder: string;
    addLabel: string;
    elementGenerator: () => Partial<T>;
  };
  childProperties: Record<keyof T, SettingsProperty>;
}

export interface TextSettingsProperty {
  type: "text";
  label: string;
  condition?: PropertyCondition;
  constraints?: {
    notEmpty?: string;
    pattern?: {
      value: RegExp;
      message: string;
    };
  };
}

export interface PasswordSettingsProperty {
  type: "password";
  label: string;
  condition?: PropertyCondition;
  constraints?: {
    notEmpty?: string;
  };
}

export interface RadioSettingsProperty {
  type: "radio";
  label: string;
  options: Array<{ value: string; label: string }>;
  default: string;
  condition?: PropertyCondition;
}

export type SettingsProperty =
  | TextSettingsProperty
  | PasswordSettingsProperty
  | RadioSettingsProperty;

export interface PropertyCondition {
  property: string;
  equals: string;
}

export interface AllMatchCondition {
  allMatch: PropertyCondition[];
}

export type Condition = PropertyCondition | AllMatchCondition;
