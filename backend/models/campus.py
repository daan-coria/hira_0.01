from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Campus(Base):
    __tablename__ = "Campus"

    Campus_Key = Column(Integer, primary_key=True, autoincrement=True)
    Campus_ID = Column(Integer, nullable=False)
    Campus_Name = Column(String(255), nullable=False)
    Campus_Short_Name = Column(String(50))
    Weekly_Hours_Per_FTE = Column(Numeric(4,2))
    Region_ID = Column(Integer, ForeignKey("Region.Region_ID"), nullable=False)

    region = relationship("Region", back_populates="campuses")
