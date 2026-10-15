from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.api.v1.auth import get_current_admin_user
from app.schemas.company import (
    CompanyCreate, CompanyDetail, CompanyListResponse, CompanyRead, CompanyUpdate,
    ContactCreate, ContactRead, ContactUpdate
)
from app.services import company_service

router = APIRouter(prefix="/companies", tags=["companies"])
Admin = Depends(get_current_admin_user)
Db = Depends(get_db)

@router.get("", response_model=CompanyListResponse, dependencies=[Admin])
def list_companies(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), search: str | None = None, is_active: bool | None = None, db: Session = Db):
    items, total = company_service.list_companies(db, page, page_size, search, is_active)
    return {"items": items, "total": total, "page": page, "page_size": page_size}

@router.post("", response_model=CompanyRead, status_code=status.HTTP_201_CREATED, dependencies=[Admin])
def add_company(data: CompanyCreate, db: Session = Db):
    try: return company_service.create_company(db, data.model_dump())
    except IntegrityError: raise HTTPException(409, "Company with this name already exists")

@router.get("/{id}", response_model=CompanyDetail, dependencies=[Admin])
def get_company(id: int, db: Session = Db):
    if not (c := company_service.get_company(db, id)): raise HTTPException(404, "Company not found")
    return c

@router.patch("/{id}", response_model=CompanyRead, dependencies=[Admin])
def edit_company(id: int, data: CompanyUpdate, db: Session = Db):
    if not (c := company_service.get_company(db, id)): raise HTTPException(404, "Company not found")
    try: return company_service.update_company(db, c, data.model_dump(exclude_unset=True))
    except IntegrityError: raise HTTPException(409, "Company with this name already exists")

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Admin])
def remove_company(id: int, db: Session = Db):
    if not (c := company_service.get_company(db, id)): raise HTTPException(404, "Company not found")
    company_service.soft_delete_company(db, c)

@router.post("/{id}/contacts", response_model=ContactRead, status_code=status.HTTP_201_CREATED, dependencies=[Admin])
def add_contact(id: int, data: ContactCreate, db: Session = Db):
    if not company_service.get_company(db, id): raise HTTPException(404, "Company not found")
    return company_service.create_contact(db, id, data.model_dump())

@router.patch("/{id}/contacts/{contact_id}", response_model=ContactRead, dependencies=[Admin])
def edit_contact(id: int, contact_id: int, data: ContactUpdate, db: Session = Db):
    if not (ct := company_service.get_contact(db, id, contact_id)): raise HTTPException(404, "Contact not found")
    return company_service.update_contact(db, ct, data.model_dump(exclude_unset=True))

@router.delete("/{id}/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Admin])
def remove_contact(id: int, contact_id: int, db: Session = Db):
    if not (ct := company_service.get_contact(db, id, contact_id)): raise HTTPException(404, "Contact not found")
    company_service.delete_contact(db, ct)
