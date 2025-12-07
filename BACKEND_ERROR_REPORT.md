# Backend Error Report - Deputeti AI Frontend

## Error Summary

**Status Code:** 500 (Internal Server Error)  
**Endpoint:** `POST /v1/chat/completions`  
**Error Type:** Python Runtime Error  

## Error Details

```
RAG pipeline error: 'str' object has no attribute 'get'
```

## What I am sending

The frontend sends requests in this exact format (matches working curl command):

```json
{
  "model": "eu-law-rag",
  "messages": [
    {
      "role": "user",
      "content": "What is the relationship between EU regulations and national implementing measures for directives in digital services?"
    }
  ]
}
```

**Headers:**
- `X-API-Key: sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4`
- `Content-Type: application/json`

## Not Working

❌ **curl command does not work:**
```bash
curl.exe -X POST "https://asistenti.deputeti.ai/v1/chat/completions" `
>>   -H "X-API-Key: sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4" `
>>   -H "Content-Type: application/json" `
>>   -d '{\"model\": \"eu-law-rag\", \"messages\": [{\"role\": \"user\", \"content\": \"What is Article 50 TEU?\"}]}'
{"detail":"RAG pipeline error: 'str' object has no attribute 'get'"}
```

❌ **Frontend request (identical format) returns:**
```
500 Internal Server Error
{"detail": "RAG pipeline error: 'str' object has no attribute 'get'"}
```

## Technical Analysis

The error `'str' object has no attribute 'get'` suggests the backend Python code is trying to call `.get()` on a string when it expects a dictionary/object. This typically happens when:

1. The backend receives the request body as a string instead of parsed JSON
2. A field in the request is being treated as a string when it should be a dict
3. There's a difference in how FastAPI/Python parses the request from browser vs curl

---
**Generated:** $(date)  
**Frontend Version:** Latest  
**API Endpoint:** `https://asistenti.deputeti.ai/v1/chat/completions`

