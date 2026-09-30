
# 🏺 KhojSetu

> **Offline-first semantic memory & intelligence platform for archaeological field research.**  
> Powered by Qdrant Edge, local vector search, and edge-to-cloud synchronization.

---

## 📌 Problem Statement & Context

Archaeological teams operating in remote excavation zones face severe connectivity blackouts, high latency, and critical data preservation challenges. Traditional cloud-dependent AI tools fail when disconnected from the grid.

**KhojSetu** bridges this gap as an edge-native AI memory system. It allows field researchers to record observations, run hybrid semantic searches across historical artifact data locally, resolve catalog conflicts, and seamlessly synchronize curated findings to a centralized Qdrant Cloud cluster whenever a network link becomes available.

---

## 🎯 Key Features

- **100% Offline-First Semantic Search**: Uses on-device embeddings and Qdrant Edge to query excavation logs, stratum levels, and artifact catalogs without internet connectivity.
- **Hybrid Retrieval**: Combines dense semantic vector search with sparse lexical filters (e.g., trench ID, date range, material type).
- **Intelligent Edge-to-Cloud Sync**: Selectively pushes validated artifacts to centralized Qdrant Server while keeping sensitive, high-frequency, or preliminary draft logs strictly local.
- **Conflict & Evolution Management**: Handles concurrent field updates and evolving artifact classifications using versioned vector records.
- **Inspector Dashboard**: A clean web UI to inspect local vector memory, query top-k artifact matches, monitor battery/sync status, and review edge queues.

---

## 🏗️ Architecture & Workflow

```text
  [Field Excavation Site - Offline]
        │
        ├──> Field Researcher UI / Inspector
        │         │
        │         ▼
        ├──> Local Embedding Engine (On-device MiniLM / ONNX)
        │         │
        │         ▼
        └──> Qdrant Edge (Embedded Vector Store & Local Memory)
                  │
                  ▼ (Intermittent Network Reconnected)
       [Smart Sync & Conflict Engine]
                  │
                  ▼
  [Central Research Server - Cloud]
        └──> Qdrant Cloud / Server (Aggregated Global Knowledge Base)

```



## 🗂️ Tech Stack

* **Vector Database**: Qdrant Edge (Local on-device) & Qdrant Server/Cloud (Centralized)
* **Embeddings**: FastEmbed / ONNX Runtime (`all-MiniLM-L6-v2` or multilingual variants)
* **Backend / Core Engine**: Python (FastAPI) or Rust
* **Frontend / UI**: Modern responsive dashboard (React / Vite or Streamlit)

---

## 🚀 Getting Started

### Prerequisites

* Python 3.10+ (or Docker)
* Local Git setup

### Installation

1. **Clone the repository:**
```bash
git clone [https://github.com/kg2655/KhojSetu.git](https://github.com/kg2655/KhojSetu.git)
cd KhojSetu

```


2. **Set up the virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

```


3. **Configure environment variables:**
```bash
cp .env.example .env
# Set your Qdrant Edge local storage path and remote Qdrant Cloud credentials

```


4. **Launch the application:**
```bash
python main.py

```



---

## 🧪 Edge-to-Cloud Sync Simulation

1. **Simulate Offline Operation**: Disconnect network or set `NETWORK_MODE=offline` in `.env`.
2. **Ingest Field Data**: Add artifact discovery entries via the UI or API endpoint.
3. **Run Local Search**: Query the embedded memory with natural language prompts (e.g., *"terracotta pottery fragments with floral motifs"*).
4. **Reconnect & Trigger Sync**: Toggle `NETWORK_MODE=online` to initiate bidirectional sync and conflict resolution with the central Qdrant cluster.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

