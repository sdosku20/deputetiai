# Critical Discovery: Wrong API Endpoint!

## The Problem

We've been using the WRONG API endpoint! The working website uses a completely different API.

## Working Website API (Actual API)

**Endpoint**: `/api/v1/conversations/{id}/messages`  
**Method**: POST  
**Auth**: `Authorization: Bearer {JWT_TOKEN}`  
**Body**: `{"content": "question text"}`  

**Flow**:
1. POST `/api/v1/conversations` → Creates conversation, returns `{id: "..."}`
2. POST `/api/v1/conversations/{id}/messages` → Sends message, returns response

## What We Were Using (Wrong!)

**Endpoint**: `/v1/chat/completions`  
**Method**: POST  
**Auth**: `X-API-Key: sk-...`  
**Body**: OpenAI format `{"model": "...", "messages": [...]}`  

This endpoint doesn't work and returns 500 errors.

## Solution

We need to switch to the actual API that the working website uses:
1. Use JWT token from login (not API key)
2. Use `/api/v1/conversations` endpoints
3. Use simple `{"content": "..."}` format

