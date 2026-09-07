"""The burst-intro narration script, per beat, for both locales.

Beat anchors are frames in `burst-intro`'s own scene table (S/T in src/BurstIntro.tsx), not the
storyboard's planned seconds — see the harness note in storyboard.md. A sentence starts a few
frames into its beat so the transition has settled, and must finish before the next one starts.

zh words are DECLARED here rather than segmented. whisper emits zh timings per character and a
segmenter would be a second source of truth; the script already knows where its own words end, so
`group-words.mjs` walks these against the transcription. A trailing `*` marks an important word.
"""

# frame each beat's sentence starts on, at 30 fps
ANCHOR = {'hook': 8, 'spec': 111, 'line': 246, 'idle': 396,
          'burst': 546, 'verdict': 741, 'keys': 921, 'outro': 1056}
ORDER = ['hook', 'spec', 'line', 'idle', 'burst', 'verdict', 'keys', 'outro']
END = 1155

# what the voice says. Punctuation is for the voice; it never becomes a caption word.
SPOKEN = {
    'en-US': {
        'hook':    'your box is burstable, not the same as fast',
        'spec':    '4 OCPUs on paper, baseline 12.5%',
        'line':    'below that line you are earning allowance, above it you are spending it',
        'idle':    'most of the time this box sits quietly under the line, banking credit',
        'burst':   'then a render starts, every core goes to the ceiling, and now you are spending',
        'verdict': 'it counts only the window on screen, so pan away and the numbers follow',
        'keys':    'grain, pan, width, all of it live while you watch',
        'outro':   '7 days of evidence instead of a guess',
    },
    'zh-CN': {
        'hook':    '你这台机器是可突发的',
        'spec':    '4个核心，基线只给12.5%',
        'line':    '基线以下你在攒额度，超过就是在花',
        'idle':    '多数时候，它安静地待在线的下面',
        'burst':   '渲染一开始，占用直接冲到顶，这时候你在花额度',
        'verdict': '只算屏幕上看得见的那段，平移视图数字跟着走',
        'keys':    '颗粒、平移、宽度，全都是实时的',
        'outro':   '7天的证据，不是猜测',
    },
}

# The caption units. en falls out of the voice's own tokens, so only zh needs declaring.
WORDS_ZH = {
    'hook':    ['你', '这台', '机器', '是', '可突发', '的*'],
    'spec':    ['4个', '核心*', '基线', '只给', '12.5%*'],
    'line':    ['基线', '以下', '你', '在', '攒*', '额度', '超过', '就是', '在', '花*'],
    'idle':    ['多数', '时候', '它', '安静地', '待在', '线', '的', '下面*'],
    'burst':   ['渲染', '一开始', '占用', '直接', '冲到顶*', '这时候', '你', '在', '花*', '额度'],
    'verdict': ['只算', '屏幕上', '看得见*', '的', '那段', '平移', '视图', '数字', '跟着走*'],
    'keys':    ['颗粒', '平移', '宽度', '全都是', '实时*', '的'],
    'outro':   ['7天', '的', '证据*', '不是', '猜测'],
}

# en words that carry the sentence. Matched against the voice's tokens, case-insensitively.
IMPORTANT_EN = {
    'hook': ['burstable'], 'spec': ['12.5%'], 'line': ['earning', 'spending'],
    'idle': ['under'], 'burst': ['ceiling', 'spending'], 'verdict': ['screen', 'follow'],
    'keys': ['live'], 'outro': ['7', 'days', 'evidence'],
}
