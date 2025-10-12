import { describe, it, expect } from 'vitest'
import { 
  generateCodeFromGraph, 
  generateImports,
  generateLawDefinitions,
  generateFullModule
} from '../src/codeGenerator'
import type { Node, Edge } from 'reactflow'

describe('codeGenerator', () => {
  describe('generateLawDefinitions', () => {
    it('should generate defineLaw calls for law nodes', () => {
      const nodes: Node[] = [
        { id: 'law1', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Validation Law' } },
        { id: 'law2', type: 'law', position: { x: 100, y: 0 }, data: { name: 'Transform Law' } }
      ]
      
      const code = generateLawDefinitions(nodes)
      
      expect(code).toContain('defineLaw')
      expect(code).toContain('validation')
      expect(code).toContain('transform')
      expect(code).toContain("name: 'validation")
      expect(code).toContain("name: 'transform")
      expect(code).toContain("inputs: ['input']")
      expect(code).toContain("output: 'result'")
    })

    it('should include TODO comments for implementation', () => {
      const nodes: Node[] = [
        { id: 'law1', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Custom Law' } }
      ]
      
      const code = generateLawDefinitions(nodes)
      
      expect(code).toContain('// TODO: Implement')
    })

    it('should handle empty node list', () => {
      const code = generateLawDefinitions([])
      
      expect(code).toContain('No laws')
    })

    it('should skip non-law nodes', () => {
      const nodes: Node[] = [
        { id: 'law1', type: 'law', position: { x: 0, y: 0 }, data: { name: 'My Law' } },
        { id: 'op1', type: 'operator', position: { x: 100, y: 0 }, data: { operator: 'AND' } }
      ]
      
      const code = generateLawDefinitions(nodes)
      
      expect(code).toContain('my')
      expect(code).not.toContain('AND')
    })
  })

  describe('generateCodeFromGraph', () => {
    it('should generate composition with operators', () => {
      const nodes: Node[] = [
        { id: 'law1', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Law A' } },
        { id: 'law2', type: 'law', position: { x: 0, y: 100 }, data: { name: 'Law B' } },
        { id: 'and', type: 'operator', position: { x: 100, y: 50 }, data: { operator: 'AND' } }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'law1', target: 'and' },
        { id: 'e2', source: 'law2', target: 'and' }
      ]
      
      const result = generateCodeFromGraph(nodes, edges)
      
      expect(result.composition).toContain('defineMetaLaw')
      expect(result.composition).toContain('conjunction')
    })

    it('should map operators correctly', () => {
      const result1 = generateCodeFromGraph([
        { id: 'l1', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Law A' } },
        { id: 'and', type: 'operator', position: { x: 100, y: 0 }, data: { operator: 'AND' } }
      ], [{ id: 'e1', source: 'l1', target: 'and' }])
      expect(result1.composition).toContain('conjunction')
      
      const result2 = generateCodeFromGraph([
        { id: 'l1', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Law A' } },
        { id: 'or', type: 'operator', position: { x: 100, y: 0 }, data: { operator: 'OR' } }
      ], [{ id: 'e1', source: 'l1', target: 'or' }])
      expect(result2.composition).toContain('disjunction')
      
      const result3 = generateCodeFromGraph([
        { id: 'l1', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Law A' } },
        { id: 'seq', type: 'operator', position: { x: 100, y: 0 }, data: { operator: 'SEQUENCE' } }
      ], [{ id: 'e1', source: 'l1', target: 'seq' }])
      expect(result3.composition).toContain('sequence')
    })

    it('should handle complex graphs', () => {
      const nodes: Node[] = [
        { id: 'law1', type: 'law', position: { x: 0, y: 0 }, data: { name: 'My Law' } }
      ]
      const edges: Edge[] = []
      
      const code = generateFullModule(nodes, edges)
      
      expect(code).toContain("import { defineLaw")
      expect(code).toContain('defineLaw({')
      expect(code).toContain('// Usage example')
      expect(code).toContain('export {')
    })

    it('should include all components', () => {
      const nodes: Node[] = [
        { id: 'law1', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Law A' } },
        { id: 'law2', type: 'law', position: { x: 0, y: 100 }, data: { name: 'Law B' } },
        { id: 'and', type: 'operator', position: { x: 100, y: 50 }, data: { operator: 'AND' } }
      ]
      const edges: Edge[] = [
        { id: 'e1', source: 'law1', target: 'and' },
        { id: 'e2', source: 'law2', target: 'and' }
      ]
      
      const code = generateFullModule(nodes, edges)
      
      expect(code).toContain('lawA')
      expect(code).toContain('lawB')
      expect(code).toContain('conjunction')
      expect(code).toContain('export { lawA, lawB')
    })

    it('should return all code sections', () => {
      const nodes: Node[] = [
        { id: 'law1', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Test Law' } }
      ]
      const edges: Edge[] = []
      
      const result = generateCodeFromGraph(nodes, edges)
      
      expect(result).toHaveProperty('imports')
      expect(result).toHaveProperty('laws')
      expect(result).toHaveProperty('composition')
      expect(result).toHaveProperty('fullCode')
    })

    it('should include imports', () => {
      const nodes: Node[] = [
        { id: 'law1', type: 'law', position: { x: 0, y: 0 }, data: { name: 'Test Law' } }
      ]
      const edges: Edge[] = []
      
      const result = generateCodeFromGraph(nodes, edges)
      
      expect(result.imports).toContain('@fortistate/possibility')
    })
  })
})
