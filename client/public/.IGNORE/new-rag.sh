#!/bin/bash

# RAG API test script for Knowde hybrid search
# This script demonstrates how to query the product catalog using environment variables

curl -X POST "https://hybrid-search.dev.knowde.dev/api/conversation" \
-H "Content-Type: application/json" \
-H "x-knowde-auth: ${KNOWDE_AUTH_TOKEN}" \
-d "{
  \"message\": \"What are the labeling claims for SIPERNAT 45 S?\",
  \"email\": \"jeff@knowde.ai\",
  \"dialog_count\": 0,
  \"conversation_id\": \"1\",
  \"user_id\": \"1\",
  \"app_id\": \"1\",
  \"workflow_id\": \"1\",
  \"workflow_run_id\": \"1\",
  \"role\": \"user\",
  \"company_uuid\": \"${KNOWDE_COMPANY_UUID}\"
}"