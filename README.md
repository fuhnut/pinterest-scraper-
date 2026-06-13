# Pinterest HD Scraper

A Chrome extension that quietly collects full‑resolution Pinterest image URLs while you browse.  
It runs in the background, works across multiple tabs, and shows a small on‑page overlay with live stats so you always know what’s happening.

## What it does

- Watches Pinterest pages for new images as they load
- Converts Pinterest’s CDN thumbnails into their HD/original versions
- Stores URLs in IndexedDB in efficient batches
- Lets you start, stop, pause, and resume scraping per tab
- Shows a lightweight overlay with real‑time progress
- Exports everything to a simple text file when you’re ready

It’s built to be fast, quiet, and able to run for hours without slowing your browser down.

## Getting started

1. Download or clone the project.
2. Open `chrome://extensions/`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the project folder.
5. Open Pinterest in any tab.
6. Use the extension popup to start scraping.

Each tab runs its own scraper instance, so you can collect from multiple boards or searches at once.

## File overview

