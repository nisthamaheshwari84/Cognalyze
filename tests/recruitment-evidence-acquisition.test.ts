import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateExternalUrl,
  inspectGithubRepository,
  inspectCodePatterns,
  detectEvidenceDuplication,
  detectNegativeAndContradictoryEvidence
} from '../lib/evidence/source-verifier';

test('=== COGNALYZE RECRUITMENT INTELLIGENCE — GATE 4: EVIDENCE ACQUISITION & PROVENANCE BENCHMARK ===', async (t) => {

  await t.test('[Test 1] SSRF Security Guard: Blocks Loopback, Cloud Metadata & Private Networks', () => {
    // 1. Loopback / localhost
    const local1 = validateExternalUrl('http://localhost:3000/api/keys');
    assert.equal(local1.isValid, false, 'Must block localhost');
    assert.equal(local1.accessStatus, 'INVALID_URL');

    const local2 = validateExternalUrl('http://127.0.0.1:8080/secrets');
    assert.equal(local2.isValid, false, 'Must block 127.0.0.1');

    // 2. Cloud metadata service
    const awsMeta = validateExternalUrl('http://169.254.169.254/latest/meta-data/');
    assert.equal(awsMeta.isValid, false, 'Must block AWS instance metadata IP');
    assert.ok(awsMeta.reason?.includes('metadata'));

    const gcpMeta = validateExternalUrl('http://metadata.google.internal/computeMetadata/v1/');
    assert.equal(gcpMeta.isValid, false, 'Must block GCP internal metadata');

    // 3. RFC-1918 Private subnets
    const priv10 = validateExternalUrl('http://10.0.1.5/admin');
    assert.equal(priv10.isValid, false, 'Must block 10.0.0.0/8 private IP');

    const priv192 = validateExternalUrl('http://192.168.1.1/router');
    assert.equal(priv192.isValid, false, 'Must block 192.168.0.0/16 private IP');

    // 4. Disallowed protocol
    const fileProto = validateExternalUrl('file:///etc/passwd');
    assert.equal(fileProto.isValid, false, 'Must block file:// protocol');

    // 5. Legitimate public GitHub repo
    const validGithub = validateExternalUrl('https://github.com/torvalds/linux');
    assert.equal(validGithub.isValid, true, 'Legitimate public GitHub URL must pass validation');
    assert.equal(validGithub.accessStatus, 'ACCESSIBLE');
  });

  await t.test('[Test 2] Inaccessible / 404 Repositories: Safe Failure Without Hallucination', async () => {
    const result = await inspectGithubRepository(
      'alexmorgan/non-existent-repo-404',
      ['python', 'fastapi'],
      { accessible: false }
    );

    assert.equal(result.accessible, false, 'Repository must be reported as inaccessible');
    assert.equal(result.verificationStatus, 'INACCESSIBLE');
    assert.equal(result.sourceTechnologiesFound.length, 0, 'Must NOT invent code for 404 repo');
    assert.equal(result.dependenciesFound.length, 0, 'Must NOT invent dependencies for 404 repo');
    assert.ok(result.checks.some(c => c.check === 'Repository accessible' && c.result === 'FAILED'));
  });

  await t.test('[Test 3] Anti-Cheat Invariant: README Mention != Source Code Implementation', async () => {
    // Candidate claims Kubernetes and RAG in README, but repo has zero code implementing them
    const mockFiles = {
      'main.py': 'print("Simple Python script")\n',
    };
    const mockReadme = `
# Enterprise AI Microservices Platform
Built with Kubernetes, Docker, FastAPI, and RAG Architecture.
    `.trim();

    const result = await inspectGithubRepository(
      'https://github.com/candidate/deceptive-repo',
      ['Kubernetes', 'FastAPI', 'RAG'],
      {
        accessible: true,
        readmeText: mockReadme,
        files: mockFiles
      }
    );

    assert.equal(result.accessible, true);
    // Python is in source
    assert.ok(result.sourceTechnologiesFound.includes('python'));

    // Kubernetes and RAG were mentioned in README but NEVER implemented
    assert.ok(result.readmeTechnologiesMentioned?.includes('kubernetes'));
    assert.ok(result.readmeTechnologiesMentioned?.includes('rag'));
    assert.ok(!result.sourceTechnologiesFound.includes('kubernetes'), 'Kubernetes must NOT be in sourceTechnologiesFound');
    assert.ok(!result.sourceTechnologiesFound.includes('rag'), 'RAG must NOT be in sourceTechnologiesFound');

    // Checks must mark Kubernetes and RAG as FAILED
    const k8sCheck = result.checks.find(c => c.check.includes('Kubernetes'));
    assert.equal(k8sCheck?.result, 'FAILED');
    assert.ok(k8sCheck?.detail?.includes('README only without source implementation'));

    // Limitations must explicitly document the gap
    assert.ok(result.limitations?.some(l => l.includes('Kubernetes') && l.includes('README')));
  });

  await t.test('[Test 4] Deep Backend AST Signals: FastAPI, Routes, Pydantic, and Unit Tests', async () => {
    const mockFiles = {
      'app/main.py': `
from fastapi import FastAPI, HTTPException
from app.models import UserCreate

app = FastAPI()

@app.post("/api/v1/users")
async def create_user(payload: UserCreate):
    return {"status": "created"}
      `.trim(),
      'app/models.py': `
from pydantic import BaseModel, Field

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3)
    email: str
      `.trim(),
      'tests/test_api.py': `
import pytest
def test_create_user():
    assert True
      `.trim(),
      'requirements.txt': `
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.6.0
pytest==8.0.0
      `.trim(),
    };

    const patterns = inspectCodePatterns(mockFiles, '# Backend Service API');

    assert.ok(patterns.sourceTechnologiesFound.includes('python'));
    assert.ok(patterns.sourceTechnologiesFound.includes('fastapi'));
    assert.ok(patterns.sourceTechnologiesFound.includes('rest_api'));
    assert.ok(patterns.dependenciesFound.includes('fastapi'));
    assert.ok(patterns.dependenciesFound.includes('pydantic'));

    // AST signals
    assert.ok(patterns.astSignalsFound.python.includes('async_def_concurrency'));
    assert.ok(patterns.astSignalsFound.python.includes('pytest_automated_testing'));
    assert.ok(patterns.astSignalsFound.backend_api.includes('http_method_route_handlers'));
    assert.ok(patterns.astSignalsFound.backend_api.includes('pydantic_schema_validation'));
  });

  await t.test('[Test 5] Deep AI/RAG AST Signals: Vector DB, Chunking, and Embeddings', async () => {
    const mockFiles = {
      'rag_pipeline.py': `
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

class ProductionRAGPipeline:
    def __init__(self):
        self.encoder = SentenceTransformer("all-MiniLM-L6-v2")
        self.pc = Pinecone(api_key="mock-key")
        self.index = self.pc.Index("knowledge-base")

    async def retrieve_context(self, query: str):
        query_embedding = self.encoder.encode([query])[0]
        results = self.index.query(vector=query_embedding, top_k=5)
        return results
      `.trim(),
      'requirements.txt': 'pinecone-client\nsentence-transformers\n',
    };

    const patterns = inspectCodePatterns(mockFiles, '# RAG Pipeline');

    assert.ok(patterns.sourceTechnologiesFound.includes('rag'));
    assert.ok(patterns.astSignalsFound.rag.includes('vector_database_integration'));
    assert.ok(patterns.astSignalsFound.rag.includes('semantic_embeddings'));
    assert.ok(patterns.astSignalsFound.rag.includes('vector_retrieval_query'));
  });

  await t.test('[Test 6] Multi-Stage Dockerfile & Kubernetes Manifest Inspection', async () => {
    const mockFiles = {
      'Dockerfile': `
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
CMD ["npm", "start"]
      `.trim(),
      'k8s/deployment.yaml': `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: web
        image: acme/web:v1
      `.trim(),
    };

    const patterns = inspectCodePatterns(mockFiles, '# Deployment Setup');

    assert.ok(patterns.sourceTechnologiesFound.includes('docker'));
    assert.ok(patterns.sourceTechnologiesFound.includes('kubernetes'));
    assert.ok(patterns.astSignalsFound.devops_cloud.includes('docker_multistage_build'));
    assert.ok(patterns.astSignalsFound.kubernetes.includes('k8s_deployment_manifest'));
  });

  await t.test('[Test 7] Authorship Attribution & Cryptographic Provenance Hash', async () => {
    const mockFiles = {
      'src/index.ts': 'export const app = "demo";\n',
    };

    const authorResult = await inspectGithubRepository(
      'https://github.com/alexmorgan/cloud-tool',
      ['TypeScript'],
      { accessible: true, files: mockFiles, readmeText: '# Cloud Tool' },
      'alexmorgan' // candidate handle
    );

    assert.equal(authorResult.ownershipStatus, 'CONFIRMED_AUTHOR', 'Matching handle confirms authorship');
    assert.ok(authorResult.sourceHash && authorResult.sourceHash.length === 64, 'Must compute 64-char SHA-256 hash');

    const unanchoredResult = await inspectGithubRepository(
      'https://github.com/other-user/cloud-tool',
      ['TypeScript'],
      { accessible: true, files: mockFiles, readmeText: '# Cloud Tool' },
      'alexmorgan' // candidate handle differs
    );

    assert.equal(unanchoredResult.ownershipStatus, 'NOT_INDEPENDENTLY_ESTABLISHED');
  });

  await t.test('[Test 8] Evidence Deduplication: Identifies Repeated / Clustered Quotes', () => {
    const items = [
      { id: 'ev_001', exactVerbatimText: 'Architected and deployed scalable REST microservices handling 10k RPS.' },
      { id: 'ev_002', exactVerbatimText: 'Architected and deployed scalable REST microservices handling 10k RPS.' }, // Duplicate
      { id: 'ev_003', exactVerbatimText: 'Designed relational schemas in PostgreSQL with B-tree indexing.' },
      { id: 'ev_004', exactVerbatimText: 'Architected and deployed scalable REST microservices handling 10k RPS.' }, // Duplicate
    ];

    const dedupe = detectEvidenceDuplication(items);

    assert.equal(dedupe.uniqueCount, 2, 'Should detect only 2 distinct evidence items');
    assert.equal(dedupe.duplicateCount, 2, 'Should flag 2 duplicate reuses');
    assert.equal(dedupe.duplicateClusters.length, 1);
    assert.equal(dedupe.duplicateClusters[0].originalId, 'ev_001');
    assert.deepEqual(dedupe.duplicateClusters[0].duplicates, ['ev_002', 'ev_004']);
  });

  await t.test('[Test 9] Negative & Contradictory Evidence Detection', () => {
    const mockRepos: any[] = [
      { repoName: 'dead-repo', accessible: false, verificationStatus: 'INACCESSIBLE', sourceTechnologiesFound: [], dependenciesFound: [] },
      { repoName: 'active-repo', accessible: true, verificationStatus: 'VERIFIED', sourceTechnologiesFound: ['python'], dependenciesFound: [] }
    ];

    const result = detectNegativeAndContradictoryEvidence({
      repoInspections: mockRepos,
      claimedSkills: ['Python', 'Kubernetes'],
      claimedEmploymentYears: 8,
      actualCalculatedYears: 3
    });

    assert.equal(result.hasNegativeSignals, true);
    assert.ok(result.inaccessibleRepositories.includes('dead-repo'));
    assert.ok(result.unsupportedClaims.some(c => c.skill === 'Kubernetes'));
    assert.ok(result.experienceDiscrepancies.some(d => d.claimed === 8 && d.actual === 3));
  });

});

