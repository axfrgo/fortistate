/**
 * Fortistate v3.0 - defineEntity Primitive
 * 
 * Creates entity schema definitions using Zod for validation.
 * This is the core of the Possibility Algebra - defining what CAN exist.
 */

import { z } from 'zod'
import type {
  EntityDefinition,
  EntitySchema,
  PropertyDefinition,
  ValidationResult,
  ValidationError,
  DefineEntityOptions,
  PossibilityMetadata
} from './types.js'

/**
 * Build a Zod schema from a property definition
 */
function buildPropertySchema(propDef: PropertyDefinition): z.ZodTypeAny {
  let schema: z.ZodTypeAny

  switch (propDef.type) {
    case 'string':
      schema = z.string()
      if (propDef.min !== undefined) {
        schema = (schema as z.ZodString).min(propDef.min)
      }
      if (propDef.max !== undefined) {
        schema = (schema as z.ZodString).max(propDef.max)
      }
      if (propDef.pattern) {
        schema = (schema as z.ZodString).regex(propDef.pattern)
      }
      break

    case 'number':
      schema = z.number()
      if (propDef.min !== undefined) {
        schema = (schema as z.ZodNumber).min(propDef.min)
      }
      if (propDef.max !== undefined) {
        schema = (schema as z.ZodNumber).max(propDef.max)
      }
      break

    case 'boolean':
      schema = z.boolean()
      break

    case 'email':
      schema = z.string().email()
      break

    case 'uuid':
      schema = z.string().uuid()
      break

    case 'enum':
      if (!propDef.values || propDef.values.length === 0) {
        throw new Error('Enum property must have values array')
      }
      schema = z.enum(propDef.values as [string, ...string[]])
      break

    case 'date':
      schema = z.date()
      break

    default:
      throw new Error(`Unsupported property type: ${propDef.type}`)
  }

  // Handle optional properties
  if (propDef.required === false) {
    schema = schema.optional()
  }

  // Handle default values
  if (propDef.default !== undefined) {
    schema = schema.default(propDef.default)
  }

  return schema
}

/**
 * Convert Zod errors to ValidationErrors
 */
function zodErrorsToValidationErrors(zodErrors: z.ZodIssue[]): ValidationError[] {
  return zodErrors.map(err => ({
    path: err.path.map((p: string | number) => String(p)),
    message: err.message,
    value: (err as any).received,
    type: 'schema'
  }))
}

/**
 * Define an entity schema with typed properties and constraints
 * 
 * @example
 * ```ts
 * const UserEntity = defineEntity({
 *   name: 'User',
 *   properties: {
 *     id: { type: 'uuid' },
 *     email: { type: 'email', unique: true },
 *     age: { type: 'number', min: 0, max: 150 },
 *     role: { type: 'enum', values: ['admin', 'user'] }
 *   },
 *   constraints: [
 *     defineConstraint('age-verified', (user) => user.age >= 13)
 *   ]
 * })
 * ```
 */
export function defineEntity<T = any>(
  definition: EntityDefinition,
  options: DefineEntityOptions = {}
): EntitySchema<T> {
  // Build Zod schema from property definitions
  const schemaFields: Record<string, z.ZodTypeAny> = {}

  for (const [propName, propDef] of Object.entries(definition.properties)) {
    schemaFields[propName] = buildPropertySchema(propDef)
  }

  const zodSchema = z.object(schemaFields)

  // Create metadata
  const metadata: PossibilityMetadata = {
    name: definition.name,
    description: definition.metadata?.description,
    version: definition.metadata?.version || '1.0.0',
    author: definition.metadata?.author,
    tags: definition.metadata?.tags || [],
    createdAt: definition.metadata?.createdAt || new Date(),
    updatedAt: definition.metadata?.updatedAt || new Date()
  }

  // Validation function
  const validate = (instance: any): ValidationResult => {
    const errors: ValidationError[] = []

    // 1. Validate against Zod schema
    const zodResult = zodSchema.safeParse(instance)
    if (!zodResult.success) {
      errors.push(...zodErrorsToValidationErrors(zodResult.error.errors))
    }

    // 2. Validate custom constraints
    const constraints = definition.constraints || []
    for (const constraint of constraints) {
      try {
        if (!constraint.check(instance)) {
          errors.push({
            message: constraint.message,
            type: 'constraint',
            value: instance
          })
        }
      } catch (err) {
        errors.push({
          message: `Constraint '${constraint.name}' threw error: ${err}`,
          type: 'constraint'
        })
      }
    }

    // If there are errors, check if we can auto-repair
    if (errors.length > 0 && options.autoRepair) {
      let repaired = { ...instance }
      let wasRepaired = false

      for (const constraint of constraints) {
        if (constraint.repair && !constraint.check(repaired)) {
          try {
            repaired = constraint.repair(repaired)
            wasRepaired = true
          } catch (err) {
            // Repair failed, keep original errors
          }
        }
      }

      if (wasRepaired) {
        // Re-validate the repaired instance
        const revalidation = validate(repaired)
        if (revalidation.valid) {
          return {
            valid: true,
            repaired
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  // Create function - creates a valid instance with defaults
  const create = (partial: Partial<T> = {}): ValidationResult => {
    // Apply defaults
    const instance: any = { ...partial }

    for (const [propName, propDef] of Object.entries(definition.properties)) {
      if (instance[propName] === undefined && propDef.default !== undefined) {
        instance[propName] = propDef.default
      }
    }

    return validate(instance)
  }

  // Matches function - quick check without full validation
  const matches = (instance: any): boolean => {
    return zodSchema.safeParse(instance).success
  }

  return {
    name: definition.name,
    zodSchema,
    constraints: definition.constraints || [],
    metadata,
    validate,
    create,
    matches
  }
}

/**
 * Helper to extract property names from an entity schema
 */
export function getEntityProperties<T>(schema: EntitySchema<T>): string[] {
  return Object.keys(schema.zodSchema.shape)
}

/**
 * Helper to get property definition from schema
 */
export function getPropertyType<T>(
  schema: EntitySchema<T>,
  propertyName: string
): string | undefined {
  const shape = schema.zodSchema.shape
  if (!(propertyName in shape)) return undefined

  const zodType = shape[propertyName]
  return zodType._def.typeName.replace('Zod', '').toLowerCase()
}

/**
 * Check if two entity schemas are compatible (same structure)
 */
export function areEntitiesCompatible<T1, T2>(
  schema1: EntitySchema<T1>,
  schema2: EntitySchema<T2>
): boolean {
  const props1 = getEntityProperties(schema1)
  const props2 = getEntityProperties(schema2)

  if (props1.length !== props2.length) return false

  return props1.every(prop => props2.includes(prop))
}
