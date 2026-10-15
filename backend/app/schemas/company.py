from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ContactBase(BaseModel):
    name: str
    email: str
    designation: str | None = None
    phone: str | None = None
    is_primary: bool = False

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    designation: str | None = None
    phone: str | None = None
    is_primary: bool | None = None

class ContactRead(ContactBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company_id: int
    created_at: datetime

class CompanyBase(BaseModel):
    name: str
    website: str | None = None
    industry: str | None = None
    description: str | None = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: str | None = None
    website: str | None = None
    industry: str | None = None
    description: str | None = None
    is_active: bool | None = None

class CompanyRead(CompanyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool
    created_at: datetime

class CompanyDetail(CompanyRead):
    contacts: list[ContactRead] = []

class CompanyListResponse(BaseModel):
    items: list[CompanyRead]
    total: int
    page: int
    page_size: int
