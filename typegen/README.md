# Typegen - Type Generation Pipeline

This directory contains the automated type generation system that converts snake_case SDK types to camelCase Zod schemas for JS packages.

## 📁 Structure

```
typegen/
├── README.md                     # This file
├── typeConfigs.ts               # 🎯 MAIN CONFIG - defines which types are generated
├── generate-autumn-js-types.ts  # Main generation script (executable via tsx)
├── archives/
│   └── run-generator.ts        # Legacy script (archived)
└── genUtils/                   # Utility modules
    ├── index.ts                # Clean exports
    ├── TypeGenerator.ts        # Main generator class (orchestrates parallel generation)
    ├── utils.ts               # Helper utilities (path validation, case conversion)
    └── auto-schema-generator.ts # Core Zod schema generation logic
```

## 🎯 Quick Start

### View Currently Generated Types
Check `typeConfigs.ts` to see exactly which types are being generated. The config now returns a `TypeGenerationConfig` object:

```typescript
// Example from typeConfigs.ts
export function getAutumnJSTypeConfigs(tsSDKPath: string, autumnJSPath: string): TypeGenerationConfig {
  return {
    outputDir: "src/libraries/react/clientTypes",  // Where types are generated
    configs: [
      {
        sourceName: "AttachParams",      // From @ts-sdk (snake_case)
        targetName: "AttachParams",      // For autumn-js (camelCase)
        sourceFile: topLevelFile,       // Full path to source file
        targetFile: path.join(generatedDir, "attachTypes.ts"),
        omitFields: ["customer_id"],    // Fields to exclude
        extendFields: { /* ... */ }     // Additional fields to add
      },
      // ... more configs
    ]
  };
}
```

### Generate Types
```bash
# From the root typescript/ directory
pnpm run generate-types              # Run once
pnpm run generate-types:watch        # Watch mode (auto-regenerate on changes)
```

The generator runs in **parallel** for fast processing and outputs timing information for each type.

### Add New Types
1. Open `typeConfigs.ts`
2. Add new configuration to the `configs` array in `getAutumnJSTypeConfigs()`
3. Run `pnpm run generate-types`
4. Generated files appear in `autumn-js/src/libraries/react/clientTypes/`

### Customize Types with Omit/Extend
```typescript
{
  sourceName: "CustomerCreateParams",
  targetName: "CreateCustomerParams",
  sourceFile: customersFile,
  targetFile: path.join(generatedDir, "createCustomerTypes.ts"),
  omitFields: ["id", "data"], // Remove these fields from SDK type
  extendFields: {
    "errorOnNotFound": {
      zodType: "z.boolean().optional()",
      description: "Whether to return an error if customer is not found"
    },
    "customField": {
      zodType: "z.string()",
      description: "A custom field for client use"
    }
  }
}
```

## 📋 Current Type Mappings

### autumn-js Types
Generated in: `autumn-js/src/libraries/react/clientTypes/`

| SDK Type (snake_case) | Client Type (camelCase) | Purpose | Source File | Customizations |
|----------------------|------------------------|---------|-------------|---------------|
| **Shared/Common Types** |
| `CustomerData` | `CustomerData` | Customer info for creation/updates | `shared.ts` | None |
| `EntityData` | `EntityData` | Entity creation data | `shared.ts` | None |
| **Customer Management** |
| `CustomerCreateParams` | `CreateCustomerParams` | Customer creation | `customers.ts` | Omits: `id`<br>Adds: `errorOnNotFound` |
| **Entity Management** |
| `EntityCreateParams` | `CreateEntityParams` | Entity creation | `entities.ts` | None |
| `EntityGetParams` | `GetEntityParams` | Entity retrieval | `entities.ts` | Omits: `customer_id` |
| **Core Attachment Flow** |
| `AttachParams` | `AttachParams` | Product attachment | `top-level.ts` | Omits: `customer_id`<br>Adds: `dialog`, `openInNewTab`, `metadata` |
| `CheckoutParams` | `CheckoutParams` | Checkout flow | `top-level.ts` | Omits: `customer_id`<br>Adds: `dialog`, `openInNewTab` |
| **Billing & Payment** |
| `BillingPortalParams` | `OpenBillingPortalParams` | Billing portal access | `top-level.ts` | Omits: `customer_id`<br>Adds: `openInNewTab` |
| `SetupPaymentParams` | `SetupPaymentParams` | Payment method setup | `top-level.ts` | Omits: `customer_id`<br>Adds: `openInNewTab` |
| **Product Management** |
| `CancelParams` | `CancelParams` | Product cancellation | `top-level.ts` | Omits: `customer_id` |
| **Usage & Analytics** |
| `CheckParams` | `CheckParams` | Feature access checks | `top-level.ts` | Omits: `customer_id`<br>Adds: `dialog`, `properties` |
| `TrackParams` | `TrackParams` | Usage event tracking | `top-level.ts` | Omits: `customer_id` |
| `QueryParams` | `QueryParams` | Analytics queries | `top-level.ts` | Omits: `customer_id` |

**Total: 13 types** organized into 6 categories

## 🔧 How It Works

### 1. Configuration Loading
- `generate-autumn-js-types.ts` loads configurations from `typeConfigs.ts`
- Validates that source paths (`@ts-sdk`) and target paths (`autumn-js`) exist
- Logs all types that will be generated

### 2. Parallel Generation (`TypeGenerator` class)
- Processes all types in **parallel** using `Promise.allSettled`
- Each type generation is independent and runs concurrently
- Tracks timing for each individual type conversion
- Reports success/failure for each type in real-time

### 3. Source Analysis (per type)
- Reads TypeScript interfaces from SDK source files:
  - `src/resources/top-level.ts` - Most API method params
  - `src/resources/shared.ts` - Common data types
  - `src/resources/customers.ts` - Customer-specific types
  - `src/resources/entities.ts` - Entity-specific types
- Identifies nested interfaces (e.g., `AttachParams.Option`)
- Extracts type definitions and relationships

### 4. Schema Generation (`auto-schema-generator.ts`)
- Converts snake_case field names to camelCase
- Generates proper Zod schemas with validation
- Handles complex types: arrays, unions, nullables, Records, unknowns
- Creates nested schemas for interface namespaces
- Applies `omitFields` to exclude SDK-only fields (like `customer_id`)
- Applies `extendFields` to add client-only fields (like `openInNewTab`)

### 5. Output Organization
- Creates individual files per type in `clientTypes/` directory
  - Example: `attachTypes.ts`, `checkoutTypes.ts`, etc.
- Auto-generates `index.ts` with all exports for easy importing
- Maintains proper TypeScript imports between related types
- Adds warnings for auto-generated files: "DO NOT EDIT MANUALLY"

### 6. Summary & Validation
- Prints generation summary with success/failure counts
- Shows total execution time and per-type timing
- Lists any failed generations with error messages

## 🚀 Example Conversion

**Input (SDK - snake_case from `@ts-sdk`):**
```typescript
// src/resources/top-level.ts
export interface AttachParams {
  customer_id: string;
  product_id?: string | null;
  free_trial?: boolean;
  customer_data?: CustomerData;
  entity_data?: EntityData;
  options?: Array<AttachParams.Option> | null;
}

export namespace AttachParams {
  export interface Option {
    feature_id: string;
    quantity: number;
    adjustable_quantity?: boolean | null;
  }
}
```

**Configuration in `typeConfigs.ts`:**
```typescript
{
  sourceName: "AttachParams",
  targetName: "AttachParams",
  sourceFile: topLevelFile,
  targetFile: path.join(generatedDir, "attachTypes.ts"),
  omitFields: ["customer_id"],  // Remove - handled by client
  extendFields: {
    "dialog": {
      zodType: "z.any().optional()",
      description: "DEPRECATED: Use checkout() method instead"
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
}
```

**Output (autumn-js - camelCase in `clientTypes/attachTypes.ts`):**
```typescript
// Auto-generated Zod schema
import { z } from "zod";
import { CustomerDataSchema } from "./customerDataTypes";
import { EntityDataSchema } from "./entityDataTypes";

export const AttachParamsOptionSchema = z.object({
  featureId: z.string(),
  quantity: z.number(),
  adjustableQuantity: z.boolean().nullable().optional()
});

export const AttachParamsSchema = z.object({
  productId: z.string().nullable().optional(),
  freeTrial: z.boolean().optional(),
  customerData: CustomerDataSchema.optional(),  // ✨ Properly typed & imported!
  entityData: EntityDataSchema.optional(),      // ✨ Properly typed & imported!
  options: z.array(AttachParamsOptionSchema).nullable().optional(),
  // 👇 Extended fields (client-specific)
  dialog: z.any().optional().describe("DEPRECATED: Use checkout() method instead"),
  openInNewTab: z.boolean().optional().describe("Whether to open checkout in a new tab"),
  metadata: z.record(z.string(), z.string()).optional().describe("Additional metadata for the request")
});

export type AttachParams = z.infer<typeof AttachParamsSchema>;
```

**Key transformations:**
- ✅ `snake_case` → `camelCase` (e.g., `product_id` → `productId`)
- ✅ Omitted `customer_id` (handled automatically by client)
- ✅ Added client-specific fields (`dialog`, `openInNewTab`, `metadata`)
- ✅ Proper imports for related schemas (`CustomerDataSchema`, `EntityDataSchema`)
- ✅ Preserved optional/nullable modifiers
- ✅ Nested namespaces converted to separate schemas (`Option` → `AttachParamsOptionSchema`)

## 🔮 Future Extensions

The typegen system is designed to support multiple packages. Placeholder functions exist in `typeConfigs.ts`:

### Convex Types
```typescript
export function getConvexTypeConfigs(tsSDKPath: string, convexPath: string): TypeGenerationConfig {
  // TODO: Define Convex-specific type mappings
  // Will generate types for @useautumn/convex package
  return { outputDir: "src/types", configs: [] };
}
```

### CLI Types  
```typescript
export function getAtmnTypeConfigs(tsSDKPath: string, atmnPath: string): TypeGenerationConfig {
  // TODO: Define CLI-specific type mappings
  // Will generate types for atmn CLI package
  return { outputDir: "source/types", configs: [] };
}
```

To implement:
1. Create a new generation script (e.g., `generate-convex-types.ts`)
2. Implement the config function in `typeConfigs.ts`
3. Add npm script to `package.json`
4. Run the generator

## 🛠 Maintenance

### Adding New SDK Types
When new types are added to `@ts-sdk`:
1. Types are automatically available from the SDK package
2. Add new configuration entry to `typeConfigs.ts` in the appropriate section
3. Run `pnpm run generate-types` to generate the new type
4. Verify output in `autumn-js/src/libraries/react/clientTypes/`

### Modifying Existing Types
To change how a type is generated:
1. Update the configuration in `typeConfigs.ts`:
   - Add/remove fields in `omitFields`
   - Add/modify fields in `extendFields`
2. Re-run generation
3. Check git diff to verify changes

### Debugging Generation Issues
**Parallel generation provides detailed logs:**
- Each type logs its generation time
- Failed types show specific error messages
- Summary section shows overall statistics

**Common issues:**
- **Source file not found**: Verify `sourceFile` path in config
- **Import errors**: Check that related types are generated first
- **Invalid Zod syntax**: Check `extendFields` zodType strings

**Debug steps:**
1. Check console output for specific error messages
2. Verify source file paths exist: `ls -la ../ts-sdk/src/resources/`
3. Ensure target directory is writable
4. Try generating a single type by temporarily commenting out others

### Updating Type Conversion Logic
To modify how types are converted:
1. Edit `genUtils/auto-schema-generator.ts` for core conversion logic
2. Edit `genUtils/TypeGenerator.ts` for orchestration/output
3. Edit `genUtils/utils.ts` for helper functions
4. Test changes: `pnpm run generate-types`
5. Verify output files are correct
6. Check that imports resolve properly

### Performance Optimization
The generator already runs types in **parallel**. Performance is typically:
- ~50-200ms per type
- ~1-2 seconds total for all 13 types

If generation is slow, check:
- Large source files (SDK types)
- Complex nested types
- File system I/O (SSD recommended)

## 📦 Generated Output Structure

After running `pnpm run generate-types`, the following files are created:

```
autumn-js/src/libraries/react/clientTypes/
├── index.ts                    # Auto-generated exports
├── customerDataTypes.ts        # CustomerData schema
├── entityDataTypes.ts          # EntityData schema  
├── createCustomerTypes.ts      # CreateCustomerParams schema
├── createEntityTypes.ts        # CreateEntityParams schema
├── getEntityTypes.ts           # GetEntityParams schema
├── attachTypes.ts              # AttachParams + AttachParams.Option schemas
├── checkoutTypes.ts            # CheckoutParams schema
├── billingPortalTypes.ts       # OpenBillingPortalParams schema
├── setupPaymentTypes.ts        # SetupPaymentParams schema
├── cancelTypes.ts              # CancelParams schema
├── checkTypes.ts               # CheckParams schema
├── trackTypes.ts               # TrackParams schema
└── queryTypes.ts               # QueryParams schema
```

Each file contains:
- Zod schema definition (e.g., `AttachParamsSchema`)
- TypeScript type (e.g., `type AttachParams = z.infer<...>`)
- Nested schemas if applicable (e.g., `AttachParamsOptionSchema`)
- Auto-generated imports for related types
- Warning comment: "DO NOT EDIT MANUALLY"

## 🎨 Using Generated Types

### In autumn-js (React)
```typescript
// Import from the barrel export
import { AttachParams, AttachParamsSchema } from './clientTypes';

// Use the type
const params: AttachParams = {
  productId: "prod_123",
  freeTrial: true,
  openInNewTab: true,
  metadata: { source: "web" }
};

// Validate with Zod
const result = AttachParamsSchema.safeParse(params);
if (result.success) {
  // params is valid!
}
```

### Type Safety Benefits
- ✅ **Compile-time validation**: TypeScript catches type errors
- ✅ **Runtime validation**: Zod validates actual values
- ✅ **Auto-completion**: IDEs provide intellisense
- ✅ **Consistent API**: Same types across SDK and client
- ✅ **Automatic updates**: Regenerate when SDK changes

## 🔄 Workflow Integration

### During Development
```bash
# Terminal 1: Watch mode for auto-regeneration
pnpm run generate-types:watch

# Terminal 2: Your dev server
cd autumn-js && pnpm run dev
```

### Before Committing
```bash
# Regenerate types to ensure they're up-to-date
pnpm run generate-types

# Check what changed
git diff autumn-js/src/libraries/react/clientTypes/

# Commit generated files along with config changes
git add typegen/ autumn-js/src/libraries/react/clientTypes/
git commit -m "feat: add new type generation for X"
```

### CI/CD Recommendations
Consider adding a check to ensure generated types are up-to-date:
```bash
# In your CI pipeline
pnpm run generate-types
git diff --exit-code autumn-js/src/libraries/react/clientTypes/
# Fails if types are out of sync
```

---

**Questions or Issues?** Check the console output from `pnpm run generate-types` - it provides detailed error messages and timing information for debugging.