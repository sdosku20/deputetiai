# Backend Error Report - Deputeti AI Frontend

## Error Summary

**Status Code:** 500 (Internal Server Error)  
**Endpoint:** `POST /v1/chat/completions`  
**Error Type:** Python Runtime Error  

## Error Details

```
RAG pipeline error: 'str' object has no attribute 'get'
```

## What We're Sending

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

## Working vs Not Working

✅ **curl command works:**
```bash
curl -X POST "https://asistenti.deputeti.ai/v1/chat/completions" \
  -H "X-API-Key: sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4" \
  -H "Content-Type: application/json" \
  -d '{"model": "eu-law-rag", "messages": [{"role": "user", "content": "What is Article 50 TEU?"}]}'
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

## Request Comparison

Both requests send identical JSON. The only differences could be:
- HTTP headers (browser may add additional headers)
- Request encoding
- How FastAPI parses the request body

## Next Steps for Backend Team

1. Check FastAPI endpoint for `/v1/chat/completions` - verify request body parsing
2. Add logging to see what the backend actually receives
3. Check if there's middleware transforming the request
4. Verify the RAG pipeline input validation/handling

---
**Generated:** $(date)  
**Frontend Version:** Latest  
**API Endpoint:** `https://asistenti.deputeti.ai/v1/chat/completions`

