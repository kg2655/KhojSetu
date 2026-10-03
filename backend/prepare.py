"""One-time model download. Normal application startup is strictly local-only."""
from pathlib import Path
from fastembed import TextEmbedding
from .vectors import MODEL

if __name__ == '__main__':
    root = Path(__file__).resolve().parent.parent
    model = TextEmbedding(model_name=MODEL, cache_dir=str(root / '.models'), threads=2)
    vector = next(model.embed(['Archaeological field memory']))
    print(f'Embedding model cached and verified: {MODEL}, {len(vector)} dimensions')
