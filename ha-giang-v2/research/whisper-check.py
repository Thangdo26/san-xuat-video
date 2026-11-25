import sys
from faster_whisper import WhisperModel
m = WhisperModel('small', compute_type='int8')
with open(sys.argv[2], 'w', encoding='utf-8') as f:
    for p in sys.argv[1].split(','):
        s, _ = m.transcribe(p, language='vi')
        f.write(p + ': ' + ' '.join(x.text for x in s) + '\n')
