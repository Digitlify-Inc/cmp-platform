"""Artifact storage client for MinIO/S3."""

import hashlib
import json
import logging
from dataclasses import dataclass
from typing import Any, Optional

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class FlowArtifact:
    """Flow artifact with metadata."""

    flow_id: str
    version: str
    flow_data: dict[str, Any]
    checksum: str


class ArtifactStorage:
    """S3/MinIO storage client for flow artifacts.

    Artifacts are stored as:
    s3://{bucket}/flows/{offering_uuid}/{version}/flow.json
    """

    def __init__(self):
        self.endpoint = settings.s3_endpoint
        self.bucket = settings.s3_bucket
        self._client: Optional[Any] = None

    def _get_client(self):
        """Get or create S3 client."""
        if self._client is None:
            self._client = boto3.client(
                "s3",
                endpoint_url=self.endpoint,
                aws_access_key_id=settings.s3_access_key,
                aws_secret_access_key=settings.s3_secret_key,
                config=BotoConfig(signature_version="s3v4"),
            )
        return self._client

    def _compute_checksum(self, data: bytes) -> str:
        """Compute SHA256 checksum of data."""
        return hashlib.sha256(data).hexdigest()

    async def fetch_flow(
        self,
        offering_uuid: str,
        version: str,
        expected_checksum: Optional[str] = None,
    ) -> FlowArtifact:
        """
        Fetch flow artifact from storage.

        Args:
            offering_uuid: The offering UUID
            version: The version string (e.g., "1.0.0")
            expected_checksum: Optional checksum to validate

        Returns:
            FlowArtifact with flow data

        Raises:
            ValueError: If checksum validation fails
            ClientError: If artifact not found
        """
        key = f"flows/{offering_uuid}/{version}/flow.json"
        logger.info(f"Fetching artifact: {key}")

        client = self._get_client()
        try:
            response = client.get_object(Bucket=self.bucket, Key=key)
            data = response["Body"].read()
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                logger.error(f"Artifact not found: {key}")
                raise ValueError(f"Flow artifact not found: {offering_uuid}/{version}")
            raise

        # Validate checksum if provided
        checksum = self._compute_checksum(data)
        if expected_checksum and checksum != expected_checksum:
            logger.error(
                f"Checksum mismatch for {key}: "
                f"expected={expected_checksum}, got={checksum}"
            )
            raise ValueError("Flow artifact checksum validation failed")

        flow_data = json.loads(data)
        logger.info(f"Fetched artifact {key}, checksum={checksum[:12]}...")

        return FlowArtifact(
            flow_id=flow_data.get("id", offering_uuid),
            version=version,
            flow_data=flow_data,
            checksum=checksum,
        )

    async def upload_flow(
        self,
        offering_uuid: str,
        version: str,
        flow_data: dict[str, Any],
    ) -> str:
        """
        Upload flow artifact to storage.

        Returns:
            The checksum of uploaded artifact
        """
        key = f"flows/{offering_uuid}/{version}/flow.json"
        data = json.dumps(flow_data, indent=2).encode("utf-8")
        checksum = self._compute_checksum(data)

        client = self._get_client()
        client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType="application/json",
            Metadata={"checksum": checksum},
        )

        logger.info(f"Uploaded artifact {key}, checksum={checksum[:12]}...")
        return checksum


# Singleton storage client
artifact_storage = ArtifactStorage()
