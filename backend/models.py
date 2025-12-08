from sqlalchemy import Column, Integer, String
from database import Base


class Campus(Base):
    __tablename__ = "campuses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    region = Column(String(255), nullable=True)


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)


class ShiftTemplate(Base):
    __tablename__ = "shift_templates"

    id = Column(Integer, primary_key=True, index=True)
    shift_name = Column(String(255), nullable=False)


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(255))
    last_name = Column(String(255))
    campus = Column(String(255))


class ResourceType(Base):
    __tablename__ = "resource_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
