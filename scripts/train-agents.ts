#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  generateCustodianDataset,
  generateDiplomatDataset,
  generateNarratorDataset,
  generateExplorerDataset,
} from '../packages/visual-studio/src/ai/datasetGenerator.ts'

import { runTrainingPipeline } from '../packages/visual-studio/src/ai/trainingPipeline.ts'
import type {
  CustodianSample,
  DiplomatSample,
  NarratorSample,
  ExplorerSample,
  DatasetConfig,
  ModelSpec,
} from '../packages/visual-studio/src/ai/agentTypes.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const MODELS_DIR = path.resolve(ROOT_DIR, 'packages', 'visual-studio', 'src', 'ai', 'models')
const DATASET_DIR = path.join(MODELS_DIR, 'datasets')
const OUTPUT_FILE = path.join(MODELS_DIR, 'generatedModels.ts')

const DEFAULT_TEMPLATES = ['banking', 'social', 'game', 'physics', 'workflow'] as const

console.log('🧠 Loading Fortistate AI training script...')

type Role = 'custodian' | 'diplomat' | 'narrator' | 'explorer'

type DatasetMap = {
  custodian: CustodianSample[]
  diplomat: DiplomatSample[]
  narrator: NarratorSample[]
  explorer: ExplorerSample[]
}

type ModelMap = Record<Role, ModelSpec>

interface ScriptConfig {
  datasetSizes: Record<Role, number>
}

const CONFIG: ScriptConfig = {
  datasetSizes: {
    custodian: 400,
    diplomat: 200,
    narrator: 300,
    explorer: 150,
  },
}

async function ensureDirectories() {
  await mkdir(MODELS_DIR, { recursive: true })
  await mkdir(DATASET_DIR, { recursive: true })
}

function buildDatasetConfig(role: Role, targetSize: number): DatasetConfig {
  return {
    role,
    targetSize,
    templates: [...DEFAULT_TEMPLATES],
    outputPath: path.join(DATASET_DIR, `${role}-dataset.jsonl`),
  }
}

function selectRepresentativeSamples<T>(samples: T[], limit: number): T[] {
  if (samples.length <= limit) return samples
  const step = Math.max(1, Math.floor(samples.length / limit))
  const result: T[] = []
  for (let i = 0; i < samples.length && result.length < limit; i += step) {
    result.push(samples[i])
  }
  return result
}

function groupBy<T>(items: T[], keySelector: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = keySelector(item)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {})
}

function buildCustodianKnowledge(samples: CustodianSample[]) {
  const grouped = groupBy(samples, (sample) => sample.input.violation.violationType)
  return Object.fromEntries(
    Object.entries(grouped).map(([violationType, group]) => {
      const exemplar = group[0]
      return [
        violationType,
        {
          law: exemplar.input.violation.law,
          severity: exemplar.input.violation.severity,
          recommendedProposal: exemplar.output.proposal,
          reasoning: exemplar.output.reasoning,
        },
      ]
    })
  )
}

function buildDiplomatKnowledge(samples: DiplomatSample[]) {
  const grouped = groupBy(samples, (sample) => {
    const a = sample.input.universeA.substrate
    const b = sample.input.universeB.substrate
    return [a, b].sort().join('::')
  })
  return Object.fromEntries(
    Object.entries(grouped).map(([pair, group]) => {
      const exemplar = group[0]
      return [
        pair,
        {
          mergeStrategy: exemplar.output.treaty.mergeStrategy,
          agreements: exemplar.output.treaty.agreements,
          reasoning: exemplar.output.reasoning,
          riskAssessment: exemplar.output.riskAssessment,
        },
      ]
    })
  )
}

function buildNarratorKnowledge(samples: NarratorSample[]) {
  const grouped = groupBy(samples, (sample) => sample.input.mode)
  return Object.fromEntries(
    Object.entries(grouped).map(([mode, group]) => {
      const exemplar = group[0]
      return [
        mode,
        {
          summaryTemplate: exemplar.output.summary,
          keyInsights: exemplar.output.keyInsights,
          sampleStory: exemplar.output.story.slice(0, 3),
        },
      ]
    })
  )
}

function buildExplorerKnowledge(samples: ExplorerSample[]) {
  const grouped = groupBy(samples, (sample) => sample.input.paradox.type)
  return Object.fromEntries(
    Object.entries(grouped).map(([type, group]) => {
      const exemplar = group[0]
      return [
        type,
        {
          paradoxDescription: exemplar.input.paradox.description,
          scenarios: exemplar.output.scenarios,
          recommendations: exemplar.output.recommendations,
        },
      ]
    })
  )
}

function serialize(value: any): string {
  return JSON.stringify(value, null, 2)
}

async function writeDatasetArtifacts(datasets: DatasetMap) {
  await Promise.all([
    writeFile(
      path.join(DATASET_DIR, 'custodian-dataset.json'),
      serialize(selectRepresentativeSamples(datasets.custodian, 50)),
      'utf8'
    ),
    writeFile(
      path.join(DATASET_DIR, 'diplomat-dataset.json'),
      serialize(selectRepresentativeSamples(datasets.diplomat, 50)),
      'utf8'
    ),
    writeFile(
      path.join(DATASET_DIR, 'narrator-dataset.json'),
      serialize(selectRepresentativeSamples(datasets.narrator, 50)),
      'utf8'
    ),
    writeFile(
      path.join(DATASET_DIR, 'explorer-dataset.json'),
      serialize(selectRepresentativeSamples(datasets.explorer, 50)),
      'utf8'
    ),
  ])
}

async function writeGeneratedModelsFile(models: ModelMap, datasets: DatasetMap) {
  const fileHeader = `/**\n * 🚨 AUTO-GENERATED FILE — DO NOT EDIT MANUALLY\n *\n * Generated by scripts/train-agents.ts on ${new Date().toISOString()}\n */\n\n`

  const artifact = {
    generatedAt: new Date().toISOString(),
    models,
    datasets: {
      custodian: {
        size: datasets.custodian.length,
        templates: DEFAULT_TEMPLATES,
        violationTypes: Array.from(
          new Set(datasets.custodian.map((sample) => sample.input.violation.violationType))
        ),
      },
      diplomat: {
        size: datasets.diplomat.length,
        templates: DEFAULT_TEMPLATES,
      },
      narrator: {
        size: datasets.narrator.length,
        modes: Array.from(new Set(datasets.narrator.map((sample) => sample.input.mode))),
      },
      explorer: {
        size: datasets.explorer.length,
        paradoxTypes: Array.from(
          new Set(datasets.explorer.map((sample) => sample.input.paradox.type))
        ),
      },
    },
    knowledge: {
      custodian: buildCustodianKnowledge(datasets.custodian),
      diplomat: buildDiplomatKnowledge(datasets.diplomat),
      narrator: buildNarratorKnowledge(datasets.narrator),
      explorer: buildExplorerKnowledge(datasets.explorer),
    },
    exemplars: {
      custodian: selectRepresentativeSamples(datasets.custodian, 5),
      diplomat: selectRepresentativeSamples(datasets.diplomat, 5),
      narrator: selectRepresentativeSamples(datasets.narrator, 5),
      explorer: selectRepresentativeSamples(datasets.explorer, 5),
    },
  }

  const fileContent = `${fileHeader}export const trainedAgents = ${serialize(artifact)} as const\n\nexport type TrainedAgents = typeof trainedAgents\n`

  await writeFile(OUTPUT_FILE, fileContent, 'utf8')
}

async function main() {
  console.log('🚀 Fortistate AI Training — Starting dataset generation and training pipeline')
  await ensureDirectories()

  const datasets: Partial<DatasetMap> = {}
  const models: Partial<ModelMap> = {}

  const custodianConfig = buildDatasetConfig('custodian', CONFIG.datasetSizes.custodian)
  const diplomatConfig = buildDatasetConfig('diplomat', CONFIG.datasetSizes.diplomat)
  const narratorConfig = buildDatasetConfig('narrator', CONFIG.datasetSizes.narrator)
  const explorerConfig = buildDatasetConfig('explorer', CONFIG.datasetSizes.explorer)

  console.log('\n[1/8] Generating Custodian dataset...')
  const custodianDataset = generateCustodianDataset(custodianConfig)
  console.log(`[2/8] Training Custodian model on ${custodianDataset.length} samples...`)
  datasets.custodian = custodianDataset
  models.custodian = await runTrainingPipeline('custodian', custodianDataset)

  console.log('\n[3/8] Generating Diplomat dataset...')
  const diplomatDataset = generateDiplomatDataset(diplomatConfig)
  console.log(`[4/8] Training Diplomat model on ${diplomatDataset.length} samples...`)
  datasets.diplomat = diplomatDataset
  models.diplomat = await runTrainingPipeline('diplomat', diplomatDataset)

  console.log('\n[5/8] Generating Narrator dataset...')
  const narratorDataset = generateNarratorDataset(narratorConfig)
  console.log(`[6/8] Training Narrator model on ${narratorDataset.length} samples...`)
  datasets.narrator = narratorDataset
  models.narrator = await runTrainingPipeline('narrator', narratorDataset)

  console.log('\n[7/8] Generating Explorer dataset...')
  const explorerDataset = generateExplorerDataset(explorerConfig)
  console.log(`[8/8] Training Explorer model on ${explorerDataset.length} samples...`)
  datasets.explorer = explorerDataset
  models.explorer = await runTrainingPipeline('explorer', explorerDataset)

  await writeDatasetArtifacts(datasets as DatasetMap)
  await writeGeneratedModelsFile(models as ModelMap, datasets as DatasetMap)

  console.log('\n✅ Training artifacts generated successfully!')
  console.log(`  ↳ Models file: ${path.relative(ROOT_DIR, OUTPUT_FILE)}`)
  console.log(`  ↳ Dataset samples: ${path.relative(ROOT_DIR, DATASET_DIR)}`)
  console.log('\nNext steps:')
  console.log('  1. Import trainedAgents in agentRuntime.ts')
  console.log('  2. Wire knowledge base into agent output generation')
  console.log('  3. Reload the Visual Studio dev server')
}

main().catch((error) => {
  console.error('❌ AI training script failed:', error)
  process.exit(1)
})
