"""Design candidate narrator voices with OmniVoice (VoiceStudio's default engine).

Run with VoiceStudio's Python environment:

    uv run --project <VoiceStudio> python scripts/voice-design/design.py <out-dir>

Writes one WAV per candidate, all reading the same Vietnamese sample, so they
can be compared by ear. A designed voice has no owner to ask: it is generated
from attributes (gender, age, pitch), not copied from anyone.
"""

import sys
from pathlib import Path

import soundfile as sf
import torch
from omnivoice import OmniVoice

SAMPLE = (
    "Có ba ngày hai đêm ở Phú Yên? Lưu ngay lịch trình này để ngắm gành đá, "
    "đón bình minh và ăn hải sản thật đã."
)

# (name, instruct, seed)
CANDIDATES = [
    ("01-nu-tre-cao", "female, young adult, high pitch", 7),
    ("02-nu-tre-cao", "female, young adult, high pitch", 21),
    ("03-nu-tre-vua", "female, young adult, moderate pitch", 7),
    ("04-nu-tre-vua", "female, young adult, moderate pitch", 42),
    ("05-nu-teen", "female, teenager, high pitch", 7),
    ("06-nu-tre-vua", "female, young adult, moderate pitch", 99),
]


def main() -> None:
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    # bfloat16 halves the resident weights (VoiceStudio's OMNIVOICE_CPU_DTYPE
    # advice for machines short on RAM); the ASR model is not needed to design.
    model = OmniVoice.from_pretrained(
        "k2-fsa/OmniVoice", device_map="cpu", dtype=torch.bfloat16, load_asr=False
    )
    rate = model.sampling_rate
    for name, instruct, seed in CANDIDATES:
        torch.manual_seed(seed)
        audio = model.generate(text=SAMPLE, language="vi", instruct=instruct)[0]
        sf.write(out / f"{name}.wav", audio.squeeze(0).float().cpu().numpy(), rate)
        print(f"{name}: {instruct}, seed {seed}", flush=True)


if __name__ == "__main__":
    main()
