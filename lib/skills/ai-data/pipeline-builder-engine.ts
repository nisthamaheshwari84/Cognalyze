/**
 * lib/skills/ai-data/pipeline-builder-engine.ts
 * 
 * Data & ML Pipeline Builder Engine for Track 4 & Track 5.
 * Executes multi-stage data pipelines on real rowsets, validating schemas,
 * executing transformations, handling failure recovery, and checking data quality.
 */

import { generateSecureId } from "@/lib/crypto-utils";

export type PipelineStageType =
  | "source_ingest"
  | "schema_validation"
  | "cleaning"
  | "transformation"
  | "filtering"
  | "feature_prep"
  | "model_inference"
  | "quality_check"
  | "sink_export";

export interface PipelineStage {
  id: string;
  name: string;
  type: PipelineStageType;
  config: Record<string, any>;
  dependsOn: string[]; // List of parent stage IDs
}

export interface PipelineDefinition {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
}

export interface StageExecutionResult {
  stageId: string;
  stageName: string;
  stageType: PipelineStageType;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  inputRowCount: number;
  outputRowCount: number;
  durationMs: number;
  sampleOutput: Record<string, any>[];
  errorMessage?: string;
}

export interface PipelineRunReport {
  runId: string;
  pipelineId: string;
  success: boolean;
  totalDurationMs: number;
  totalInputRows: number;
  finalOutputRows: number;
  stageResults: StageExecutionResult[];
  error?: string;
  completedAt: string;
}

// ── 1. PIPELINE EXECUTION ENGINE ─────────────────────────────────────────────
export async function executeDataPipeline(
  pipeline: PipelineDefinition,
  initialRowset?: Record<string, any>[],
  injectFailure: boolean = false
): Promise<PipelineRunReport> {
  const startTime = Date.now();
  const runId = generateSecureId("pipe_run", 8);

  // Default raw order stream
  let currentRows: Record<string, any>[] = initialRowset ? [...initialRowset] : [
    { order_id: 101, user_id: "u1", amount: 150.50, status: "completed", timestamp: "2026-03-01T10:00:00Z" },
    { order_id: 102, user_id: "u2", amount: 75.00, status: "completed", timestamp: "2026-03-01T11:30:00Z" },
    { order_id: 103, user_id: "u1", amount: null, status: "pending", timestamp: "2026-03-01T12:00:00Z" },
    { order_id: 104, user_id: "u3", amount: -20.00, status: "refunded", timestamp: "2026-03-01T14:15:00Z" },
    { order_id: 105, user_id: "u4", amount: 210.00, status: "completed", timestamp: "2026-03-01T15:45:00Z" }
  ];

  if (injectFailure) {
    // Injects a corrupt completed transaction with negative amount to test quality check assertion gates
    currentRows.push({
      order_id: 999,
      user_id: "u_corrupted_test",
      amount: -550.00,
      status: "completed",
      timestamp: "2026-03-01T16:00:00Z"
    });
  }

  const totalInputRows = currentRows.length;
  const stageResults: StageExecutionResult[] = [];
  let pipelineSuccess = true;
  let pipelineError: string | undefined = undefined;

  for (const stage of pipeline.stages) {
    const stageStart = Date.now();
    const inputCount = currentRows.length;
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let errorMsg: string | undefined = undefined;

    try {
      switch (stage.type) {
        case "source_ingest": {
          // If stage provides a custom source or override
          if (stage.config.records) {
            currentRows = [...stage.config.records];
          }
          break;
        }

        case "schema_validation": {
          const requiredColumns = stage.config.required_columns || ["order_id", "user_id", "amount"];
          for (const row of currentRows) {
            for (const col of requiredColumns) {
              if (!(col in row)) {
                throw new Error(`Schema Violation: Missing mandatory column '${col}' in record`);
              }
            }
          }
          break;
        }

        case "cleaning": {
          const dropNulls = stage.config.drop_null_columns || ["amount"];
          currentRows = currentRows.filter(r => {
            return !dropNulls.some((col: string) => r[col] === null || r[col] === undefined);
          });
          break;
        }

        case "transformation": {
          // Type casting & conversions
          const castToFloat = stage.config.cast_float || ["amount"];
          currentRows = currentRows.map(r => {
            const copy = { ...r };
            for (const col of castToFloat) {
              if (copy[col] !== null && copy[col] !== undefined) {
                copy[col] = parseFloat(String(copy[col]));
              }
            }
            return copy;
          });
          break;
        }

        case "filtering": {
          const filterCol = stage.config.column || "status";
          const allowedValues = stage.config.allowed_values || ["completed"];
          currentRows = currentRows.filter(r => allowedValues.includes(r[filterCol]));
          break;
        }

        case "quality_check": {
          // Assertions
          if (stage.config.assert_positive_amount) {
            const invalid = currentRows.find(r => r.amount <= 0);
            if (invalid) {
              throw new Error(`Data Quality Breach: Record order_id=${invalid.order_id} has non-positive amount (${invalid.amount})`);
            }
          }
          if (stage.config.assert_unique_pk) {
            const seen = new Set();
            for (const r of currentRows) {
              const pk = r[stage.config.assert_unique_pk || "order_id"];
              if (seen.has(pk)) {
                throw new Error(`Data Quality Breach: Duplicate primary key detected (${pk})`);
              }
              seen.add(pk);
            }
          }
          break;
        }

        case "feature_prep": {
          // Derive features (e.g. log amount, hour of day)
          currentRows = currentRows.map(r => ({
            ...r,
            is_high_value: r.amount >= 100.0 ? 1 : 0
          }));
          break;
        }

        case "model_inference": {
          // Batch scoring simulation
          currentRows = currentRows.map(r => ({
            ...r,
            fraud_score: Number((Math.min(1.0, Math.max(0.01, (r.amount || 0) / 1000.0))).toFixed(3))
          }));
          break;
        }

        case "sink_export": {
          // Final sink destination
          break;
        }
      }
    } catch (err: any) {
      status = "FAILED";
      errorMsg = err.message;
      pipelineSuccess = false;
      pipelineError = errorMsg;
    }

    stageResults.push({
      stageId: stage.id,
      stageName: stage.name,
      stageType: stage.type,
      status,
      inputRowCount: inputCount,
      outputRowCount: status === "SUCCESS" ? currentRows.length : 0,
      durationMs: Date.now() - stageStart,
      sampleOutput: currentRows.slice(0, 3),
      errorMessage: errorMsg
    });

    if (status === "FAILED") {
      const currentIndex = pipeline.stages.findIndex(s => s.id === stage.id);
      for (let k = currentIndex + 1; k < pipeline.stages.length; k++) {
        const skippedStage = pipeline.stages[k];
        stageResults.push({
          stageId: skippedStage.id,
          stageName: skippedStage.name,
          stageType: skippedStage.type,
          status: "SKIPPED",
          inputRowCount: 0,
          outputRowCount: 0,
          durationMs: 0,
          sampleOutput: [],
          errorMessage: `Skipped due to upstream gate failure at stage '${stage.name}'`
        });
      }
      break;
    }
  }

  return {
    runId,
    pipelineId: pipeline.id,
    success: pipelineSuccess,
    totalDurationMs: Date.now() - startTime,
    totalInputRows,
    finalOutputRows: pipelineSuccess ? currentRows.length : 0,
    stageResults,
    error: pipelineError,
    completedAt: new Date().toISOString()
  };
}

