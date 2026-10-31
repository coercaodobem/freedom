#!/usr/bin/env python3
"""Build deterministic portable packages from pinned, already downloaded inputs.

Usage: python3 tools/package-property-relay.py /path/to/sources.json
Each source record contains platform, url, sha256, local_path. This tool never downloads.
"""
import hashlib
import io
import json
import sys
import tarfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RELAY = ROOT / 'property/relay'
LINUX_HASH = '9722c226dc59c45d50f9f8c1e22ad815fd6fb971413c7da3aa7fc36253e6d1a7'
CHUNK = 1024 * 1024


def digest(data):
    return hashlib.sha256(data).hexdigest()


original = b''.join(p.read_bytes() for p in sorted((RELAY / 'dist-parts').glob('part-*')))
assert digest(original) == LINUX_HASH
with tarfile.open(fileobj=io.BytesIO(original), mode='r:gz') as source:
    libraries = {m.name: (source.extractfile(m).read(), 0o644) for m in source.getmembers()
                 if m.isfile() and m.name.startswith('geode/lib/')}

packages = {}
for record in json.loads(Path(sys.argv[1]).read_text()):
    platform = record['platform']
    assert platform in ['windows-x64', 'macos-arm64']
    archive = Path(record['local_path']).read_bytes()
    assert digest(archive) == record['sha256']
    contents = dict(libraries)
    if platform == 'windows-x64':
        with zipfile.ZipFile(io.BytesIO(archive)) as runtime:
            for member in runtime.infolist():
                if member.is_dir():
                    continue
                relative = member.filename.split('/', 1)[1]
                assert '..' not in Path(relative).parts
                contents['geode/runtime/' + relative] = (runtime.read(member), 0o644)
    else:
        with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as runtime:
            for member in runtime.getmembers():
                if not member.isfile() or '/Contents/Home/' not in member.name:
                    continue
                relative = member.name.split('/Contents/Home/', 1)[1]
                assert '..' not in Path(relative).parts
                contents['geode/runtime/' + relative] = (runtime.extractfile(member).read(), member.mode)
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for name, (data, mode) in sorted(contents.items()):
            info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = (0o100000 | mode) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            bundle.writestr(info, data)
    data = output.getvalue()
    destination = RELAY / 'portable' / platform
    destination.mkdir(parents=True, exist_ok=True)
    chunks = []
    for index, offset in enumerate(range(0, len(data), CHUNK)):
        chunk = data[offset:offset + CHUNK]
        name = f'part-{index:03d}'
        (destination / name).write_bytes(chunk)
        chunks.append({'file': name, 'bytes': len(chunk), 'sha256': digest(chunk)})
    manifest = {'format': 1, 'platform': platform, 'geode_version': '1.20.0',
                'java_version': '21.0.13+9', 'runtime_source': record['url'],
                'runtime_source_sha256': record['sha256'], 'geode_source_sha256': LINUX_HASH,
                'archive_sha256': digest(data), 'archive_bytes': len(data), 'parts': chunks,
                'libraries': {name: digest(content[0]) for name, content in sorted(libraries.items())}}
    (destination / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    packages[platform] = {'sha256': digest(data), 'parts': len(chunks), 'bytes': len(data)}
print(json.dumps(packages, indent=2))
