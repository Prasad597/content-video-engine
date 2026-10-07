"""Replaceable CPU adapter. Reads normalized input; emits only the internal contract."""
import json
import math
import os
from pathlib import Path
import sys
import time

# Download cache is package-local; audio is never uploaded.
HERE = Path(__file__).resolve().parent
os.environ.setdefault("HF_HOME", str(HERE / "models"))
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
from faster_whisper import WhisperModel
from faster_whisper.utils import download_model
from huggingface_hub.errors import LocalEntryNotFoundError


def json_timestamp(value):
    # JSON has no NaN/Infinity. Null preserves missing/invalid timing for the
    # TypeScript boundary to assess against neighbors; finite values are untouched.
    return value if isinstance(value, (int, float)) and math.isfinite(value) else None


def main():
    request = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    started = time.perf_counter()
    try:
        model_path = download_model("base.en", cache_dir=str(HERE / "models"), local_files_only=True)
    except LocalEntryNotFoundError:
        model_path = download_model("base.en", cache_dir=str(HERE / "models"))
    setup_seconds = time.perf_counter() - started
    started = time.perf_counter()
    model = WhisperModel(model_path, device="cpu", compute_type="int8", cpu_threads=4)
    segments, _ = model.transcribe(
        request["audioPath"], language="en", beam_size=5,
        word_timestamps=True, vad_filter=False, temperature=0,
        condition_on_previous_text=False,
        initial_prompt=request["text"],
    )
    words = []
    for segment in segments:
        for word in segment.words or []:
            words.append({"text": word.word.strip(), "start": json_timestamp(getattr(word, "start", None)),
                          "end": json_timestamp(getattr(word, "end", None)), "confidence": word.probability})
    elapsed = time.perf_counter() - started
    result = {key: request[key] for key in
              ["version", "audio", "audioHash", "scriptHash", "duration", "language"]}
    result["words"] = words
    Path(sys.argv[2]).write_text(json.dumps(result, indent=2), encoding="utf-8")
    # Provider-specific provenance stays separate from normalized alignment.
    peak = None
    if sys.platform == "win32":
        import ctypes
        from ctypes import wintypes
        class Counters(ctypes.Structure):
            _fields_ = [("cb", wintypes.DWORD), ("PageFaultCount", wintypes.DWORD)] + [
                (name, ctypes.c_size_t) for name in ["PeakWorkingSetSize", "WorkingSetSize",
                "QuotaPeakPagedPoolUsage", "QuotaPagedPoolUsage", "QuotaPeakNonPagedPoolUsage",
                "QuotaNonPagedPoolUsage", "PagefileUsage", "PeakPagefileUsage"]]
        counters = Counters()
        counters.cb = ctypes.sizeof(counters)
        handle = ctypes.windll.kernel32.GetCurrentProcess
        handle.restype = wintypes.HANDLE
        memory_info = ctypes.windll.psapi.GetProcessMemoryInfo
        memory_info.argtypes = [wintypes.HANDLE, ctypes.POINTER(Counters), wintypes.DWORD]
        memory_info.restype = wintypes.BOOL
        if memory_info(handle(), ctypes.byref(counters), counters.cb):
            peak = counters.PeakWorkingSetSize
    metrics = {"adapter": "faster-whisper", "model": "base.en", "device": "cpu",
               "computeType": "int8", "threads": 4,
               "modelSetupSeconds": setup_seconds, "alignmentSeconds": elapsed,
               "peakWorkingSetBytes": peak, "wordCount": len(words),
               "modelBytes": sum(p.stat().st_size for p in Path(model_path).rglob("*") if p.is_file())}
    Path(sys.argv[3]).write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps(metrics), flush=True)


if __name__ == "__main__":
    main()
