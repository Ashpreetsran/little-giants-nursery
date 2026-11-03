#!/usr/bin/env bash
set -euo pipefail

if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick is required. Install it with: brew install imagemagick" >&2
  exit 1
fi

mkdir -p public/images/derived

magick \
  public/images/source/about-us-14-img-9421.jpg \
  -gravity center \
  -crop 1500x650+0+0 \
  +repage \
  -strip \
  -quality 88 \
  public/images/derived/about-us-14-img-9421-landscape.jpg

geometry=$(magick identify -format '%wx%h' public/images/derived/about-us-14-img-9421-landscape.jpg)
if [[ "$geometry" != "1500x650" ]]; then
  echo "Unexpected derived image geometry: $geometry" >&2
  exit 1
fi

echo "Generated landscape mosaic crop at $geometry"
