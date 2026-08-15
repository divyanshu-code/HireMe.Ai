from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
import json
import logging
from app.core.config import settings
from app.utils.hunar_signature import verify_hunar_webhook_signature
from app.services.webhook_service import webhook_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/hunar")
async def hunar_webhook_receiver(request: Request):
    """
    Receive webhook events from Hunar Voice Agents.
    Verifies the HMAC SHA256 signature using the raw request body.
    """
    # 1. Get headers
    signature_header = request.headers.get("X-Hunar-Signature")
    timestamp_header = request.headers.get("X-Hunar-Timestamp")
    
    # 2. Get raw body for verification
    request_body = await request.body()
    
    # 3. Verify Signature
    is_valid = verify_hunar_webhook_signature(
        signature_header=signature_header,
        timestamp_header=timestamp_header,
        request_body=request_body,
        trusted_api_keys=[settings.HUNAR_API_KEY]
    )
    
    if not is_valid:
        logger.warning("Invalid Hunar webhook signature or timestamp.")
        raise HTTPException(status_code=401, detail="Invalid signature")
        
    # 4. Parse payload
    try:
        payload = json.loads(request_body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        logger.error("Failed to parse Hunar webhook JSON payload.")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # 5. Process idempotently
    try:
        await webhook_service.process_hunar_webhook(payload)
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    # Hunar expects a 200 OK
    return JSONResponse(content={"ok": True, "event_type": payload.get("event_type")}, status_code=200)
