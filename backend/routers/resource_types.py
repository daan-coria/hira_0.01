from flask import Blueprint, request
from database import get_db
from models import ResourceType

resource_types_bp = Blueprint("resource_types", __name__)


@resource_types_bp.get("/")
def get_all():
    db = next(get_db())
    items = db.query(ResourceType).all()
    return {"items": [vars(i) for i in items]}


@resource_types_bp.get("/<int:id>")
def get_one(id):
    db = next(get_db())
    item = db.query(ResourceType).filter(ResourceType.id == id).first()
    return {"item": vars(item) if item else None}


@resource_types_bp.post("/")
def create():
    db = next(get_db())
    data = request.json or {}

    item = ResourceType(name=data["name"])
    db.add(item)
    db.commit()
    db.refresh(item)

    return {"message": "Created", "id": item.id}


@resource_types_bp.put("/<int:id>")
def update(id):
    db = next(get_db())
    data = request.json or {}

    item = db.query(ResourceType).filter(ResourceType.id == id).first()
    if not item:
        return {"error": "Not found"}, 404

    item.name = data.get("name", item.name)

    db.commit()
    return {"message": "Updated"}


@resource_types_bp.delete("/<int:id>")
def delete(id):
    db = next(get_db())
    item = db.query(ResourceType).filter(ResourceType.id == id).first()
    if not item:
        return {"error": "Not found"}, 404

    db.delete(item)
    db.commit()
    return {"message": "Deleted"}
