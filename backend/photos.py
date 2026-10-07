"""Content-addressed, metadata-stripped working photographs; originals stay with the user."""
import hashlib
import io
import re
from pathlib import Path
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_INPUT = 10 * 1024 * 1024
MAX_PHOTO = 2 * 1024 * 1024
CHUNK = 64 * 1024
HASH = re.compile(r"^[a-f0-9]{64}$")
Image.MAX_IMAGE_PIXELS = 24_000_000


def photo_path(directory, digest, partial=False):
    if not HASH.fullmatch(digest):
        raise ValueError("Invalid photo identifier.")
    return Path(directory) / (digest + (".part" if partial else ".jpg"))


def directory_bytes(directory):
    return sum(p.stat().st_size for p in Path(directory).rglob("*") if p.is_file())


def compress_photo(data):
    if len(data) > MAX_INPUT:
        raise ValueError("Choose a photograph smaller than 10 MiB.")
    try:
        with Image.open(io.BytesIO(data)) as original:
            if original.width * original.height > Image.MAX_IMAGE_PIXELS:
                raise ValueError("Photo exceeds the 24 megapixel processing limit.")
            im = ImageOps.exif_transpose(original).convert("RGB")
            im.thumbnail((1600, 1600))
            output = io.BytesIO()
            im.save(output, "JPEG", quality=82, optimize=True)
            body = output.getvalue()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ValueError("Use a valid JPEG, PNG or WebP photograph.") from exc
    if len(body) > MAX_PHOTO:
        raise ValueError("Compressed photo is too large. Choose a smaller image.")
    return body, im.width, im.height


def write_chunk(directory, digest, offset, total, body):
    """A repeated offset never appends twice; checksum gates promotion to a complete file."""
    if not 0 < total <= MAX_PHOTO or not 0 < len(body) <= CHUNK or offset < 0:
        raise ValueError("Invalid photo chunk.")
    final, part = photo_path(directory, digest), photo_path(directory, digest, True)
    if final.exists():
        return {"offset": final.stat().st_size, "complete": True}
    current = part.stat().st_size if part.exists() else 0
    if offset != current:
        return {"offset": current, "complete": False}
    if current + len(body) > total:
        raise ValueError("Photo exceeds its declared size.")
    with part.open("ab") as stream:
        stream.write(body)
    size = part.stat().st_size
    if size == total:
        if hashlib.sha256(part.read_bytes()).hexdigest() != digest:
            part.unlink()
            raise ValueError("Photo checksum failed; please retry.")
        part.replace(final)
    return {"offset": size, "complete": size == total}
