"""
GSV Platform API Template
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI(title="GSV API Template")

class Item(BaseModel):
    id: int
    name: str
    description: str = ""

# In-memory storage (replace with database)
items: List[Item] = []

@app.post("/items", response_model=Item)
async def create_item(item: Item):
    items.append(item)
    return item

@app.get("/items", response_model=List[Item])
async def list_items():
    return items

@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    for item in items:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@app.get("/health")
async def health():
    return {"status": "healthy"}
