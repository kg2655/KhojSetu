"""Real in-process Qdrant Edge. No local-client substitution or mock search."""
import hashlib
import math
import re
from collections import Counter
from pathlib import Path
from fastembed import TextEmbedding
from qdrant_edge import (Distance, EdgeConfig, EdgeVectorParams, EdgeSparseVectorParams,
    EdgeShard, Point, UpdateOperation, Query, QueryRequest, SparseVector,
    Filter, FieldCondition, MatchValue)

MODEL = 'sentence-transformers/all-MiniLM-L6-v2'
STOP = set('a an the in on at of for to and or is are we have found find show me with around'.split())


def sparse(text):
    # Stable term-frequency sparse vectors, independent of corpus and device.
    # Dense + lexical reciprocal-rank fusion is hybrid search; this is not BM25.
    terms = Counter(int.from_bytes(hashlib.blake2s(t.encode(), digest_size=4).digest(), 'big')
                    for t in re.findall(r'\w+', text.lower()) if t not in STOP)
    return {'indices': sorted(terms), 'values': [1 + math.log(terms[k]) for k in sorted(terms)]}


def text_for(r):
    return ' '.join(str(r.get(k, '')) for k in
        (['title', 'fieldNotes', 'artifactType', 'material', 'site'] + ([] if r.get('referenceSource') else ['grid', 'layer']))) + ' ' + ' '.join(r.get('tags', []))


class VectorMemory:
    def __init__(self, directory: Path, model_dir: Path, offline=True):
        self.model = TextEmbedding(model_name=MODEL, cache_dir=str(model_dir),
                                   local_files_only=offline, threads=2)
        directory.mkdir(parents=True, exist_ok=True)
        self.shard = (EdgeShard.load(str(directory)) if (directory / 'edge_config.json').exists()
                      else EdgeShard.create(str(directory), EdgeConfig(
                          vectors={'dense': EdgeVectorParams(size=384, distance=Distance.Cosine)},
                          sparse_vectors={'lexical': EdgeSparseVectorParams()})))

    def encode(self, text):
        return {'dense': next(self.model.embed([text])).tolist(), 'lexical': sparse(text)}

    def upsert(self, record, vectors=None):
        vectors = vectors or self.encode(text_for(record))
        self.shard.update(UpdateOperation.upsert_points([Point(
            id=record['uuid'], vector={'dense': vectors['dense'],
            'lexical': SparseVector(**vectors['lexical'])},
            payload={k:('' if record.get('referenceSource') and k in ('layer','grid') else record.get(k)) for k in ('id','layer','material','site','grid')})]))
        return vectors

    def search(self, query, mode, filters, limit):
        conditions = [FieldCondition(key=k, match=MatchValue(value=v)) for k, v in filters.items() if v]
        filt = Filter(must=conditions) if conditions else None
        if not query.strip():
            return [(p, None, 'Filtered field record') for p in self.shard.query(
                QueryRequest(limit=limit, filter=filt, with_payload=True))]
        vectors = ({'lexical': sparse(query)} if mode == 'EXACT' else self.encode(query))
        rankings = []
        if mode != 'EXACT':
            dense = self.shard.query(QueryRequest(query=Query.Nearest(vectors['dense'], using='dense'),
                filter=filt, limit=50, with_payload=True))
            rankings.append([p for p in dense if p.score >= 0.24])
        if mode != 'SEMANTIC' and vectors['lexical']['indices']:
            rankings.append(self.shard.query(QueryRequest(
                query=Query.Nearest(SparseVector(**vectors['lexical']), using='lexical'),
                filter=filt, limit=50, with_payload=True)))
        if mode != 'HYBRID':
            return [(p, p.score, 'Dense cosine similarity' if mode == 'SEMANTIC' else 'Lexical term score')
                    for p in (rankings[0] if rankings else [])[:limit]]
        points, scores = {}, {}
        for ranking in rankings:
            for rank, point in enumerate(ranking):
                key = str(point.id)
                points[key] = point
                scores[key] = scores.get(key, 0) + 1 / (60 + rank + 1)
        return [(points[k], scores[k], 'Dense + lexical reciprocal-rank fusion')
                for k in sorted(scores, key=scores.get, reverse=True)[:limit]]

    def remove(self, point_id):
        self.shard.update(UpdateOperation.delete_points([point_id]))

    def close(self):
        self.shard.close()
