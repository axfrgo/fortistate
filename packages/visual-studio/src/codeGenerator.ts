/**
 * Code Generator - Converts canvas graph to TypeScript code
 * Generates defineLaw and defineMetaLaw calls from the visual representation
 */

import type { Node, Edge } from 'reactflow'

export interface GeneratedCode {
  imports: string
  laws: string
  composition: string
  fullCode: string
}

/**
 * Generate TypeScript code from the canvas graph
 */
export function generateCodeFromGraph(nodes: Node[], edges: Edge[]): GeneratedCode {
  // Check if we have ontogenetic nodes (vX)
  const hasOntogenetic = nodes.some(n => ['begin', 'become', 'cease', 'transcend'].includes(n.type || ''))
  
  if (hasOntogenetic) {
    return generateOntogeneticCode(nodes, edges)
  }
  
  // Legacy law-based code generation
  const imports = generateImports()
  const laws = generateLawDefinitions(nodes)
  const composition = generateComposition(nodes, edges)
  
  const fullCode = `${imports}\n\n${laws}\n\n${composition}`
  
  return { imports, laws, composition, fullCode }
}

/**
 * Generate code for ontogenetic operators (vX)
 */
function generateOntogeneticCode(nodes: Node[], _edges: Edge[]): GeneratedCode {
  const imports = `import { BEGIN, BECOME, CEASE, TRANSCEND } from 'fortistate/ontogenesis'
import { createLawFabric } from 'fortistate/ontogenesis'`

  const beginNodes = nodes.filter(n => n.type === 'begin')
  const becomeNodes = nodes.filter(n => n.type === 'become')
  const ceaseNodes = nodes.filter(n => n.type === 'cease')
  const transcendNodes = nodes.filter(n => n.type === 'transcend')

  const laws: string[] = []
  
  // BEGIN operators
  if (beginNodes.length > 0) {
    laws.push('// 🌱 BEGIN: Seed entities into existence')
    beginNodes.forEach(node => {
      const data = node.data ?? {}
      const { entity = 'entity', properties = {} } = data as any
      const propsStr = JSON.stringify(properties, null, 2)
      laws.push(`const ${toVariableName(entity)} = BEGIN('${entity}', ${propsStr})`)
    })
    laws.push('')
  }

  // BECOME operators
  if (becomeNodes.length > 0) {
    laws.push('// 🌊 BECOME: Transform entities')
    becomeNodes.forEach(node => {
      const data = node.data ?? {}
      const { entity = 'entity', transform = 'state => state' } = data as any
      laws.push(`const ${toVariableName(entity)}_become = BECOME('${entity}', {`)
      laws.push(`  transform: ${transform},`)
      laws.push(`})`)
    })
    laws.push('')
  }

  // CEASE operators
  if (ceaseNodes.length > 0) {
    laws.push('// 🧱 CEASE: Define boundaries')
    ceaseNodes.forEach(node => {
      const data = node.data ?? {}
      const { entity = 'entity', condition = 'state => false', action = 'repair' } = data as any
      laws.push(`const ${toVariableName(entity)}_cease = CEASE('${entity}', {`)
      laws.push(`  condition: ${condition},`)
      laws.push(`  action: '${action}',`)
      laws.push(`})`)
    })
    laws.push('')
  }

  // TRANSCEND operators
  if (transcendNodes.length > 0) {
    laws.push('// 🌀 TRANSCEND: Cross universe portals')
    transcendNodes.forEach(node => {
      const data = node.data ?? {}
      const { entity = 'entity', portal = 'universe:new', condition = 'state => true' } = data as any
      laws.push(`const ${toVariableName(entity)}_transcend = TRANSCEND('${entity}', {`)
      laws.push(`  portal: '${portal}',`)
      laws.push(`  condition: ${condition},`)
      laws.push(`})`)
    })
    laws.push('')
  }

  const lawsCode = laws.join('\n')
  
  const composition = `// Execute the ontogenetic fabric
const fabric = createLawFabric()
const result = await fabric.execute()
console.log('✅ Universe executed:', result)`

  const fullCode = `${imports}\n\n${lawsCode}\n${composition}`
  
  return { imports, laws: lawsCode, composition, fullCode }
}

/**
 * Generate import statements
 */
export function generateImports(): string {
  return `import { defineLaw, defineMetaLaw } from '@fortistate/possibility'`
}

/**
 * Generate law definitions from law nodes
 */
export function generateLawDefinitions(nodes: Node[]): string {
  const lawNodes = nodes.filter(n => n.type === 'law')
  
  if (lawNodes.length === 0) {
    return '// No laws defined'
  }
  
  return lawNodes.map(node => {
    const name = (node.data && (node.data.name as string)) ?? 'unnamed'
    const varName = toVariableName(name)
    
    return `// ${name}
const ${varName} = defineLaw({
  name: '${toKebabCase(name)}',
  inputs: ['input'],
  output: 'result',
  enforce: (input: any) => {
    // TODO: Implement ${name} logic
    return input
  }
})`
  }).join('\n\n')
}

/**
 * Generate meta-law compositions from operator nodes
 */
export function generateComposition(nodes: Node[], edges: Edge[]): string {
  const operatorNodes = nodes.filter(n => n.type === 'operator')
  
  if (operatorNodes.length === 0) {
    return '// No compositions defined\n// Export individual laws or compose them with defineMetaLaw'
  }
  
  return operatorNodes.map(node => {
    const operator = ((node.data && (node.data.operator as string)) ?? 'Unknown')
    const varName = `${operator.toLowerCase()}Composition`
    
    // Find input laws
    const incomingEdges = edges.filter(e => e.target === node.id)
  const inputNodes = incomingEdges.map(e => nodes.find(n => n.id === e.source)).filter(Boolean)
  const lawNames = inputNodes.map(n => toVariableName(((n && n.data && (n.data.name as string)) ?? 'unnamed')))
    
    const composition = mapOperatorToComposition(operator)
    
    return `// ${operator} Composition
const ${varName} = defineMetaLaw({
  name: '${varName}',
  composition: '${composition}',
  laws: [${lawNames.join(', ')}]
})`
  }).join('\n\n')
}

function mapOperatorToComposition(operator: string): string {
  const mapping: Record<string, string> = {
    'AND': 'conjunction',
    'OR': 'disjunction',
    'IMPLIES': 'implication',
    'SEQUENCE': 'sequence',
    'PARALLEL': 'parallel'
  }
  return mapping[operator] || 'conjunction'
}

function toVariableName(name: string): string {
  const safeName = (name ?? 'unnamed').toString()
  return safeName
    .replace(/\s+/g, '')
    .replace(/^./, c => c.toLowerCase())
    .replace(/Law$/, '')
}

function toKebabCase(name: string): string {
  const safeName = (name ?? 'unnamed').toString()
  return safeName
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/-law$/, '')
}

/**
 * Generate usage example code
 */
export function generateUsageExample(nodes: Node[], _edges: Edge[]): string {
  const operatorNodes = nodes.filter(n => n.type === 'operator')
  
  if (operatorNodes.length === 0) {
    const firstLaw = nodes.find(n => n.type === 'law')
    if (!firstLaw) return '// No laws to demonstrate'
    
    const varName = toVariableName(firstLaw.data.name as string)
    return `// Usage example
const result = ${varName}.execute({ value: 42 })

if (result.success) {
  console.log('Output:', result.value)
} else {
  console.error('Error:', result.error)
}`
  }
  
  const firstOp = operatorNodes[0]
  const varName = `${((firstOp.data && (firstOp.data.operator as string)) ?? 'unknown').toLowerCase()}Composition`
  
  return `// Usage example
const result = ${varName}.execute({ value: 42 })

if (result.success) {
  console.log('Output:', result.value)
  console.log('Law results:', result.lawResults)
} else {
  console.error('Error:', result.error)
  if (result.conflicts) {
    console.warn('Conflicts:', result.conflicts)
  }
}`
}

/**
 * Generate complete module with exports
 */
export function generateFullModule(nodes: Node[], edges: Edge[]): string {
  // Check if we have ontogenetic nodes
  const hasOntogenetic = nodes.some(n => ['begin', 'become', 'cease', 'transcend'].includes(n.type || ''))
  
  if (hasOntogenetic) {
    const { fullCode } = generateCodeFromGraph(nodes, edges)
    return `${fullCode}\n\n// 📖 Usage: Run this in an async context\n// The fabric will execute all operators in topological order`
  }
  
  // Legacy law-based module generation
  const { fullCode } = generateCodeFromGraph(nodes, edges)
  const usage = generateUsageExample(nodes, edges)
  
  // Generate exports
  const lawNodes = nodes.filter(n => n.type === 'law')
  const operatorNodes = nodes.filter(n => n.type === 'operator')
  
  const exports: string[] = []
  lawNodes.forEach(n => exports.push(toVariableName(n.data.name as string)))
  operatorNodes.forEach(n => exports.push(`${n.data.operator.toLowerCase()}Composition`))
  
  const exportStatement = exports.length > 0
    ? `\n\nexport { ${exports.join(', ')} }`
    : ''
  
  return `${fullCode}${exportStatement}\n\n${usage}`
}
