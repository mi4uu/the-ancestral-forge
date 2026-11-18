# Video Pipeline

Converts articles into YouTube videos with AI narration and image backgrounds.

## Pipeline Stages

### 1. Create video project
```bash
python3 video/create-project.py elderberry-lie
```
Creates `video/elderberry-lie/` with script template from article.

### 2. Edit narration script
Edit `video/elderberry-lie/script.md` — rewrite for video format (30-40 min narration).

Format:
```
[IMAGE: forest-elder-tree.png]
Welcome back to The Ancestral Forge...

[IMAGE: lab-analysis.png]
What the clinical trials actually showed was...

[PAUSE: 2]
(2 second pause)

[SUBSCRIBE]
If you're finding value in this, hit subscribe...
```

### 3. Prepare images
Place images in `video/elderberry-lie/images/` — numbered or named to match script cues.

### 4. Generate audio
```bash
python3 video/generate-audio.py elderberry-lie
```

### 5. Assemble video
```bash
python3 video/assemble-video.py elderberry-lie
```

Output: `video/elderberry-lie/output/final.mp4`

## Voice options
Default: `en-US-GuyNeural` (authoritative male). Change in config.json per project.
Other good voices: `en-US-AndrewNeural`, `en-US-BrianNeural`, `en-GB-RyanNeural`
