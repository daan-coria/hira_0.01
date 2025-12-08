from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class Region(Base):
    __tablename__ = "Region"

    Region_ID = Column(Integer, primary_key=True, autoincrement=True)
    Region_Name = Column(String(50), nullable=False)

    campuses = relationship("Campus", back_populates="region")
