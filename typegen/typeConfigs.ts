import path from "path";

/**
 * Configuration for individual type generation
 */
export interface TypeConfig {
  /** Snake case type name from @ts-sdk */
  sourceName: string;
  /** Camel case type name for autumn-js */
  targetName: string;
  /** Source file path in @ts-sdk */
  sourceFile: string;
  /** Target file path in autumn-js */
  targetFile: string;
  /** Fields to omit from the generated schema */
  omitFields?: string[];
  /** Additional fields to extend the schema with (field name -> Zod schema) */
  extendFields?: Record<string, { zodType: string; description?: string }>;
}

/**
 * Configuration for type generation including output directory
 */
export interface TypeGenerationConfig {
  /** Array of type configurations */
  configs: TypeConfig[];
  /** Relative path within target package for generated types */
  outputDir: string;
}

/**
 * Type configurations for autumn-js generation
 * 
 * This is the main configuration file that defines which types get converted
 * from snake_case (@ts-sdk) to camelCase (autumn-js).
 * 
 * Add new type conversions here to extend the generation pipeline.
 */
export function getAutumnJSTypeConfigs(tsSDKPath: string, autumnJSPath: string): TypeGenerationConfig {
  const topLevelFile = path.join(tsSDKPath, "src/resources/top-level.ts");
  const sharedFile = path.join(tsSDKPath, "src/resources/shared.ts");
  const customersFile = path.join(tsSDKPath, "src/resources/customers.ts");
  const entitiesFile = path.join(tsSDKPath, "src/resources/entities.ts");
  const referralsFile = path.join(tsSDKPath, "src/resources/referrals.ts");
  
  // Output directory configuration - change this to modify where types are generated
  const outputDir = "src/libraries/react/clientTypes";
  const generatedDir = path.join(autumnJSPath, outputDir);

  return {
    outputDir,
    configs: [
    // Shared/common types (used across multiple schemas)
    {
      sourceName: "CustomerData",
      targetName: "CustomerData",
      sourceFile: sharedFile,
      targetFile: path.join(generatedDir, "customerDataTypes.ts"),
    },
    {
      sourceName: "EntityData", 
      targetName: "EntityData",
      sourceFile: sharedFile,
      targetFile: path.join(generatedDir, "entityDataTypes.ts"),
    },

    // Customer management types
    {
      sourceName: "CustomerCreateParams",
      targetName: "CreateCustomerParams", 
      sourceFile: customersFile,
      targetFile: path.join(generatedDir, "createCustomerTypes.ts"),
      omitFields: ["id"], // Omit "id" field as mentioned in your usage
      extendFields: {
        "errorOnNotFound": {
          zodType: "z.boolean().optional()",
          description: "Whether to return an error if customer is not found"
        }
      }
    },

    // Entity management types
    {
      sourceName: "EntityCreateParams",
      targetName: "CreateEntityParams",
      sourceFile: entitiesFile,
      targetFile: path.join(generatedDir, "createEntityTypes.ts"),
      // No omitFields needed - EntityCreateParams doesn't have customer_id
    },
    {
      sourceName: "EntityGetParams",
      targetName: "GetEntityParams",
      sourceFile: entitiesFile,
      targetFile: path.join(generatedDir, "getEntityTypes.ts"),
      omitFields: ["customer_id"], // Remove customerId - handled by client
    },

    // Referral management types
    {
      sourceName: "ReferralCreateCodeParams",
      targetName: "CreateReferralCodeParams",
      sourceFile: referralsFile,
      targetFile: path.join(generatedDir, "createReferralCodeTypes.ts"),
      omitFields: ["customer_id"], // Remove customerId - handled by client
    },
    {
      sourceName: "ReferralRedeemCodeParams", 
      targetName: "RedeemReferralCodeParams",
      sourceFile: referralsFile,
      targetFile: path.join(generatedDir, "redeemReferralCodeTypes.ts"),
      omitFields: ["customer_id"], // Remove customerId - handled by client
    },

    // Core attachment flow types
    {
      sourceName: "AttachParams",
      targetName: "AttachParams",
      sourceFile: topLevelFile,
      targetFile: path.join(generatedDir, "attachTypes.ts"),
      omitFields: ["customer_id"], // Remove customerId - handled by client
      extendFields: {
        "dialog": {
          zodType: "z.any().optional()",
          description: "DEPRECATED: This field is deprecated and will be removed in a future version. Please use the checkout() method instead."
        },
        "openInNewTab": {
          zodType: "z.boolean().optional()",
          description: "Whether to open checkout in a new tab"
        },
        "metadata": {
          zodType: "z.record(z.string(), z.string()).optional()",
          description: "Additional metadata for the request"
        }
      }
    },
    {
      sourceName: "CheckoutParams", 
      targetName: "CheckoutParams",
      sourceFile: topLevelFile,
      targetFile: path.join(generatedDir, "checkoutTypes.ts"),
      omitFields: ["customer_id"], // Remove customerId - handled by client
      extendFields: {
        "dialog": {
          zodType: "z.any().optional()",
          description: "Dialog configuration for checkout flow"
        },
        "openInNewTab": {
          zodType: "z.boolean().optional()",
          description: "Whether to open checkout in a new tab"
        }
      }
    },

    // Billing and payment types
    {
      sourceName: "BillingPortalParams",
      targetName: "OpenBillingPortalParams",
      sourceFile: topLevelFile,
      targetFile: path.join(generatedDir, "billingPortalTypes.ts"),
      omitFields: ["customer_id"], // Remove customerId - handled by client
      extendFields: {
        "openInNewTab": {
          zodType: "z.boolean().optional()",
          description: "Whether to open billing portal in a new tab"
        }
      }
    },
    {
      sourceName: "SetupPaymentParams",
      targetName: "SetupPaymentParams",
      sourceFile: topLevelFile,
      targetFile: path.join(generatedDir, "setupPaymentTypes.ts"),
      omitFields: ["customer_id"], // Remove customerId - handled by client
      extendFields: {
        "openInNewTab": {
          zodType: "z.boolean().optional()",
          description: "Whether to open payment setup in a new tab"
        }
      }
    },

    // Product management types
    {
      sourceName: "CancelParams",
      targetName: "CancelParams", 
      sourceFile: topLevelFile,
      targetFile: path.join(generatedDir, "cancelTypes.ts"),
      omitFields: ["customer_id"], // Remove customerId - handled by client
    },

    // Usage and analytics types  
    {
      sourceName: "CheckParams",
      targetName: "CheckParams",
      sourceFile: topLevelFile,
      targetFile: path.join(generatedDir, "checkTypes.ts"),
      omitFields: ["customer_id"], // Remove customerId - handled by client
      extendFields: {
        "dialog": {
          zodType: "z.any().optional()",
          description: "Dialog configuration for feature check flow"
        },
        "properties": {
          zodType: "z.record(z.string(), z.any()).optional()",
          description: "Additional properties for the feature check"
        }
      }
    },
    {
      sourceName: "TrackParams",
      targetName: "TrackParams",
      sourceFile: topLevelFile,
      targetFile: path.join(generatedDir, "trackTypes.ts"),
      omitFields: ["customer_id"], // Remove customerId - handled by client
    },
    {
      sourceName: "QueryParams",
      targetName: "QueryParams",
      sourceFile: topLevelFile,
      targetFile: path.join(generatedDir, "queryTypes.ts"),
      omitFields: ["customer_id"], // Remove customerId - handled by client
    },
    ]
  };
}

/**
 * Type configurations for @useautumn/convex generation
 * TODO: Implement when ready to generate Convex types
 */
export function getConvexTypeConfigs(_tsSDKPath: string, _convexPath: string): TypeConfig[] {
  // Placeholder for future Convex type generation
  return [];
}

/**
 * Type configurations for atmn CLI generation  
 * TODO: Implement when ready to generate CLI types
 */
export function getAtmnTypeConfigs(_tsSDKPath: string, _atmnPath: string): TypeConfig[] {
  // Placeholder for future CLI type generation
  return [];
}