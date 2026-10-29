"""Builds web/index.html and web/app.js from the single-page source (src/retorno-hub.html).
Run: python3 build.py"""
import re, pathlib
root = pathlib.Path(__file__).parent
src = (root / 'src' / 'retorno-hub.html').read_text(encoding='utf-8')
i = src.rindex('<script>\n'); j = src.rindex('</script>')
page, app = src[:i], src[i + 9:j]
head_extra = '''<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#26332C">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="רטורנו">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-180.png">
'''
reset = '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>\n'
title = re.search(r'<title>.*?</title>', page).group(0)
body = page.replace(title, '')
html = ('<!doctype html>\n<html lang="he" dir="rtl">\n<head>\n' + head_extra + title + '\n' + reset + '</head>\n<body>\n' + body +
        '\n<script src="config.js"></script>\n<script src="vendor/supabase.js"></script>\n<script src="supa.js"></script>\n<script src="app.js"></script>\n</body>\n</html>\n')
(root / 'web' / 'index.html').write_text(html, encoding='utf-8')
(root / 'web' / 'app.js').write_text(app, encoding='utf-8')
print('built', len(html), len(app))
