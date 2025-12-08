from flask import Blueprint, request
from database import get_db
from models import Employee

employees_bp = Blueprint("employees", __name__)


@employees_bp.get("/")
def get_all():
    db = next(get_db())
    items = db.query(Employee).all()
    return {"items": [vars(i) for i in items]}


@employees_bp.get("/<int:id>")
def get_one(id):
    db = next(get_db())
    item = db.query(Employee).filter(Employee.id == id).first()
    return {"item": vars(item) if item else None}


@employees_bp.post("/")
def create():
    db = next(get_db())
    data = request.json or {}

    item = Employee(
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        campus=data.get("campus")
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return {"message": "Created", "id": item.id}


@employees_bp.put("/<int:id>")
def update(id):
    db = next(get_db())
    data = request.json or {}

    item = db.query(Employee).filter(Employee.id == id).first()
    if not item:
        return {"error": "Not found"}, 404

    item.first_name = data.get("first_name", item.first_name)
    item.last_name = data.get("last_name", item.last_name)
    item.campus = data.get("campus", item.campus)

    db.commit()
    return {"message": "Updated"}


@employees_bp.delete("/<int:id>")
def delete(id):
    db = next(get_db())
    item = db.query(Employee).filter(Employee.id == id).first()
    if not item:
        return {"error": "Not found"}, 404

    db.delete(item)
    db.commit()
    return {"message": "Deleted"}
