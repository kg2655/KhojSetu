from typing import Literal
from pydantic import BaseModel, Field


class RecordInput(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    fieldNotes: str = Field(min_length=5, max_length=12000)
    artifactType: str = 'Field observation'
    material: str = 'Other'
    condition: str = 'Unknown'
    period: str = 'Unassigned'
    site: str = 'Demo Excavation Site'
    sector: str = 'B'
    grid: str = Field(default='B12', pattern=r'^[A-Z][0-9]{1,3}$')
    layer: Literal['L1', 'L2', 'L3', 'L4', 'L5'] = 'L3'
    depth: float = Field(default=0, ge=0, le=100)
    recordedBy: str = 'Team Alpha'
    importance: Literal['High', 'Medium', 'Routine'] = 'Routine'
    visibility: Literal['LOCAL', 'SHARED', 'AUTO'] = 'AUTO'
    sensitive: bool = False
    approved: bool = False
    tags: list[str] = Field(default_factory=list, max_length=30)
    illustrationType: str = 'ceramic_painted'
    imageUrl: str | None = Field(default=None, max_length=2000000)
    expectedVersion: int | None = None


class SearchInput(BaseModel):
    query: str = Field(default='', max_length=2000)
    mode: Literal['SEMANTIC', 'EXACT', 'HYBRID'] = 'HYBRID'
    layer: str = ''
    material: str = ''
    limit: int = Field(default=12, ge=1, le=50)


def policy(record: dict, metered: bool = False) -> tuple[bool, str]:
    if record.get('sensitive'):
        return False, 'Sensitive field information stays on this device.'
    if record.get('visibility') == 'LOCAL':
        return False, 'Researcher selected local-only storage.'
    if not record.get('approved'):
        return False, 'Awaiting researcher approval before exchange.'
    if metered and record.get('importance') != 'High':
        return False, 'Deferred on a limited link; high-priority findings go first.'
    if record.get('visibility') == 'AUTO' and record.get('importance') == 'Routine':
        return False, 'Automatic policy retains routine observations locally.'
    return True, 'Approved, non-sensitive finding selected for exchange.'
