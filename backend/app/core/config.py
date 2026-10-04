from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str

    # JWT
    secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    activation_token_expire_hours: int = 72
    reset_token_expire_minutes: int = 30

    # Cookies
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    # Email
    email_backend: str = "console"  # console or smtp
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    smtp_use_tls: bool = True
    activation_base_url: str = "http://localhost:5173"

    # Invites
    invite_batch_size: int = 50
    invite_batch_delay_seconds: int = 2

    # Frontend
    frontend_origin: str = "http://localhost:5173"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate secret_key length
        if len(self.secret_key) < 32:
            raise ValueError("secret_key must be at least 32 characters long")
        # Refuse to start if secret_key is a known placeholder when cookie_secure is true
        if self.cookie_secure and self.secret_key in (
            "change_me",
            "change_me_to_a_long_random_string",
            "secret",
        ):
            raise ValueError("secret_key cannot be a placeholder when cookie_secure is true")


settings = Settings()
