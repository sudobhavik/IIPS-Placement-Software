from sqlalchemy import select                                                                                                                                       
from sqlalchemy.orm import Session                                                                                                                                  
                                                                                                                                                                        
def get_all(db: Session, model, **filters):                                                                                                                         
    q = select(model)                                                                                                                                               
    for k, v in filters.items():                                                                                                                                    
        if v is not None:                                                                                                                                           
            q = q.where(getattr(model, k) == v)                                                                                                                     
    return list(db.scalars(q).all())                                                                                                                                
                                                                                                                                                                        
def create(db: Session, model, data: dict):                                                                                                                         
    item = model(**data)                                                                                                                                            
    db.add(item)                                                                                                                                                    
    db.commit()                                                                                                                                                     
    db.refresh(item)                                                                                                                                                
    return item                                                                                                                                                     
                                                                                                                                                                        
def update(db: Session, model, item_id: int, data: dict):                                                                                                           
    item = db.get(model, item_id)                                                                                                                                   
    if item:                                                                                                                                                        
        for k, v in data.items():                                                                                                                                   
            setattr(item, k, v)                                                                                                                                     
        db.commit()                                                                                                                                                 
        db.refresh(item)                                                                                                                                            
    return item