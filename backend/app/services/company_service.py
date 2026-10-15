from datetime import UTC, datetime
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from app.models.company import Company, CompanyContact

def list_companies(db: Session, page: int = 1, page_size: int = 20, search: str | None = None, is_active: bool | None = None):
    q = select(Company).where(Company.deleted_at.is_(None))
    if is_active is not None:
        q = q.where(Company.is_active == is_active)
    if search:
        t = f"%{search}%"
        q = q.where(or_(Company.name.ilike(t), Company.industry.ilike(t)))
    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    items = list(db.scalars(q.order_by(Company.name).offset((page - 1) * page_size).limit(page_size)).all())
    return items, total

def get_company(db: Session, company_id: int) -> Company | None:
    return db.scalars(select(Company).where(Company.id == company_id, Company.deleted_at.is_(None))).first()

def create_company(db: Session, data: dict) -> Company:
    c = Company(**data); db.add(c); db.commit(); db.refresh(c); return c

def update_company(db: Session, company: Company, data: dict) -> Company:
    for k, v in data.items(): setattr(company, k, v)
    db.commit(); db.refresh(company); return company

def soft_delete_company(db: Session, company: Company) -> None:
    company.deleted_at = datetime.now(UTC)
    company.is_active = False
    db.commit()

def create_contact(db: Session, company_id: int, data: dict) -> CompanyContact:
    contact = CompanyContact(company_id=company_id, **data)
    db.add(contact); db.commit(); db.refresh(contact); return contact

def get_contact(db: Session, company_id: int, contact_id: int) -> CompanyContact | None:
    return db.scalars(select(CompanyContact).where(CompanyContact.id == contact_id, CompanyContact.company_id == company_id)).first()

def update_contact(db: Session, contact: CompanyContact, data: dict) -> CompanyContact:
    for k, v in data.items(): setattr(contact, k, v)
    db.commit(); db.refresh(contact); return contact

def delete_contact(db: Session, contact: CompanyContact) -> None:
    db.delete(contact); db.commit()
