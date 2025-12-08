from flask import Blueprint, request
from database import get_db
from models import ShiftTemplate

shift_templates_bp = Blueprint("shift_templates", __name__)


@shift_templates_bp.get("/")
def get_all():
    db = next(get_db())
    items = db.query(ShiftTemplate).all()
    return {"items": [vars(i) for i in items]}


@shift_templates_bp.get("/<int:id>")
def get_one(id):
    db = next(get_db())
    item = db.query(ShiftTemplate).filter(ShiftTemplate.id == id).first()
    return {"item": vars(item) if item else None}


@shift_templates_bp.post("/")
def create():
    db = next(get_db())
    data = request.json or {}

    item = ShiftTemplate(shift_name=data["shift_name"])
    db.add(item)
    db.commit()
    db.refresh(item)

    return {"message": "Created", "id": item.id}


@shift_templates_bp.put("/<int:id>")
def update(id):
    db = next(get_db())
    data = request.json or {}

    item = db.query(ShiftTemplate).filter(ShiftTemplate.id == id).first()
    if not item:
        return {"error": "Not found"}, 404

    item.shift_name = data.get("shift_name", item.shift_name)

    db.commit()
    return {"message": "Updated"}


@shift_templates_bp.delete("/<int:id>")
def delete(id):
    db = next(get_db())
    item = db.query(ShiftTemplate).filter(ShiftTemplate.id == id).first()
    if not item:
        return {"error": "Not found"}, 404

    db.delete(item)
    db.commit()
    return {"message": "Deleted"}
