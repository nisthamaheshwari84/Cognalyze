/**
 * lib/skills/ai-data/datasets.ts
 * 
 * Authentic, Isolated In-Memory Datasets for the Data Science & Analytics Arena.
 * Provides DDL and verified seed records for:
 * 1. ecommerce_analytics (Users, Orders, Order Items)
 * 2. ab_experiment_stream (Variants, Conversions)
 * 3. marketing_funnel (Funnel Events, Drop-offs)
 * 
 * Permissive, synthetic e-commerce data conforming to strict privacy standards.
 */

export interface DatasetTableSchema {
  tableName: string;
  name?: string;
  description: string;
  createDdl: string;
  insertDml: string;
  columns: Array<{ name: string; type: string; description: string }>;
  sampleRows: Record<string, any>[];
}

export interface AnalyticsDatasetManifest {
  id: string;
  title: string;
  name?: string;
  description: string;
  license: "CC0-PublicDomain" | "MIT" | "Cognalyze-Synthetic";
  tables: DatasetTableSchema[];
}

export const ECOMMERCE_ANALYTICS_DATASET: AnalyticsDatasetManifest = {
  id: "ecommerce_analytics",
  title: "Global E-Commerce Customer & Order Stream",
  description: "Multi-table relational dataset containing customer signups, acquisition channels, and order transaction streams spanning 2025–2026.",
  license: "Cognalyze-Synthetic",
  tables: [
    {
      tableName: "users",
      description: "Registered customers with signup timestamps, acquisition source, and country.",
      createDdl: `
        CREATE TABLE users (
          user_id INTEGER PRIMARY KEY,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL,
          signup_date TEXT NOT NULL,
          acquisition_channel TEXT NOT NULL,
          country TEXT NOT NULL
        );
      `,
      insertDml: `
        INSERT INTO users (user_id, full_name, email, signup_date, acquisition_channel, country) VALUES
        (101, 'Aarav Sharma', 'aarav@example.com', '2025-01-10', 'organic_search', 'IN'),
        (102, 'Priya Patel', 'priya@example.com', '2025-01-15', 'paid_ads', 'IN'),
        (103, 'Liam Smith', 'liam@example.com', '2025-01-20', 'referral', 'US'),
        (104, 'Sophia Chen', 'sophia@example.com', '2025-02-05', 'paid_ads', 'US'),
        (105, 'Rohan Verma', 'rohan@example.com', '2025-02-12', 'organic_search', 'IN'),
        (106, 'Emma Watson', 'emma@example.com', '2025-02-18', 'email_campaign', 'UK'),
        (107, 'Ananya Iyer', 'ananya@example.com', '2025-03-01', 'referral', 'IN'),
        (108, 'Lucas Miller', 'lucas@example.com', '2025-03-10', 'organic_search', 'US'),
        (109, 'Kabir Singh', 'kabir@example.com', '2025-03-15', 'paid_ads', 'IN'),
        (110, 'Olivia Brown', 'olivia@example.com', '2025-04-02', 'organic_search', 'UK');
      `,
      columns: [
        { name: "user_id", type: "INTEGER", description: "Unique customer identifier (Primary Key)" },
        { name: "full_name", type: "TEXT", description: "Customer display name" },
        { name: "email", type: "TEXT", description: "Customer email address" },
        { name: "signup_date", type: "TEXT", description: "ISO Date string (YYYY-MM-DD)" },
        { name: "acquisition_channel", type: "TEXT", description: "Marketing source (organic_search, paid_ads, referral, email_campaign)" },
        { name: "country", type: "TEXT", description: "Two-letter ISO country code" }
      ],
      sampleRows: [
        { user_id: 101, full_name: "Aarav Sharma", email: "aarav@example.com", signup_date: "2025-01-10", acquisition_channel: "organic_search", country: "IN" },
        { user_id: 102, full_name: "Priya Patel", email: "priya@example.com", signup_date: "2025-01-15", acquisition_channel: "paid_ads", country: "IN" },
        { user_id: 103, full_name: "Liam Smith", email: "liam@example.com", signup_date: "2025-01-20", acquisition_channel: "referral", country: "US" }
      ]
    },
    {
      tableName: "orders",
      description: "Transaction records showing order dates, total amounts, and delivery status.",
      createDdl: `
        CREATE TABLE orders (
          order_id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          order_date TEXT NOT NULL,
          amount_cents INTEGER NOT NULL,
          status TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(user_id)
        );
      `,
      insertDml: `
        INSERT INTO orders (order_id, user_id, order_date, amount_cents, status) VALUES
        (1001, 101, '2025-01-12', 4500, 'completed'),
        (1002, 101, '2025-02-14', 6200, 'completed'),
        (1003, 101, '2025-03-20', 3100, 'completed'),
        (1004, 102, '2025-01-18', 8900, 'completed'),
        (1005, 102, '2025-03-11', 4200, 'completed'),
        (1006, 103, '2025-01-25', 12500, 'completed'),
        (1007, 104, '2025-02-10', 5400, 'completed'),
        (1008, 104, '2025-03-15', 7800, 'completed'),
        (1009, 105, '2025-02-16', 3200, 'completed'),
        (1010, 107, '2025-03-05', 9900, 'completed'),
        (1011, 107, '2025-04-12', 4500, 'completed'),
        (1012, 108, '2025-03-14', 11000, 'completed'),
        (1013, 109, '2025-03-22', 2500, 'cancelled'),
        (1014, 110, '2025-04-05', 7300, 'completed');
      `,
      columns: [
        { name: "order_id", type: "INTEGER", description: "Unique transaction identifier (Primary Key)" },
        { name: "user_id", type: "INTEGER", description: "Reference to users.user_id" },
        { name: "order_date", type: "TEXT", description: "Order date in YYYY-MM-DD" },
        { name: "amount_cents", type: "INTEGER", description: "Total price in integer cents ($45.00 = 4500)" },
        { name: "status", type: "TEXT", description: "Order state: completed, cancelled, refunded" }
      ],
      sampleRows: [
        { order_id: 1001, user_id: 101, order_date: "2025-01-12", amount_cents: 4500, status: "completed" },
        { order_id: 1002, user_id: 101, order_date: "2025-02-14", amount_cents: 6200, status: "completed" },
        { order_id: 1004, user_id: 102, order_date: "2025-01-18", amount_cents: 8900, status: "completed" }
      ]
    }
  ]
};

export const AB_EXPERIMENT_DATASET: AnalyticsDatasetManifest = {
  id: "ab_experiment_stream",
  title: "Checkout Redesign A/B Experiment",
  description: "Randomized controlled experiment data testing a 1-click checkout flow against the baseline multi-step checkout.",
  license: "Cognalyze-Synthetic",
  tables: [
    {
      tableName: "experiment_variants",
      description: "User variant assignments with timestamp and allocation group.",
      createDdl: `
        CREATE TABLE experiment_variants (
          assignment_id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          variant_name TEXT NOT NULL,
          assigned_at TEXT NOT NULL
        );
      `,
      insertDml: `
        WITH RECURSIVE cnt(x) AS (
          SELECT 1 UNION ALL SELECT x + 1 FROM cnt WHERE x < 3500
        )
        INSERT INTO experiment_variants (assignment_id, user_id, variant_name, assigned_at)
        SELECT x, 1000 + x, 'control', '2026-03-01 10:00:00' FROM cnt
        UNION ALL
        SELECT 3500 + x, 5000 + x, 'treatment', '2026-03-01 10:00:00' FROM cnt;
      `,
      columns: [
        { name: "assignment_id", type: "INTEGER", description: "Primary Key" },
        { name: "user_id", type: "INTEGER", description: "User identifier" },
        { name: "variant_name", type: "TEXT", description: "'control' or 'treatment'" },
        { name: "assigned_at", type: "TEXT", description: "Timestamp of assignment" }
      ],
      sampleRows: [
        { assignment_id: 1, user_id: 1001, variant_name: "control", assigned_at: "2026-03-01 10:00:00" },
        { assignment_id: 3501, user_id: 5001, variant_name: "treatment", assigned_at: "2026-03-01 10:00:00" }
      ]
    },
    {
      tableName: "experiment_conversions",
      description: "Order conversions originating from users in the active experiment window.",
      createDdl: `
        CREATE TABLE experiment_conversions (
          conversion_id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          converted_at TEXT NOT NULL,
          revenue_cents INTEGER NOT NULL
        );
      `,
      insertDml: `
        WITH RECURSIVE cnt(x) AS (
          SELECT 1 UNION ALL SELECT x + 1 FROM cnt WHERE x < 368
        )
        INSERT INTO experiment_conversions (conversion_id, user_id, converted_at, revenue_cents)
        SELECT x, 1000 + x, '2026-03-01 12:00:00', 4900 FROM cnt;

        WITH RECURSIVE cnt(x) AS (
          SELECT 1 UNION ALL SELECT x + 1 FROM cnt WHERE x < 424
        )
        INSERT INTO experiment_conversions (conversion_id, user_id, converted_at, revenue_cents)
        SELECT 1000 + x, 5000 + x, '2026-03-01 12:00:00', 5500 FROM cnt;
      `,
      columns: [
        { name: "conversion_id", type: "INTEGER", description: "Primary Key" },
        { name: "user_id", type: "INTEGER", description: "User who made a purchase" },
        { name: "converted_at", type: "TEXT", description: "Timestamp of conversion" },
        { name: "revenue_cents", type: "INTEGER", description: "Order revenue in cents" }
      ],
      sampleRows: [
        { conversion_id: 501, user_id: 202, converted_at: "2026-03-01 10:15:00", revenue_cents: 4900 },
        { conversion_id: 502, user_id: 204, converted_at: "2026-03-01 10:45:00", revenue_cents: 7500 }
      ]
    }
  ]
};

export const ALL_ANALYTICS_DATASETS: Record<string, AnalyticsDatasetManifest> = {
  ecommerce_analytics: ECOMMERCE_ANALYTICS_DATASET,
  ab_experiment_stream: AB_EXPERIMENT_DATASET
};

export function getAnalyticsDataset(id: string): AnalyticsDatasetManifest {
  return ALL_ANALYTICS_DATASETS[id] || ECOMMERCE_ANALYTICS_DATASET;
}

export function getAllAnalyticsDatasets(): AnalyticsDatasetManifest[] {
  return Object.values(ALL_ANALYTICS_DATASETS);
}
