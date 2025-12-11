# System Design — Booking System

**Purpose:** short, scannable design document describing architecture, database schema, concurrency control, scaling, and operational considerations for the Booking System project.

---

## Table of contents

1. [High-level architecture](#high-level-architecture)  
2. [Core components](#core-components)  
3. [Database schema (ER)](#database-schema-er)  
4. [Booking flow (sequence)](#booking-flow-sequence)  
5. [Lazy-expiry & Cancellation flows (sequence)](#lazy-expiry--cancellation-flows-sequence)  
6. [Concurrency control & correctness](#concurrency-control--correctness)  
7. [Scaling & production considerations](#scaling--production-considerations)  
8. [Monitoring, observability & alerts](#monitoring-observability--alerts)  
9. [Tradeoffs & alternatives](#tradeoffs--alternatives)  
10. [Appendix: Useful SQL snippets](#appendix-useful-sql-snippets)

---

## High-level architecture

Clients (web/mobile) → **API Layer** (Express/Node) → **Service layer** (business logic) → **Postgres primary** (writes) & optional read replicas → **Background worker** (expiry / async jobs) → **Cache (Redis)** and **Message queue (optional)**.

Optional infra: load balancer, autoscaling group, container orchestration (Kubernetes / ECS), managed Postgres (RDS/Aurora/Cloud SQL).

