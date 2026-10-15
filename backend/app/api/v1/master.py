from fastapi import APIRouter, Depends, HTTPException, status                                                                                                       
from sqlalchemy.exc import IntegrityError                                                                                                                           
from sqlalchemy.orm import Session                                                                                                                                  
from app.core.db import get_db                                                                                                                                      
from app.api.v1.auth import get_current_admin_user, get_current_user                                                                                                
from app.models.master import Batch, Course, Specialization                                                                                                         
from app.schemas.master import (                                                                                                                                    
    BatchCreate, BatchRead, BatchUpdate,                                                                                                                            
    CourseCreate, CourseRead, CourseUpdate,                                                                                                                         
    SpecCreate, SpecRead, SpecUpdate,                                                                                                                               
)                                                                                                                                                                   
from app.services import master_service                                                                                                                             
                                                                                                                                                                        
router = APIRouter(prefix="/master", tags=["master"])                                                                                                               
Auth, Admin, Db = Depends(get_current_user), Depends(get_current_admin_user), Depends(get_db)                                                                       
                                                                                                                                                                        
def _safe_commit(action, err_msg="Record with this unique identifier already exists"):                                                                              
    try: return action()                                                                                                                                            
    except IntegrityError: raise HTTPException(status.HTTP_409_CONFLICT, err_msg)                                                                                   
                                                                                                                                                                        
# Courses                                                                                                                                                           
@router.get("/courses", response_model=list[CourseRead], dependencies=[Auth])                                                                                       
def list_courses(is_active: bool | None = None, db: Session = Db):                                                                                                  
    return master_service.get_all(db, Course, is_active=is_active)                                                                                                  
                                                                                                                                                                        
@router.post("/courses", response_model=CourseRead, status_code=status.HTTP_201_CREATED, dependencies=[Admin])                                                      
def create_course(d: CourseCreate, db: Session = Db):                                                                                                               
    return _safe_commit(lambda: master_service.create(db, Course, d.model_dump()))                                                                                  
                                                                                                                                                                        
@router.patch("/courses/{id}", response_model=CourseRead, dependencies=[Admin])                                                                                     
def update_course(id: int, d: CourseUpdate, db: Session = Db):                                                                                                      
    res = _safe_commit(lambda: master_service.update(db, Course, id, d.model_dump(exclude_unset=True)))                                                             
    if not res: raise HTTPException(404, "Course not found")                                                                                                        
    return res                                                                                                                                                      
                                                                                                                                                                        
# Specializations                                                                                                                                                   
@router.get("/specializations", response_model=list[SpecRead], dependencies=[Auth])                                                                                 
def list_specs(course_id: int | None = None, is_active: bool | None = None, db: Session = Db):                                                                      
    return master_service.get_all(db, Specialization, course_id=course_id, is_active=is_active)                                                                     
                                                                                                                                                                        
@router.post("/specializations", response_model=SpecRead, status_code=status.HTTP_201_CREATED, dependencies=[Admin])                                                
def create_spec(d: SpecCreate, db: Session = Db):                                                                                                                   
    return _safe_commit(lambda: master_service.create(db, Specialization, d.model_dump()))                                                                          
                                                                                                                                                                        
@router.patch("/specializations/{id}", response_model=SpecRead, dependencies=[Admin])                                                                               
def update_spec(id: int, d: SpecUpdate, db: Session = Db):                                                                                                          
    res = _safe_commit(lambda: master_service.update(db, Specialization, id, d.model_dump(exclude_unset=True)))                                                     
    if not res: raise HTTPException(404, "Specialization not found")                                                                                                
    return res                                                                                                                                                      
                                                                                                                                                                        
# Batches                                                                                                                                                           
@router.get("/batches", response_model=list[BatchRead], dependencies=[Auth])                                                                                        
def list_batches(is_active: bool | None = None, db: Session = Db):                                                                                                  
    return master_service.get_all(db, Batch, is_active=is_active)                                                                                                   
                                                                                                                                                                        
@router.post("/batches", response_model=BatchRead, status_code=status.HTTP_201_CREATED, dependencies=[Admin])                                                       
def create_batch(d: BatchCreate, db: Session = Db):                                                                                                                 
    return _safe_commit(lambda: master_service.create(db, Batch, d.model_dump()))                                                                                   
                                                                                                                                                                        
@router.patch("/batches/{id}", response_model=BatchRead, dependencies=[Admin])                                                                                      
def update_batch(id: int, d: BatchUpdate, db: Session = Db):                                                                                                        
    res = _safe_commit(lambda: master_service.update(db, Batch, id, d.model_dump(exclude_unset=True)))                                                              
    if not res: raise HTTPException(404, "Batch not found")                                                                                                         
    return res