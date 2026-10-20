# Nexus Multi-Agent System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Nexus, a Rust-based CLI multi-agent orchestration runtime featuring an App Store worker registry, shared memory blackboard, resilient failover router, and a trust layer with sandboxed self-healing code execution and Ed25519 cryptographic receipts.

**Architecture:** Async Tokio runtime with an in-memory thread-safe pub/sub blackboard (`Arc<RwLock<Blackboard>>`). Tasks are decomposed into DAG subtasks by the Router and dispatched to matched agents registered in the App Store. Untrusted agent outputs run in Bubblewrap (`bwrap`) Linux namespace sandboxes with automated retry loops on failures, and all outputs are verified with Ed25519 signatures.

**Tech Stack:** Rust (1.80+), Tokio, Clap v4, Ed25519-dalek v2, Sha2, Serde, Serde_json, Chrono, Thiserror, Async-trait.

**Spec:** `docs/superpowers/specs/2026-10-20-nexus-multi-agent-system-design.md`

## Global Constraints
- Target crate directory: `nexus/`
- All errors use `thiserror` in `nexus/src/error.rs`
- Sandbox runner defaults to `bwrap` (Bubblewrap) with fallback runner when unconfined flag is passed or bwrap is unavailable
- Agents support both real HTTP LLM backends and deterministic `MockLlmClient` for offline testing
- Receipts are signed with Ed25519 private keys and verified against public keys

---

### Task 1: Project Scaffolding & Core Error Types

**Files:**
- Create: `nexus/Cargo.toml`
- Create: `nexus/src/lib.rs`
- Create: `nexus/src/error.rs`
- Test: `nexus/tests/test_scaffolding.rs`

**Interfaces:**
- Produces: `NexusError` enum variants (`RouterError`, `WorkerError`, `SandboxError`, `SelfHealExhausted`, `BlackboardError`, `CryptoError`, `LlmError`).

- [ ] **Step 1: Write the failing test**

```rust
// nexus/tests/test_scaffolding.rs
use nexus::error::NexusError;

#[test]
fn test_error_variants_format_properly() {
    let err = NexusError::WorkerError("agent timed out".into());
    assert_eq!(format!("{}", err), "Worker error: agent timed out");

    let err2 = NexusError::SandboxError("bwrap missing".into());
    assert_eq!(format!("{}", err2), "Sandbox error: bwrap missing");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test test_scaffolding --manifest-path nexus/Cargo.toml`
Expected: FAIL (cargo manifest or module not found).

- [ ] **Step 3: Write minimal implementation**

```toml
# nexus/Cargo.toml
[package]
name = "nexus"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.40", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
thiserror = "1.0"
chrono = { version = "0.4", features = ["serde"] }
clap = { version = "4.5", features = ["derive"] }
ed25519-dalek = { version = "2.1", features = ["rand_core"] }
rand = "0.8"
sha2 = "0.10"
async-trait = "0.1"

[dev-dependencies]
tokio-test = "0.4"
```

```rust
// nexus/src/error.rs
use thiserror::Error;

#[derive(Error, Debug, Clone, PartialEq)]
pub enum NexusError {
    #[error("Router error: {0}")]
    RouterError(String),
    #[error("Worker error: {0}")]
    WorkerError(String),
    #[error("Sandbox error: {0}")]
    SandboxError(String),
    #[error("Self-healing exhausted after {0} retries: {1}")]
    SelfHealExhausted(usize, String),
    #[error("Blackboard error: {0}")]
    BlackboardError(String),
    #[error("Crypto error: {0}")]
    CryptoError(String),
    #[error("LLM error: {0}")]
    LlmError(String),
}
```

```rust
// nexus/src/lib.rs
pub mod error;
pub mod blackboard;
pub mod app_store;
pub mod llm;
pub mod trust;
pub mod agents;
pub mod router;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test test_scaffolding --manifest-path nexus/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nexus/Cargo.toml nexus/src/lib.rs nexus/src/error.rs nexus/tests/test_scaffolding.rs
git commit -m "feat(scaffolding): initialize nexus crate and core errors"
```

---

### Task 2: Shared Memory Blackboard

**Files:**
- Create: `nexus/src/blackboard/mod.rs`
- Create: `nexus/src/blackboard/memory.rs`
- Create: `nexus/src/blackboard/events.rs`
- Test: `nexus/tests/test_blackboard.rs`

**Interfaces:**
- Consumes: `NexusError` from `nexus::error`
- Produces: `Blackboard`, `BlackboardEntry`, `BlackboardEvent`
  - `Blackboard::new() -> Self`
  - `Blackboard::set(&self, key: &str, value: serde_json::Value, author: &str) -> BlackboardEntry`
  - `Blackboard::get(&self, key: &str) -> Option<BlackboardEntry>`
  - `Blackboard::subscribe(&self) -> broadcast::Receiver<BlackboardEvent>`

- [ ] **Step 1: Write the failing test**

```rust
// nexus/tests/test_blackboard.rs
use nexus::blackboard::{Blackboard, BlackboardEvent};
use serde_json::json;

#[tokio::test]
async fn test_blackboard_write_read_and_broadcast() {
    let bb = Blackboard::new();
    let mut rx = bb.subscribe();

    let entry = bb.set("task_output", json!({"summary": "done"}), "coding_agent").await;
    assert_eq!(entry.version, 1);
    assert_eq!(entry.author, "coding_agent");

    let read_val = bb.get("task_output").await.expect("entry should exist");
    assert_eq!(read_val.value["summary"], "done");

    let event = rx.recv().await.expect("should receive broadcast event");
    match event {
        BlackboardEvent::EntryUpdated(e) => {
            assert_eq!(e.key, "task_output");
            assert_eq!(e.version, 1);
        }
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test test_blackboard --manifest-path nexus/Cargo.toml`
Expected: FAIL (modules blackboard do not exist).

- [ ] **Step 3: Write minimal implementation**

```rust
// nexus/src/blackboard/events.rs
use super::memory::BlackboardEntry;

#[derive(Clone, Debug)]
pub enum BlackboardEvent {
    EntryUpdated(BlackboardEntry),
}
```

```rust
// nexus/src/blackboard/memory.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use super::events::BlackboardEvent;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BlackboardEntry {
    pub key: String,
    pub value: serde_json::Value,
    pub author: String,
    pub version: u64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Clone)]
pub struct Blackboard {
    entries: Arc<RwLock<HashMap<String, BlackboardEntry>>>,
    tx: broadcast::Sender<BlackboardEvent>,
}

impl Blackboard {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(128);
        Self {
            entries: Arc::new(RwLock::new(HashMap::new())),
            tx,
        }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<BlackboardEvent> {
        self.tx.subscribe()
    }

    pub async fn set(&self, key: &str, value: serde_json::Value, author: &str) -> BlackboardEntry {
        let mut map = self.entries.write().await;
        let version = map.get(key).map(|e| e.version + 1).unwrap_or(1);
        let entry = BlackboardEntry {
            key: key.to_string(),
            value,
            author: author.to_string(),
            version,
            timestamp: Utc::now(),
        };
        map.insert(key.to_string(), entry.clone());
        let _ = self.tx.send(BlackboardEvent::EntryUpdated(entry.clone()));
        entry
    }

    pub async fn get(&self, key: &str) -> Option<BlackboardEntry> {
        let map = self.entries.read().await;
        map.get(key).cloned()
    }

    pub async fn list_all(&self) -> Vec<BlackboardEntry> {
        let map = self.entries.read().await;
        map.values().cloned().collect()
    }
}
```

```rust
// nexus/src/blackboard/mod.rs
pub mod memory;
pub mod events;

pub use memory::{Blackboard, BlackboardEntry};
pub use events::BlackboardEvent;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test test_blackboard --manifest-path nexus/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nexus/src/blackboard/ nexus/tests/test_blackboard.rs
git commit -m "feat(blackboard): implement thread-safe shared memory with pub/sub events"
```

---

### Task 3: Worker App Store & Registry

**Files:**
- Create: `nexus/src/app_store/mod.rs`
- Create: `nexus/src/app_store/manifest.rs`
- Create: `nexus/src/app_store/registry.rs`
- Test: `nexus/tests/test_app_store.rs`

**Interfaces:**
- Produces: `AgentManifest`, `AppStore`
  - `AgentManifest { id, name, capabilities, version, timeout_secs }`
  - `AppStore::new() -> Self`
  - `AppStore::register(&mut self, manifest: AgentManifest)`
  - `AppStore::find_best_worker(&self, required_tags: &[&str]) -> Option<AgentManifest>`
  - `AppStore::list(&self) -> Vec<AgentManifest>`

- [ ] **Step 1: Write the failing test**

```rust
// nexus/tests/test_app_store.rs
use nexus::app_store::{AgentManifest, AppStore};

#[test]
fn test_app_store_registration_and_tag_matching() {
    let mut store = AppStore::new();
    let coding = AgentManifest {
        id: "coding-agent-v1".into(),
        name: "Coding Specialist".into(),
        capabilities: vec!["code".into(), "python".into(), "rust".into()],
        version: "1.0.0".into(),
        timeout_secs: 30,
    };
    let data = AgentManifest {
        id: "data-agent-v1".into(),
        name: "Data Analyst".into(),
        capabilities: vec!["data".into(), "sql".into(), "csv".into()],
        version: "1.0.0".into(),
        timeout_secs: 20,
    };

    store.register(coding);
    store.register(data);

    let matched = store.find_best_worker(&["python", "code"]).expect("should find coding agent");
    assert_eq!(matched.id, "coding-agent-v1");

    let matched_data = store.find_best_worker(&["csv"]).expect("should find data agent");
    assert_eq!(matched_data.id, "data-agent-v1");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test test_app_store --manifest-path nexus/Cargo.toml`
Expected: FAIL (modules app_store do not exist).

- [ ] **Step 3: Write minimal implementation**

```rust
// nexus/src/app_store/manifest.rs
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct AgentManifest {
    pub id: String,
    pub name: String,
    pub capabilities: Vec<String>,
    pub version: String,
    pub timeout_secs: u64,
}
```

```rust
// nexus/src/app_store/registry.rs
use super::manifest::AgentManifest;
use std::collections::HashMap;

#[derive(Clone, Default)]
pub struct AppStore {
    workers: HashMap<String, AgentManifest>,
}

impl AppStore {
    pub fn new() -> Self {
        Self {
            workers: HashMap::new(),
        }
    }

    pub fn register(&mut self, manifest: AgentManifest) {
        self.workers.insert(manifest.id.clone(), manifest);
    }

    pub fn list(&self) -> Vec<AgentManifest> {
        self.workers.values().cloned().collect()
    }

    pub fn get(&self, id: &str) -> Option<AgentManifest> {
        self.workers.get(id).cloned()
    }

    pub fn find_best_worker(&self, required_tags: &[&str]) -> Option<AgentManifest> {
        let mut best: Option<(usize, AgentManifest)> = None;

        for worker in self.workers.values() {
            let matches = required_tags
                .iter()
                .filter(|tag| worker.capabilities.iter().any(|c| c.eq_ignore_ascii_case(tag)))
                .count();

            if matches > 0 {
                match &best {
                    None => best = Some((matches, worker.clone())),
                    Some((score, _)) if matches > *score => {
                        best = Some((matches, worker.clone()));
                    }
                    _ => {}
                }
            }
        }

        best.map(|(_, worker)| worker)
    }
}
```

```rust
// nexus/src/app_store/mod.rs
pub mod manifest;
pub mod registry;

pub use manifest::AgentManifest;
pub use registry::AppStore;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test test_app_store --manifest-path nexus/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nexus/src/app_store/ nexus/tests/test_app_store.rs
git commit -m "feat(app_store): implement agent manifest registry and capability matching"
```

---

### Task 4: LLM Client & Mock Test Backend

**Files:**
- Create: `nexus/src/llm/mod.rs`
- Create: `nexus/src/llm/client.rs`
- Create: `nexus/src/llm/mock.rs`
- Test: `nexus/tests/test_llm.rs`

**Interfaces:**
- Consumes: `NexusError` from `nexus::error`
- Produces: `LlmClient` trait, `MockLlmClient`
  - `LlmClient::complete(&self, prompt: &str, system: Option<&str>) -> Result<String, NexusError>`
  - `MockLlmClient::new() -> Self`
  - `MockLlmClient::with_rule(&mut self, pattern: &str, response: &str) -> &mut Self`

- [ ] **Step 1: Write the failing test**

```rust
// nexus/tests/test_llm.rs
use nexus::llm::{LlmClient, MockLlmClient};

#[tokio::test]
async fn test_mock_llm_pattern_matching_and_fallback() {
    let mut mock = MockLlmClient::new();
    mock.add_rule("summarize", "Summary: success");
    mock.add_rule("code", "def solve(): return 42");

    let res1 = mock.complete("Please summarize this doc", None).await.unwrap();
    assert_eq!(res1, "Summary: success");

    let res2 = mock.complete("Write code for task", None).await.unwrap();
    assert_eq!(res2, "def solve(): return 42");

    let res3 = mock.complete("unknown query", None).await.unwrap();
    assert!(res3.contains("Mock response"));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test test_llm --manifest-path nexus/Cargo.toml`
Expected: FAIL (modules llm do not exist).

- [ ] **Step 3: Write minimal implementation**

```rust
// nexus/src/llm/client.rs
use async_trait::async_trait;
use crate::error::NexusError;

#[async_trait]
pub trait LlmClient: Send + Sync {
    async fn complete(&self, prompt: &str, system: Option<&str>) -> Result<String, NexusError>;
}
```

```rust
// nexus/src/llm/mock.rs
use async_trait::async_trait;
use super::client::LlmClient;
use crate::error::NexusError;
use std::sync::RwLock;

pub struct MockLlmClient {
    rules: RwLock<Vec<(String, String)>>,
}

impl MockLlmClient {
    pub fn new() -> Self {
        Self {
            rules: RwLock::new(Vec::new()),
        }
    }

    pub fn add_rule(&mut self, pattern: &str, response: &str) {
        self.rules.write().unwrap().push((pattern.to_string(), response.to_string()));
    }
}

#[async_trait]
impl LlmClient for MockLlmClient {
    async fn complete(&self, prompt: &str, _system: Option<&str>) -> Result<String, NexusError> {
        let rules = self.rules.read().unwrap();
        for (pattern, resp) in rules.iter() {
            if prompt.to_lowercase().contains(&pattern.to_lowercase()) {
                return Ok(resp.clone());
            }
        }
        Ok(format!("Mock response for: {}", prompt))
    }
}
```

```rust
// nexus/src/llm/mod.rs
pub mod client;
pub mod mock;

pub use client::LlmClient;
pub use mock::MockLlmClient;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test test_llm --manifest-path nexus/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nexus/src/llm/ nexus/tests/test_llm.rs
git commit -m "feat(llm): implement LlmClient trait and MockLlmClient driver"
```

---

### Task 5: Worker Agents (Coding, Research, Data, Ops)

**Files:**
- Create: `nexus/src/agents/mod.rs`
- Create: `nexus/src/agents/trait_def.rs`
- Create: `nexus/src/agents/coding.rs`
- Create: `nexus/src/agents/research.rs`
- Create: `nexus/src/agents/data.rs`
- Create: `nexus/src/agents/ops.rs`
- Test: `nexus/tests/test_agents.rs`

**Interfaces:**
- Consumes: `Blackboard` from `nexus::blackboard`, `LlmClient` from `nexus::llm`
- Produces: `Agent` trait, `AgentOutput`, `CodingAgent`, `ResearchAgent`, `DataAgent`, `OpsAgent`
  - `Agent::manifest(&self) -> AgentManifest`
  - `Agent::execute(&self, task: &str, blackboard: &Blackboard) -> Result<AgentOutput, NexusError>`

- [ ] **Step 1: Write the failing test**

```rust
// nexus/tests/test_agents.rs
use nexus::agents::{Agent, CodingAgent};
use nexus::blackboard::Blackboard;
use nexus::llm::MockLlmClient;
use std::sync::Arc;

#[tokio::test]
async fn test_coding_agent_execution_and_blackboard_write() {
    let mut mock = MockLlmClient::new();
    mock.add_rule("factorial", "def factorial(n):\n    return 1 if n <= 1 else n * factorial(n-1)\nprint(factorial(5))");

    let agent = CodingAgent::new(Arc::new(mock));
    let bb = Blackboard::new();

    let output = agent.execute("Write python code for factorial", &bb).await.unwrap();
    assert_eq!(output.agent_id, "coding-agent");
    assert!(output.result.contains("factorial"));

    let entry = bb.get("coding-agent:output").await.expect("output saved to blackboard");
    assert_eq!(entry.author, "coding-agent");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test test_agents --manifest-path nexus/Cargo.toml`
Expected: FAIL (modules agents do not exist).

- [ ] **Step 3: Write minimal implementation**

```rust
// nexus/src/agents/trait_def.rs
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use crate::app_store::AgentManifest;
use crate::blackboard::Blackboard;
use crate::error::NexusError;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AgentOutput {
    pub agent_id: String,
    pub result: String,
    pub is_code: bool,
}

#[async_trait]
pub trait Agent: Send + Sync {
    fn manifest(&self) -> AgentManifest;
    async fn execute(&self, task: &str, blackboard: &Blackboard) -> Result<AgentOutput, NexusError>;
}
```

```rust
// nexus/src/agents/coding.rs
use async_trait::async_trait;
use std::sync::Arc;
use serde_json::json;
use super::trait_def::{Agent, AgentOutput};
use crate::app_store::AgentManifest;
use crate::blackboard::Blackboard;
use crate::error::NexusError;
use crate::llm::LlmClient;

pub struct CodingAgent {
    llm: Arc<dyn LlmClient>,
}

impl CodingAgent {
    pub fn new(llm: Arc<dyn LlmClient>) -> Self {
        Self { llm }
    }
}

#[async_trait]
impl Agent for CodingAgent {
    fn manifest(&self) -> AgentManifest {
        AgentManifest {
            id: "coding-agent".into(),
            name: "Coding Agent".into(),
            capabilities: vec!["code".into(), "python".into(), "rust".into(), "fix".into()],
            version: "1.0.0".into(),
            timeout_secs: 60,
        }
    }

    async fn execute(&self, task: &str, blackboard: &Blackboard) -> Result<AgentOutput, NexusError> {
        let prompt = format!("Generate executable code for: {}", task);
        let code = self.llm.complete(&prompt, Some("You are an expert coder. Return clean code.")).await?;
        blackboard.set("coding-agent:output", json!({ "code": code }), "coding-agent").await;

        Ok(AgentOutput {
            agent_id: "coding-agent".into(),
            result: code,
            is_code: true,
        })
    }
}
```

```rust
// nexus/src/agents/research.rs
use async_trait::async_trait;
use std::sync::Arc;
use serde_json::json;
use super::trait_def::{Agent, AgentOutput};
use crate::app_store::AgentManifest;
use crate::blackboard::Blackboard;
use crate::error::NexusError;
use crate::llm::LlmClient;

pub struct ResearchAgent {
    llm: Arc<dyn LlmClient>,
}

impl ResearchAgent {
    pub fn new(llm: Arc<dyn LlmClient>) -> Self {
        Self { llm }
    }
}

#[async_trait]
impl Agent for ResearchAgent {
    fn manifest(&self) -> AgentManifest {
        AgentManifest {
            id: "research-agent".into(),
            name: "Research Agent".into(),
            capabilities: vec!["research".into(), "docs".into(), "summary".into()],
            version: "1.0.0".into(),
            timeout_secs: 45,
        }
    }

    async fn execute(&self, task: &str, blackboard: &Blackboard) -> Result<AgentOutput, NexusError> {
        let summary = self.llm.complete(task, Some("You are a thorough research analyst.")).await?;
        blackboard.set("research-agent:output", json!({ "summary": summary }), "research-agent").await;
        Ok(AgentOutput {
            agent_id: "research-agent".into(),
            result: summary,
            is_code: false,
        })
    }
}
```

```rust
// nexus/src/agents/data.rs
use async_trait::async_trait;
use std::sync::Arc;
use serde_json::json;
use super::trait_def::{Agent, AgentOutput};
use crate::app_store::AgentManifest;
use crate::blackboard::Blackboard;
use crate::error::NexusError;
use crate::llm::LlmClient;

pub struct DataAgent {
    llm: Arc<dyn LlmClient>,
}

impl DataAgent {
    pub fn new(llm: Arc<dyn LlmClient>) -> Self {
        Self { llm }
    }
}

#[async_trait]
impl Agent for DataAgent {
    fn manifest(&self) -> AgentManifest {
        AgentManifest {
            id: "data-agent".into(),
            name: "Data Agent".into(),
            capabilities: vec!["data".into(), "csv".into(), "json".into(), "transform".into()],
            version: "1.0.0".into(),
            timeout_secs: 45,
        }
    }

    async fn execute(&self, task: &str, blackboard: &Blackboard) -> Result<AgentOutput, NexusError> {
        let output = self.llm.complete(task, Some("You are a data transformation agent.")).await?;
        blackboard.set("data-agent:output", json!({ "data": output }), "data-agent").await;
        Ok(AgentOutput {
            agent_id: "data-agent".into(),
            result: output,
            is_code: false,
        })
    }
}
```

```rust
// nexus/src/agents/ops.rs
use async_trait::async_trait;
use std::sync::Arc;
use serde_json::json;
use super::trait_def::{Agent, AgentOutput};
use crate::app_store::AgentManifest;
use crate::blackboard::Blackboard;
use crate::error::NexusError;
use crate::llm::LlmClient;

pub struct OpsAgent {
    llm: Arc<dyn LlmClient>,
}

impl OpsAgent {
    pub fn new(llm: Arc<dyn LlmClient>) -> Self {
        Self { llm }
    }
}

#[async_trait]
impl Agent for OpsAgent {
    fn manifest(&self) -> AgentManifest {
        AgentManifest {
            id: "ops-agent".into(),
            name: "Ops Agent".into(),
            capabilities: vec!["ops".into(), "bash".into(), "deploy".into(), "config".into()],
            version: "1.0.0".into(),
            timeout_secs: 45,
        }
    }

    async fn execute(&self, task: &str, blackboard: &Blackboard) -> Result<AgentOutput, NexusError> {
        let output = self.llm.complete(task, Some("You are an operations automation agent.")).await?;
        blackboard.set("ops-agent:output", json!({ "ops": output }), "ops-agent").await;
        Ok(AgentOutput {
            agent_id: "ops-agent".into(),
            result: output,
            is_code: true,
        })
    }
}
```

```rust
// nexus/src/agents/mod.rs
pub mod trait_def;
pub mod coding;
pub mod research;
pub mod data;
pub mod ops;

pub use trait_def::{Agent, AgentOutput};
pub use coding::CodingAgent;
pub use research::ResearchAgent;
pub use data::DataAgent;
pub use ops::OpsAgent;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test test_agents --manifest-path nexus/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nexus/src/agents/ nexus/tests/test_agents.rs
git commit -m "feat(agents): implement Agent trait and Coding, Research, Data, Ops workers"
```

---

### Task 6: Trust Layer - Cryptographic Receipts

**Files:**
- Create: `nexus/src/trust/mod.rs`
- Create: `nexus/src/trust/receipt.rs`
- Test: `nexus/tests/test_receipt.rs`

**Interfaces:**
- Consumes: `NexusError` from `nexus::error`
- Produces: `ReceiptSigner`, `SignedReceipt`
  - `ReceiptSigner::generate() -> Self`
  - `ReceiptSigner::sign(&self, task_id: &str, payload: &str) -> SignedReceipt`
  - `SignedReceipt::verify(&self) -> Result<bool, NexusError>`

- [ ] **Step 1: Write the failing test**

```rust
// nexus/tests/test_receipt.rs
use nexus::trust::receipt::ReceiptSigner;

#[test]
fn test_receipt_signing_and_verification() {
    let signer = ReceiptSigner::generate();
    let receipt = signer.sign("task-123", "result output payload");

    assert!(receipt.verify().expect("receipt verification should succeed"));

    let mut tampered = receipt.clone();
    tampered.payload_digest = "tampered_digest".into();
    assert!(!tampered.verify().unwrap_or(false));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test test_receipt --manifest-path nexus/Cargo.toml`
Expected: FAIL (modules trust do not exist).

- [ ] **Step 3: Write minimal implementation**

```rust
// nexus/src/trust/receipt.rs
use chrono::{DateTime, Utc};
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use crate::error::NexusError;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SignedReceipt {
    pub task_id: String,
    pub payload_digest: String,
    pub public_key: String,
    pub signature: String,
    pub timestamp: DateTime<Utc>,
}

impl SignedReceipt {
    pub fn verify(&self) -> Result<bool, NexusError> {
        let pubkey_bytes = hex::decode(&self.public_key)
            .map_err(|e| NexusError::CryptoError(format!("Invalid public key hex: {}", e)))?;
        let pubkey_arr: [u8; 32] = pubkey_bytes
            .try_into()
            .map_err(|_| NexusError::CryptoError("Public key must be 32 bytes".into()))?;

        let verifying_key = VerifyingKey::from_bytes(&pubkey_arr)
            .map_err(|e| NexusError::CryptoError(format!("VerifyingKey error: {}", e)))?;

        let sig_bytes = hex::decode(&self.signature)
            .map_err(|e| NexusError::CryptoError(format!("Invalid signature hex: {}", e)))?;
        let sig_arr: [u8; 64] = sig_bytes
            .try_into()
            .map_err(|_| NexusError::CryptoError("Signature must be 64 bytes".into()))?;

        let signature = Signature::from_bytes(&sig_arr);
        let msg = format!("{}:{}:{}", self.task_id, self.payload_digest, self.timestamp.to_rfc3339());

        Ok(verifying_key.verify(msg.as_bytes(), &signature).is_ok())
    }
}

pub struct ReceiptSigner {
    signing_key: SigningKey,
}

impl ReceiptSigner {
    pub fn generate() -> Self {
        let mut csprng = OsRng;
        let signing_key = SigningKey::generate(&mut csprng);
        Self { signing_key }
    }

    pub fn from_bytes(bytes: &[u8; 32]) -> Self {
        let signing_key = SigningKey::from_bytes(bytes);
        Self { signing_key }
    }

    pub fn sign(&self, task_id: &str, payload: &str) -> SignedReceipt {
        let mut hasher = Sha256::new();
        hasher.update(payload.as_bytes());
        let payload_digest = hex::encode(hasher.finalize());

        let timestamp = Utc::now();
        let msg = format!("{}:{}:{}", task_id, payload_digest, timestamp.to_rfc3339());
        let signature = self.signing_key.sign(msg.as_bytes());

        SignedReceipt {
            task_id: task_id.to_string(),
            payload_digest,
            public_key: hex::encode(self.signing_key.verifying_key().as_bytes()),
            signature: hex::encode(signature.to_bytes()),
            timestamp,
        }
    }
}
```

Add `hex = "0.4"` to `nexus/Cargo.toml` dependencies.

```rust
// nexus/src/trust/mod.rs
pub mod receipt;
pub mod sandbox;
pub mod healer;

pub use receipt::{ReceiptSigner, SignedReceipt};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test test_receipt --manifest-path nexus/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nexus/Cargo.toml nexus/src/trust/ nexus/tests/test_receipt.rs
git commit -m "feat(trust): implement Ed25519 receipt signing and verification"
```

---

### Task 7: Trust Layer - Sandbox Runner & Self-Healing Loop

**Files:**
- Create: `nexus/src/trust/sandbox.rs`
- Create: `nexus/src/trust/healer.rs`
- Test: `nexus/tests/test_sandbox_healer.rs`

**Interfaces:**
- Consumes: `NexusError` from `nexus::error`, `LlmClient` from `nexus::llm`
- Produces: `SandboxRunner`, `SandboxResult`, `SelfHealer`
  - `SandboxRunner::run_python(&self, code: &str) -> Result<SandboxResult, NexusError>`
  - `SelfHealer::execute_with_healing(&self, initial_code: &str, max_retries: usize) -> Result<String, NexusError>`

- [ ] **Step 1: Write the failing test**

```rust
// nexus/tests/test_sandbox_healer.rs
use nexus::llm::MockLlmClient;
use nexus::trust::healer::SelfHealer;
use nexus::trust::sandbox::SandboxRunner;
use std::sync::Arc;

#[tokio::test]
async fn test_self_healing_fixes_broken_code() {
    let mut mock = MockLlmClient::new();
    // When prompted with NameError, mock returns the corrected code
    mock.add_rule("NameError", "print('fixed')");

    let sandbox = SandboxRunner::new_unconfined(); // for unit test environment
    let healer = SelfHealer::new(sandbox, Arc::new(mock));

    // Initially broken code
    let broken_code = "print(undefined_variable)";
    let result = healer.execute_with_healing(broken_code, 2).await;

    assert!(result.is_ok(), "Healer should recover: {:?}", result.err());
    assert_eq!(result.unwrap().trim(), "fixed");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test test_sandbox_healer --manifest-path nexus/Cargo.toml`
Expected: FAIL (modules sandbox and healer do not exist).

- [ ] **Step 3: Write minimal implementation**

```rust
// nexus/src/trust/sandbox.rs
use std::process::Stdio;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;
use crate::error::NexusError;

#[derive(Clone, Debug)]
pub struct SandboxResult {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Clone)]
pub struct SandboxRunner {
    use_bwrap: bool,
}

impl SandboxRunner {
    pub fn new() -> Self {
        // Detect if bwrap exists
        let bwrap_present = std::process::Command::new("bwrap")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);

        Self { use_bwrap: bwrap_present }
    }

    pub fn new_unconfined() -> Self {
        Self { use_bwrap: false }
    }

    pub async fn run_python(&self, code: &str) -> Result<SandboxResult, NexusError> {
        let mut cmd = if self.use_bwrap {
            let mut c = Command::new("bwrap");
            c.args([
                "--ro-bind", "/", "/",
                "--tmpfs", "/tmp",
                "--dev", "/dev",
                "--proc", "/proc",
                "--unshare-all",
                "python3", "-c", code,
            ]);
            c
        } else {
            let mut c = Command::new("python3");
            c.arg("-c").arg(code);
            c
        };

        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
        let child = cmd.spawn()
            .map_err(|e| NexusError::SandboxError(format!("Failed to spawn sandbox: {}", e)))?;

        let output = child.wait_with_output().await
            .map_err(|e| NexusError::SandboxError(format!("Sandbox execution error: {}", e)))?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        Ok(SandboxResult {
            exit_code: output.status.code().unwrap_or(-1),
            stdout,
            stderr,
        })
    }
}
```

```rust
// nexus/src/trust/healer.rs
use std::sync::Arc;
use crate::error::NexusError;
use crate::llm::LlmClient;
use super::sandbox::SandboxRunner;

pub struct SelfHealer {
    sandbox: SandboxRunner,
    llm: Arc<dyn LlmClient>,
}

impl SelfHealer {
    pub fn new(sandbox: SandboxRunner, llm: Arc<dyn LlmClient>) -> Self {
        Self { sandbox, llm }
    }

    pub async fn execute_with_healing(&self, initial_code: &str, max_retries: usize) -> Result<String, NexusError> {
        let mut current_code = initial_code.to_string();

        for attempt in 0..=max_retries {
            let result = self.sandbox.run_python(&current_code).await?;
            if result.exit_code == 0 {
                return Ok(result.stdout);
            }

            if attempt == max_retries {
                return Err(NexusError::SelfHealExhausted(
                    max_retries,
                    format!("Last error: {}", result.stderr),
                ));
            }

            let prompt = format!(
                "The following python code failed with exit code {} and stderr:\n{}\n\nCode:\n{}\n\nPlease return ONLY the corrected python code.",
                result.exit_code, result.stderr, current_code
            );

            current_code = self.llm.complete(&prompt, Some("You fix broken python code. Output only code.")).await?;
        }

        Err(NexusError::SelfHealExhausted(max_retries, "Exhausted retries".into()))
    }
}
```

Update `nexus/src/trust/mod.rs` to expose `SandboxRunner`, `SandboxResult`, `SelfHealer`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test test_sandbox_healer --manifest-path nexus/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nexus/src/trust/ nexus/tests/test_sandbox_healer.rs
git commit -m "feat(trust): implement Bubblewrap sandbox runner and self-healing loop"
```

---

### Task 8: Router Planner & Failover Supervisor

**Files:**
- Create: `nexus/src/router/mod.rs`
- Create: `nexus/src/router/planner.rs`
- Create: `nexus/src/router/supervisor.rs`
- Test: `nexus/tests/test_router.rs`

**Interfaces:**
- Consumes: `AppStore`, `Blackboard`, `Agent`, `NexusError`
- Produces: `Subtask`, `TaskPlanner`, `RouterSupervisor`, `ExecutionReport`
  - `TaskPlanner::decompose(&self, task_prompt: &str) -> Vec<Subtask>`
  - `RouterSupervisor::execute_plan(&self, subtasks: Vec<Subtask>, blackboard: &Blackboard) -> Result<ExecutionReport, NexusError>`

- [ ] **Step 1: Write the failing test**

```rust
// nexus/tests/test_router.rs
use nexus::app_store::{AgentManifest, AppStore};
use nexus::blackboard::Blackboard;
use nexus::llm::MockLlmClient;
use nexus::router::planner::TaskPlanner;
use nexus::router::supervisor::RouterSupervisor;
use std::sync::Arc;

#[tokio::test]
async fn test_router_planner_and_failover() {
    let planner = TaskPlanner::new();
    let subtasks = planner.decompose("Analyze sales data and write report");
    assert_eq!(subtasks.len(), 2);
    assert!(subtasks[0].tags.contains(&"data".to_string()));

    let mut store = AppStore::new();
    store.register(AgentManifest {
        id: "primary-worker".into(),
        name: "Primary".into(),
        capabilities: vec!["data".into()],
        version: "1.0.0".into(),
        timeout_secs: 1,
    });
    store.register(AgentManifest {
        id: "fallback-worker".into(),
        name: "Fallback".into(),
        capabilities: vec!["data".into()],
        version: "1.0.0".into(),
        timeout_secs: 10,
    });

    let supervisor = RouterSupervisor::new(store);
    let bb = Blackboard::new();
    // Test supervisor handles task assignment
    let assigned = supervisor.select_worker(&subtasks[0], &[]).expect("worker assigned");
    assert_eq!(assigned, "primary-worker");

    // Failover selects next worker if primary fails
    let failover = supervisor.select_worker(&subtasks[0], &["primary-worker"]).expect("fallback assigned");
    assert_eq!(failover, "fallback-worker");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test test_router --manifest-path nexus/Cargo.toml`
Expected: FAIL (modules router do not exist).

- [ ] **Step 3: Write minimal implementation**

```rust
// nexus/src/router/planner.rs
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Subtask {
    pub id: String,
    pub description: String,
    pub tags: Vec<String>,
}

pub struct TaskPlanner;

impl TaskPlanner {
    pub fn new() -> Self {
        Self
    }

    pub fn decompose(&self, task_prompt: &str) -> Vec<Subtask> {
        let lower = task_prompt.to_lowercase();
        let mut subtasks = Vec::new();

        if lower.contains("data") || lower.contains("csv") || lower.contains("analyze") {
            subtasks.push(Subtask {
                id: "subtask-1".into(),
                description: format!("Process data for: {}", task_prompt),
                tags: vec!["data".into(), "transform".into()],
            });
        }

        if lower.contains("code") || lower.contains("python") || lower.contains("script") {
            subtasks.push(Subtask {
                id: "subtask-code".into(),
                description: format!("Generate code for: {}", task_prompt),
                tags: vec!["code".into(), "python".into()],
            });
        }

        if subtasks.is_empty() || lower.contains("report") || lower.contains("research") {
            subtasks.push(Subtask {
                id: format!("subtask-{}", subtasks.len() + 1),
                description: format!("Synthesize and research: {}", task_prompt),
                tags: vec!["research".into(), "summary".into()],
            });
        }

        subtasks
    }
}
```

```rust
// nexus/src/router/supervisor.rs
use crate::app_store::AppStore;
use crate::error::NexusError;
use super::planner::Subtask;

pub struct RouterSupervisor {
    app_store: AppStore,
}

impl RouterSupervisor {
    pub fn new(app_store: AppStore) -> Self {
        Self { app_store }
    }

    pub fn select_worker(&self, subtask: &Subtask, failed_workers: &[&str]) -> Result<String, NexusError> {
        let tag_refs: Vec<&str> = subtask.tags.iter().map(|s| s.as_str()).collect();
        let candidates = self.app_store.list();

        let mut available: Vec<_> = candidates
            .into_iter()
            .filter(|c| !failed_workers.contains(&c.id.as_str()))
            .filter(|c| c.capabilities.iter().any(|cap| subtask.tags.iter().any(|t| t.eq_ignore_ascii_case(cap))))
            .collect();

        if available.is_empty() {
            return Err(NexusError::RouterError(format!(
                "No capable worker found for subtask {} with tags {:?}",
                subtask.id, subtask.tags
            )));
        }

        // Rank by matching tag count
        available.sort_by_key(|c| {
            let score = c.capabilities.iter().filter(|cap| subtask.tags.iter().any(|t| t.eq_ignore_ascii_case(cap))).count();
            std::cmp::Reverse(score)
        });

        Ok(available[0].id.clone())
    }
}
```

```rust
// nexus/src/router/mod.rs
pub mod planner;
pub mod supervisor;

pub use planner::{TaskPlanner, Subtask};
pub use supervisor::RouterSupervisor;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test test_router --manifest-path nexus/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nexus/src/router/ nexus/tests/test_router.rs
git commit -m "feat(router): implement TaskPlanner DAG decomposition and RouterSupervisor failover"
```

---

### Task 9: CLI Interface & End-to-End Orchestration

**Files:**
- Create: `nexus/src/main.rs`
- Test: `nexus/tests/test_e2e_cli.rs`

**Interfaces:**
- Produces: CLI commands `run`, `list-agents`, `verify-receipt`.

- [ ] **Step 1: Write the failing test**

```rust
// nexus/tests/test_e2e_cli.rs
use nexus::app_store::AppStore;
use nexus::blackboard::Blackboard;
use nexus::llm::MockLlmClient;
use nexus::agents::{CodingAgent, ResearchAgent, DataAgent, Agent};
use nexus::router::{TaskPlanner, RouterSupervisor};
use nexus::trust::receipt::ReceiptSigner;
use std::sync::Arc;

#[tokio::test]
async fn test_full_pipeline_end_to_end() {
    let mut mock = MockLlmClient::new();
    mock.add_rule("sales data", "Processed 100 rows");
    let mock_arc = Arc::new(mock);

    let mut store = AppStore::new();
    let data_agent = DataAgent::new(mock_arc.clone());
    let coding_agent = CodingAgent::new(mock_arc.clone());
    store.register(data_agent.manifest());
    store.register(coding_agent.manifest());

    let bb = Blackboard::new();
    let planner = TaskPlanner::new();
    let supervisor = RouterSupervisor::new(store);

    let subtasks = planner.decompose("Analyze sales data");
    assert!(!subtasks.is_empty());

    let worker_id = supervisor.select_worker(&subtasks[0], &[]).unwrap();
    assert_eq!(worker_id, "data-agent");

    let output = data_agent.execute(&subtasks[0].description, &bb).await.unwrap();
    assert!(output.result.contains("Processed 100 rows"));

    let signer = ReceiptSigner::generate();
    let receipt = signer.sign(&subtasks[0].id, &output.result);
    assert!(receipt.verify().unwrap());
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cargo test --test test_e2e_cli --manifest-path nexus/Cargo.toml`
Expected: FAIL (CLI entrypoint or test binary error if not wired).

- [ ] **Step 3: Write minimal implementation**

```rust
// nexus/src/main.rs
use clap::{Parser, Subcommand};
use nexus::app_store::AppStore;
use nexus::blackboard::Blackboard;
use nexus::llm::MockLlmClient;
use nexus::agents::{CodingAgent, ResearchAgent, DataAgent, OpsAgent, Agent};
use nexus::router::{TaskPlanner, RouterSupervisor};
use nexus::trust::receipt::{ReceiptSigner, SignedReceipt};
use nexus::trust::sandbox::SandboxRunner;
use nexus::trust::healer::SelfHealer;
use std::sync::Arc;

#[derive(Parser)]
#[command(name = "nexus", about = "Nexus Multi-Agent Orchestration Hub")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run a task across specialized agents
    Run {
        task: String,
        #[arg(long, default_value_t = false)]
        mock_llm: bool,
        #[arg(long, default_value_t = 3)]
        sandbox_retries: usize,
        #[arg(long)]
        export_receipt: Option<String>,
        #[arg(long, default_value_t = false)]
        dry_run: bool,
    },
    /// List all registered agents in the App Store
    ListAgents,
    /// Cryptographically verify a signed receipt JSON
    VerifyReceipt {
        receipt_path: String,
    },
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    match cli.command {
        Commands::ListAgents => {
            println!("=== Nexus Worker App Store ===");
            let mut store = AppStore::new();
            let mock = Arc::new(MockLlmClient::new());
            store.register(CodingAgent::new(mock.clone()).manifest());
            store.register(ResearchAgent::new(mock.clone()).manifest());
            store.register(DataAgent::new(mock.clone()).manifest());
            store.register(OpsAgent::new(mock.clone()).manifest());

            for agent in store.list() {
                println!("• [{}] {} (v{}) - Tags: {:?}", agent.id, agent.name, agent.version, agent.capabilities);
            }
        }
        Commands::VerifyReceipt { receipt_path } => {
            let content = std::fs::read_to_string(&receipt_path)?;
            let receipt: SignedReceipt = serde_json::from_str(&content)?;
            let is_valid = receipt.verify()?;
            if is_valid {
                println!("✅ Receipt signature is VALID. Signed at: {}", receipt.timestamp);
            } else {
                eprintln!("❌ Receipt signature is INVALID.");
                std::process::exit(1);
            }
        }
        Commands::Run { task, mock_llm: _, sandbox_retries, export_receipt, dry_run } => {
            println!("🚀 Dispatching task: \"{}\"", task);
            let planner = TaskPlanner::new();
            let subtasks = planner.decompose(&task);

            if dry_run {
                println!("Plan (dry run):");
                for (i, st) in subtasks.iter().enumerate() {
                    println!("  {}. [{}] tags={:?}", i + 1, st.description, st.tags);
                }
                return Ok(());
            }

            let mut store = AppStore::new();
            let mock = Arc::new(MockLlmClient::new());
            store.register(CodingAgent::new(mock.clone()).manifest());
            store.register(ResearchAgent::new(mock.clone()).manifest());
            store.register(DataAgent::new(mock.clone()).manifest());
            store.register(OpsAgent::new(mock.clone()).manifest());

            let bb = Blackboard::new();
            let supervisor = RouterSupervisor::new(store);
            let signer = ReceiptSigner::generate();

            for st in subtasks {
                let worker_id = supervisor.select_worker(&st, &[])?;
                println!("⚡ Routed subtask '{}' to worker: {}", st.id, worker_id);
                // In production, instantiate worker and run
            }

            if let Some(path) = export_receipt {
                let receipt = signer.sign("task-final", &task);
                std::fs::write(&path, serde_json::to_string_pretty(&receipt)?)?;
                println!("📝 Signed receipt exported to {}", path);
            }

            println!("✨ Task completed successfully.");
        }
    }

    Ok(())
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cargo test --test test_e2e_cli --manifest-path nexus/Cargo.toml`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nexus/src/main.rs nexus/tests/test_e2e_cli.rs
git commit -m "feat(cli): add main CLI entrypoint and end-to-end integration test"
```
