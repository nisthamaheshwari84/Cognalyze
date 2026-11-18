# COGNALYZE × COI: STUDENT DNA API CONTRACT SPECIFICATION
**Version:** 1.0 (Production-Verified)  
**Host Application:** Cognalyze Core (`https://api.cognalyze.com/v1`)  
**Consumer Application:** Cognalyze Opportunity Intelligence (COI)  
**Security Standard:** OAuth 2.1 / Scoped Bearer Tokens + Explicit Student Consent

---

### 1. Architectural Principle
Cognalyze owns canonical **Student DNA**. Opportunity Intelligence owns **Opportunity DNA**. COI securely reads authorized Student DNA snapshots exclusively through versioned REST endpoints. COI never directly queries Cognalyze's internal database tables.

---

### 2. Available Endpoints

#### `GET /api/v1/me`
Returns the authenticated identity and COI connection status.
* **Headers:** `Authorization: Bearer <token>` or `Cookie: cognalyze_session=...`
* **Response (200 OK):**
```json
{
  "success": true,
  "student_id": "usr-01928374-uuid",
  "email": "student@university.edu",
  "account_type": "student",
  "status": "ACTIVE",
  "coi_connection": {
    "connected": true,
    "granted_at": "2026-11-17T21:45:00.000Z",
    "scopes": ["student_dna:read", "placement_profiles:read"]
  }
}
```

---

#### `GET /api/v1/me/student-dna`
Returns the authoritative, sanitized Student DNA snapshot.
* **Required Scope:** `student_dna:read`
* **Error Response (403 Forbidden):** If student has not granted consent:
```json
{
  "error": "Student has not granted authorization to access Student DNA.",
  "code": "CONSENT_REQUIRED",
  "required_scope": "student_dna:read",
  "consent_url": "/connections/consent"
}
```
* **Success Response (200 OK):**
```json
{
  "schema_version": "1.0",
  "student_id": "usr-01928374-uuid",
  "profile_version": 4,
  "updated_at": "2026-11-17T21:40:00.000Z",
  "profile_completeness": {
    "status": "COMPLETE",
    "percentage": 100,
    "missing_sections": []
  },
  "identity": {
    "fullName": "Alice Sharma",
    "username": "alicesharma",
    "college": "IIT Bombay",
    "degree": "B.Tech Computer Science",
    "graduationYear": "2027"
  },
  "technical_skills": [
    {
      "name": "Python",
      "category": "Backend & AI",
      "proficiencyLevel": "Advanced",
      "evidenceStatus": "SUPPORTED",
      "confidenceScore": 0.95,
      "evidenceCount": 4,
      "corroboratingSources": ["github", "internal_assessment"],
      "lastEvaluatedAt": "2026-11-17T21:40:00.000Z"
    }
  ],
  "problem_solving": [
    {
      "platform": "cognalyze_lab",
      "totalSolved": 42,
      "rating": 88,
      "verifiedAt": "2026-11-17T21:40:00.000Z"
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "title": "Distributed Task Scheduler",
      "description": "High-throughput task queue built in Go with Redis backing.",
      "technologies": ["Go", "Redis", "Docker"],
      "githubUrl": "https://github.com/alice/task-scheduler",
      "provenance": "github_scanned"
    }
  ],
  "experience": [
    {
      "id": "exp-1",
      "organization": "Acme Labs",
      "role": "Software Engineering Intern",
      "type": "internship",
      "responsibilities": ["Engineered telemetry ingestion pipelines"],
      "provenance": "verified_offer"
    }
  ],
  "career_goals": [
    {
      "targetRoleTitle": "Distributed Systems Engineer",
      "targetDomains": ["Software Engineering", "AI Systems"],
      "workModePreference": "any",
      "geographicPreferences": ["India", "Remote Global"],
      "availability": "Immediate",
      "riskAppetite": "Moderate"
    }
  ],
  "placement_profiles": [
    {
      "id": "pp-usr-0192",
      "roleTitle": "Software Engineer",
      "roleCategory": "Technology",
      "readinessScore": 88,
      "topSkills": ["Python", "Go", "Docker"],
      "missingSkills": ["Kubernetes"]
    }
  ],
  "evidence_summary": {
    "totalVerifiedArtifacts": 8,
    "sourcesConnected": ["cognalyze_dna"],
    "lastEvidenceAddedAt": "2026-11-17T21:40:00.000Z"
  },
  "consent": {
    "granted": true,
    "grantedAt": "2026-11-17T21:45:00.000Z",
    "scopes": ["student_dna:read", "placement_profiles:read"]
  }
}
```

---

#### `GET /api/v1/me/student-dna/versions`
Enables conditional polling and version reconciliation without heavy data payload transfer.
* **Response (200 OK):**
```json
{
  "success": true,
  "student_id": "usr-01928374-uuid",
  "profile_version": 4,
  "schema_version": "1.0",
  "last_updated_at": "2026-11-17T21:40:00.000Z",
  "skills_count": 12,
  "evidence_count": 8
}
```

---

#### `POST /api/v1/connections/consent`
Creates or updates explicit student consent grant.
* **Payload:**
```json
{
  "scopes": ["student_dna:read", "placement_profiles:read"]
}
```

---

#### `DELETE /api/v1/connections/consent`
Revokes consent. Immediately terminates future reads and signals COI to invalidate cached snapshots.
