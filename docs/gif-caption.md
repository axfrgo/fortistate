GIF caption/overlay instructions

1) Choose a short explanatory caption (8–12 words) summarizing the action, e.g. "Inspector: Live store updates — click to change state".
2) Use an overlay text tool (ImageMagick, ffmpeg, or an editor) to add the caption.

Example ImageMagick command to add a semi-transparent caption bar at the bottom:

magick input.gif -coalesce -gravity south -pointsize 14 -fill white -undercolor '#00000080' -annotate +0+8 "Inspector: Live store updates — click to change state" -layers Optimize output.gif

Example ffmpeg command to add static overlay text (requires libfreetype):

ffmpeg -i input.gif -vf "drawtext=fontfile=/path/to/font.ttf:text='Inspector: Live store updates - click to change state':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=h-40" -y output.gif

Notes:
- Keep captions short and centered.
- Use a semi-transparent box for readability over varying backgrounds.
