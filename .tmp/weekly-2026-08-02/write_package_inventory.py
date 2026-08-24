import json
from hashlib import sha256
from pathlib import Path
from zipfile import ZipFile


base = Path(r"D:\实习工作\掌眼\周报\模板")
files = [
    base / "工作总结模板.docx",
    base / "xxx（姓名）第x周工作周报(5)(1).docx",
]
result = {}
for path in files:
    with ZipFile(path) as archive:
        result[str(path)] = [
            {
                "part": info.filename,
                "size": info.file_size,
                "sha256": sha256(archive.read(info.filename)).hexdigest(),
                "classification": "editable" if info.filename == "word/document.xml" else "preserve-only",
            }
            for info in archive.infolist()
        ]

out = Path(r"D:\实习工作\掌眼\.tmp\weekly-2026-08-02\package-inventory.json")
out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(out)
