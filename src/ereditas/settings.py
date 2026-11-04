"""Environment settings. Never log secret values."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    meta_api_key: str = ""
    model_api_key: str = ""
    model_api_base_url: str = "https://api.meta.ai/v1"
    muse_model: str = "muse-spark-1.3"
    muse_voice_model: str = "muse-voice-transcribe-1.0"
    sam_model: str = "sam-3.1"
    muse_image_model: str = "muse-image-1.0"
    hf_token: str = ""
    modal_token_id: str = ""
    modal_token_secret: str = ""
    ereditas_demo_mode: str = "1"

    @property
    def api_key(self) -> str:
        return (self.meta_api_key or self.model_api_key).strip()

    @property
    def meta_configured(self) -> bool:
        return bool(self.api_key)

    @property
    def modal_configured(self) -> bool:
        return bool(self.modal_token_id and self.modal_token_secret)

    @property
    def hf_configured(self) -> bool:
        return bool(self.hf_token)
