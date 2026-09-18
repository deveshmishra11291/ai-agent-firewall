#!/usr/bin/env bash
# Convert any Mac Screen Recording (.mov) into an ultra-smooth high-definition GIF for GitHub README
# Usage: ./scripts/make-gif.sh input.mov [output.gif]

INPUT="$1"
OUTPUT="${2:-demo.gif}"

if [ -z "$INPUT" ]; then
  echo "Usage: ./scripts/make-gif.sh <screen-recording.mov> [output.gif]"
  exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
  echo "Error: ffmpeg is not installed. Install with 'brew install ffmpeg'"
  exit 1
fi

echo "Generating high-definition GIF with custom palette..."
ffmpeg -y -i "$INPUT" -filter_complex "[0:v] fps=15,scale=960:-1:flags=lanczos,split [a][b];[a] palettegen=max_colors=128 [p];[b][p] paletteuse=dither=bayer" -loop 0 "$OUTPUT"

echo "Done! Generated $OUTPUT ready for GitHub README."
