import logging
from typing import Dict, Any
from pymongo.errors import DuplicateKeyError
from app.database.mongodb import db
from datetime import datetime, timezone
from bson import ObjectId

logger = logging.getLogger(__name__)

class WebhookService:
    
    @staticmethod
    async def process_hunar_webhook(payload: Dict[str, Any]) -> bool:
        """
        Process a Hunar webhook securely and idempotently.
        Returns True if processed successfully, False if skipped (duplicate).
        """
        event_type = payload.get("event_type")
        call_id = payload.get("call_id")
        status = payload.get("status") or payload.get("lifecycle_status", "none")
        
        if not event_type or not call_id:
            logger.warning(f"Invalid webhook payload, missing event_type or call_id: {payload}")
            return False

        # Idempotency key logic based on the event and state.
        # e.g., hunar_call_summary_call-123_COMPLETED
        idempotency_key = f"hunar_{event_type}_{call_id}_{status}"

        # 1. Idempotency Check & Logging
        try:
            webhook_record = {
                "source": "hunar",
                "event_type": event_type,
                "idempotency_key": idempotency_key,
                "payload": payload,
                "processed": True,
                "created_at": datetime.now(timezone.utc)
            }
            await db.client.get_database("hireme_ai").webhooks.insert_one(webhook_record)
        except DuplicateKeyError:
            logger.info(f"Duplicate webhook skipped: {idempotency_key}")
            return False

        # 2. Database Update Logic
        calls_collection = db.client.get_database("hireme_ai").calls

        update_data = {}
        
        if event_type == "call_summary":
            update_data["call_status"] = payload.get("lifecycle_status") or payload.get("status")
            update_data["duration"] = payload.get("duration_seconds")
            update_data["recording_url"] = payload.get("recording_url")
            update_data["structured_result"] = payload.get("result")
            
        elif event_type == "call_status_updated":
            update_data["call_status"] = payload.get("lifecycle_status") or payload.get("status")
            update_data["duration"] = payload.get("duration_seconds")
            
        elif event_type == "call_recording_done":
            update_data["recording_url"] = payload.get("recording_url")
            
        elif event_type == "call_result_done":
            update_data["structured_result"] = payload.get("result")
            
        else:
            logger.info(f"Unhandled Hunar webhook event type: {event_type}")

        if update_data:
            # Update the Call document where hunar_call_id matches the incoming call_id
            update_data["updated_at"] = datetime.now(timezone.utc)
            
            # Remove None values to avoid overwriting existing data with None
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            if update_data:
                await calls_collection.update_one(
                    {"hunar_call_id": call_id},
                    {"$set": update_data}
                )
                logger.info(f"Updated Call {call_id} successfully via {event_type} webhook.")

        return True

webhook_service = WebhookService()
