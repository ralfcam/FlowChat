from datetime import datetime
from bson import ObjectId
from app import get_db

class Flow:
    """Flow model for storing message flows."""
    
    @property
    def collection(self):
        """Get the MongoDB collection for flows."""
        db = get_db()
        return db.flows
    
    def __init__(self, name, description, nodes, edges, is_active=False, is_preset=False, user_id=None, 
                 created_at=None, updated_at=None, _id=None):
        self.name = name
        self.description = description
        self.nodes = nodes
        self.edges = edges
        self.is_active = is_active
        self.is_preset = is_preset
        self.user_id = user_id
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
        self._id = _id
    
    def to_dict(self):
        """Convert Flow object to dictionary."""
        return {
            "_id": str(self._id) if self._id else None,
            "name": self.name,
            "description": self.description,
            "nodes": self.nodes,
            "edges": self.edges,
            "is_active": self.is_active,
            "is_preset": self.is_preset,
            "user_id": str(self.user_id) if self.user_id else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create Flow object from dictionary."""
        if data.get("_id") and not isinstance(data["_id"], ObjectId):
            data["_id"] = ObjectId(data["_id"])
        if data.get("user_id") and not isinstance(data["user_id"], ObjectId):
            data["user_id"] = ObjectId(data["user_id"])
        if data.get("created_at") and isinstance(data["created_at"], str):
            data["created_at"] = datetime.fromisoformat(data["created_at"])
        if data.get("updated_at") and isinstance(data["updated_at"], str):
            data["updated_at"] = datetime.fromisoformat(data["updated_at"])
        return cls(**data)
    
    def save(self):
        """Save flow to database."""
        self.updated_at = datetime.utcnow()
        if not self._id:
            result = self.collection.insert_one({
                "name": self.name,
                "description": self.description,
                "nodes": self.nodes,
                "edges": self.edges,
                "is_active": self.is_active,
                "is_preset": self.is_preset,
                "user_id": self.user_id,
                "created_at": self.created_at,
                "updated_at": self.updated_at
            })
            self._id = result.inserted_id
        else:
            self.collection.update_one(
                {"_id": self._id},
                {"$set": {
                    "name": self.name,
                    "description": self.description,
                    "nodes": self.nodes,
                    "edges": self.edges,
                    "is_active": self.is_active,
                    "is_preset": self.is_preset,
                    "user_id": self.user_id,
                    "updated_at": self.updated_at
                }}
            )
        return self
    
    @classmethod
    def find_by_id(cls, flow_id):
        """Find flow by ID."""
        db = get_db()
        if isinstance(flow_id, str):
            flow_id = ObjectId(flow_id)
        data = db.flows.find_one({"_id": flow_id})
        return cls.from_dict(data) if data else None
    
    @classmethod
    def find_all_by_user(cls, user_id):
        """Find all flows by user ID."""
        db = get_db()
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        flows = db.flows.find({"user_id": user_id})
        return [cls.from_dict(flow) for flow in flows]
    
    @classmethod
    def find_active_flows(cls):
        """Find all active flows."""
        db = get_db()
        flows = db.flows.find({"is_active": True})
        return [cls.from_dict(flow) for flow in flows]
    
    @classmethod
    def find_presets(cls):
        """Find all preset flows."""
        db = get_db()
        flows = db.flows.find({"is_preset": True})
        return [cls.from_dict(flow) for flow in flows]
    
    def duplicate(self, new_name=None, new_user_id=None, as_preset=False):
        """Duplicate a flow for a user."""
        duplicate_flow = Flow(
            name=new_name or f"Copy of {self.name}",
            description=self.description,
            nodes=self.nodes.copy() if self.nodes else [],
            edges=self.edges.copy() if self.edges else [],
            is_active=False,  # Always inactive by default
            is_preset=as_preset,
            user_id=new_user_id or self.user_id
        )
        duplicate_flow.save()
        return duplicate_flow
    
    def delete(self):
        """Delete flow from database."""
        if self._id:
            result = self.collection.delete_one({"_id": self._id})
            return result.deleted_count > 0
        return False 