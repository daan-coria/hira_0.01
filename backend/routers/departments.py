from flask import Blueprint, request
from database import get_db
from models import Department

departments_bp = Blueprint("departments", __name__)


@departments_bp.get("/")
def get_all():
    db = next(get_db())
    items = db.query(Department).all()
    return {"items": [vars(i) for i in items]}


@departments_bp.get("/<int:id>")
def get_one(id):
    db = next(get_db())
    item = db.query(Department).filter(Department.id == id).first()
    return {"item": vars(item) if item else None}


@departments_bp.post("/")
def create():
    db = next(get_db())
    data = request.json or {}

    item = Department(name=data["name"])
    db.add(item)
    db.commit()
    db.refresh(item)

    return {"message": "Created", "id": item.id}


@departments_bp.put("/<int:id>")
def update(id):
    db = next(get_db())
    data = request.json or {}

    item = db.query(Department).filter(Department.id == id).first()
    if not item:
        return {"error": "Not found"}, 404

    item.name = data.get("name", item.name)

    db.commit()
    return {"message": "Updated"}


@departments_bp.delete("/<int:id>")
def delete(id):
    db = next(get_db())
    item = db.query(Department).filter(Department.id == id).first()
    if not item:
        return {"error": "Not found"}, 404

    db.delete(item)
    db.commit()
    return {"message": "Deleted"}
