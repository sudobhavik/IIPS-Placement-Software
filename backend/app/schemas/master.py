from pydantic import BaseModel, ConfigDict                                                                                                                          
from app.models.enums import CourseLevel                                                                                                                            
                                                                                                                                                                        
class CourseCreate(BaseModel):                                                                                                                                      
    code: str                                                                                                                                                       
    name: str                                                                                                                                                       
    level: CourseLevel                                                                                                                                              
    duration_years: int | None = None                                                                                                                               
                                                                                                                                                                        
class CourseUpdate(BaseModel):                                                                                                                                      
    code: str | None = None                                                                                                                                         
    name: str | None = None                                                                                                                                         
    level: CourseLevel | None = None                                                                                                                                
    duration_years: int | None = None                                                                                                                               
    is_active: bool | None = None                                                                                                                                   
                                                                                                                                                                        
class CourseRead(CourseCreate):                                                                                                                                     
    model_config = ConfigDict(from_attributes=True)                                                                                                                 
    id: int                                                                                                                                                         
    is_active: bool                                                                                                                                                 
                                                                                                                                                                        
class SpecCreate(BaseModel):                                                                                                                                        
    course_id: int                                                                                                                                                  
    name: str                                                                                                                                                       
                                                                                                                                                                        
class SpecUpdate(BaseModel):                                                                                                                                        
    course_id: int | None = None                                                                                                                                    
    name: str | None = None                                                                                                                                         
    is_active: bool | None = None                                                                                                                                   
                                                                                                                                                                        
class SpecRead(SpecCreate):                                                                                                                                         
    model_config = ConfigDict(from_attributes=True)                                                                                                                 
    id: int                                                                                                                                                         
    is_active: bool                                                                                                                                                 
                                                                                                                                                                        
class BatchCreate(BaseModel):                                                                                                                                       
    label: str                                                                                                                                                      
    passing_year: int                                                                                                                                               
                                                                                                                                                                        
class BatchUpdate(BaseModel):                                                                                                                                       
    label: str | None = None                                                                                                                                        
    passing_year: int | None = None                                                                                                                                 
    is_active: bool | None = None                                                                                                                                   
                                                                                                                                                                        
class BatchRead(BatchCreate):                                                                                                                                       
    model_config = ConfigDict(from_attributes=True)                                                                                                                 
    id: int                                                                                                                                                         
    is_active: bool