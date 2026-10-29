"""Narrate every scene of a video with a designed OmniVoice voice.

    python scripts/voice-design/synth.py <video.json> <reference.wav> <reference.txt> <out-dir> [scene-id ...]

The reference is the designed voice's sample and its transcript; cloning
from it keeps every scene (and every video) in the same voice. Writes
<out-dir>/<scene-id>.wav, ready for `npm run video:import-voice`.
"""

import json
import sys
from pathlib import Path

import soundfile as sf
import torch
from omnivoice import OmniVoice


def main() -> None:
    video, ref_audio, ref_text, out = (Path(arg) for arg in sys.argv[1:5])
    wanted = set(sys.argv[5:])
    out.mkdir(parents=True, exist_ok=True)
    data = json.loads(video.read_text(encoding="utf-8"))
    scenes = [s for s in data["scenes"] if not wanted or s["id"] in wanted]

    # bfloat16 and no ASR: the same low-RAM load as design.py.
    model = OmniVoice.from_pretrained(
        "k2-fsa/OmniVoice", device_map="cpu", dtype=torch.bfloat16, load_asr=False
    )
    prompt = model.create_voice_clone_prompt(
        str(ref_audio), ref_text.read_text(encoding="utf-8").strip()
    )
    for scene in scenes:
        torch.manual_seed(7)
        audio = model.generate(
            text=scene["narration"], language=data.get("language", "vi"), voice_clone_prompt=prompt
        )[0]
        sf.write(out / f"{scene['id']}.wav", audio.squeeze(0).float().cpu().numpy(), model.sampling_rate)
        print(f"{scene['id']}: {audio.shape[-1] / model.sampling_rate:.2f}s", flush=True)


if __name__ == "__main__":
    main()
