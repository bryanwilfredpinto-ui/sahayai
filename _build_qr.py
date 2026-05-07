"""
Build QR codes for the Chitti family of products.

Run:    python _build_qr.py
Output: qr_chitti_technical.png       — navy on white
        qr_chitti_fundamentals.png    — saffron on white
        qr_chitti_both.png            — Bharat-styled combined poster
"""
import os
import subprocess
import sys

try:
    import qrcode
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "--quiet", "qrcode[pil]", "Pillow"]
    )
    import qrcode
    from PIL import Image, ImageDraw, ImageFont


BHARAT_NAVY     = "#0E2344"
BHARAT_SAFFRON  = "#E86A17"
BHARAT_GOLD     = "#D4AF37"
BHARAT_CREAM    = "#F8F4EE"
WHITE           = "#FFFFFF"

TECH_URL = "https://sahayai.in/chitti_complete_technical.html"
FUND_URL = "https://sahayai.in/chitti_fundamentals.html"

OUT_DIR = os.path.dirname(os.path.abspath(__file__))


def make_qr(url: str, fg: str, bg: str = WHITE, box: int = 14, border: int = 4):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # high error correction
        box_size=box,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color=fg, back_color=bg).convert("RGB")


def load_font(size: int):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/seguiemj.ttf",   # Segoe UI Emoji on Windows
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "DejaVuSans-Bold.ttf",
        "Arial.ttf",
        "arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


# 1) Individual QR cards — labelled, branded, self-identifying.
#    Each one is a mini Bharat-poster so the recipient knows what it is
#    before scanning, even if shared standalone on WhatsApp.
def build_qr_card(qr_img: Image.Image, brand_word: str, accent_hex: str, url: str, out_path: str) -> None:
    f_brand    = load_font(72)
    f_subtitle = load_font(28)
    f_url      = load_font(20)
    f_disc     = load_font(18)

    card_w, card_h = 900, 1180
    card = Image.new("RGB", (card_w, card_h), BHARAT_CREAM)
    cdraw = ImageDraw.Draw(card)

    # Bharat-stripe at top (always saffron / gold / navy)
    s_h = 12
    cdraw.rectangle([0, 0, card_w // 3, s_h], fill=BHARAT_SAFFRON)
    cdraw.rectangle([card_w // 3, 0, 2 * card_w // 3, s_h], fill=BHARAT_GOLD)
    cdraw.rectangle([2 * card_w // 3, 0, card_w, s_h], fill=BHARAT_NAVY)

    # Title block — "CHITTI" in navy, product word in accent colour
    cdraw.text((card_w // 2, 80),  "CHITTI",       font=f_brand, fill=BHARAT_NAVY, anchor="mt")
    cdraw.text((card_w // 2, 180), brand_word,     font=f_brand, fill=accent_hex, anchor="mt")
    cdraw.text(
        (card_w // 2, 290),
        "Bharat Premium AI  ·  Voice-first  ·  Built for every Indian",
        font=f_subtitle, fill="#6b7280", anchor="mt",
    )

    # QR
    qr_size = 560
    qr_resized = qr_img.resize((qr_size, qr_size), Image.LANCZOS)
    qr_x = card_w // 2 - qr_size // 2
    qr_y = 360
    card.paste(qr_resized, (qr_x, qr_y))
    # Accent frame
    cdraw.rectangle(
        [qr_x - 8, qr_y - 8, qr_x + qr_size + 8, qr_y + qr_size + 8],
        outline=accent_hex, width=4,
    )

    # Scan instruction
    cdraw.text(
        (card_w // 2, qr_y + qr_size + 30),
        "Scan with any phone camera",
        font=f_subtitle, fill="#374151", anchor="mt",
    )

    # URL in accent
    cdraw.text(
        (card_w // 2, qr_y + qr_size + 80),
        url,
        font=f_url, fill=accent_hex, anchor="mt",
    )

    # Disclaimer
    cdraw.text(
        (card_w // 2, card_h - 60),
        "NOT SEBI Registered.  Educational tool only, not investment advice.",
        font=f_disc, fill="#8a5a00", anchor="mt",
    )

    # Mirror Bharat-stripe at bottom (navy / gold / saffron)
    cdraw.rectangle([0, card_h - s_h, card_w // 3, card_h], fill=BHARAT_NAVY)
    cdraw.rectangle([card_w // 3, card_h - s_h, 2 * card_w // 3, card_h], fill=BHARAT_GOLD)
    cdraw.rectangle([2 * card_w // 3, card_h - s_h, card_w, card_h], fill=BHARAT_SAFFRON)

    card.save(out_path, "PNG")
    print("WROTE:", out_path, "(", card.size, ")")


tech_qr = make_qr(TECH_URL, BHARAT_NAVY)
fund_qr = make_qr(FUND_URL, BHARAT_SAFFRON)

build_qr_card(
    tech_qr, "TECHNICAL", BHARAT_NAVY, TECH_URL,
    os.path.join(OUT_DIR, "qr_chitti_technical.png"),
)
build_qr_card(
    fund_qr, "FUNDAMENTALS", BHARAT_SAFFRON, FUND_URL,
    os.path.join(OUT_DIR, "qr_chitti_fundamentals.png"),
)


# 2) Combined Bharat-themed poster
W, H = 1200, 1500
poster = Image.new("RGB", (W, H), BHARAT_CREAM)
draw = ImageDraw.Draw(poster)

font_brand    = load_font(96)
font_subtitle = load_font(28)
font_label    = load_font(40)
font_desc     = load_font(22)
font_url      = load_font(18)
font_tag      = load_font(48)

# Bharat stripe at top (saffron / gold / navy)
stripe_h = 14
draw.rectangle([0, 0, W // 3, stripe_h], fill=BHARAT_SAFFRON)
draw.rectangle([W // 3, 0, 2 * W // 3, stripe_h], fill=BHARAT_GOLD)
draw.rectangle([2 * W // 3, 0, W, stripe_h], fill=BHARAT_NAVY)

# Title block
draw.text((W // 2, 100), "CHITTI", font=font_brand, fill=BHARAT_NAVY, anchor="mt")
draw.text(
    (W // 2, 220),
    "Bharat Premium AI  ·  Voice-first  ·  Built for every Indian",
    font=font_subtitle, fill="#6b7280", anchor="mt",
)

# Resize QRs for the poster
qr_size = 460
tech_qr_r = tech_qr.resize((qr_size, qr_size), Image.LANCZOS)
fund_qr_r = fund_qr.resize((qr_size, qr_size), Image.LANCZOS)

qr_y = 320
left_x  = W // 4 - qr_size // 2
right_x = 3 * W // 4 - qr_size // 2
poster.paste(tech_qr_r, (left_x, qr_y))
poster.paste(fund_qr_r, (right_x, qr_y))

# Subtle navy / saffron frames around the QRs
draw.rectangle([left_x - 8,  qr_y - 8, left_x + qr_size + 8,  qr_y + qr_size + 8], outline=BHARAT_NAVY,    width=3)
draw.rectangle([right_x - 8, qr_y - 8, right_x + qr_size + 8, qr_y + qr_size + 8], outline=BHARAT_SAFFRON, width=3)

# Labels
label_y = qr_y + qr_size + 36
draw.text((W // 4,     label_y), "Chitti Technical",    font=font_label, fill=BHARAT_NAVY,    anchor="mt")
draw.text((3 * W // 4, label_y), "Chitti Fundamentals", font=font_label, fill=BHARAT_SAFFRON, anchor="mt")

# Descriptions
desc_y = label_y + 64
draw.text((W // 4,     desc_y), "Charts · Roshan signal · 8 timeframes",  font=font_desc, fill="#374151", anchor="mt")
draw.text((3 * W // 4, desc_y), "37 ratios · 31 strategies · investor lens", font=font_desc, fill="#374151", anchor="mt")

# URLs
url_y = desc_y + 56
draw.text((W // 4,     url_y), TECH_URL, font=font_url, fill=BHARAT_NAVY,    anchor="mt")
draw.text((3 * W // 4, url_y), FUND_URL, font=font_url, fill=BHARAT_SAFFRON, anchor="mt")

# Tagline
tag_y = url_y + 110
draw.text((W // 2, tag_y), "Scan. Trade. Save.", font=font_tag, fill=BHARAT_NAVY, anchor="mt")
draw.text(
    (W // 2, tag_y + 64),
    "Hindi-ready  ·  Voice IN + Voice OUT  ·  Four-user accessible",
    font=font_subtitle, fill="#6b7280", anchor="mt",
)

# Disclaimer footer (matches the SEBI-not-registered standing rule)
draw.text(
    (W // 2, H - 80),
    "NOT SEBI Registered.  Educational tool only, not investment advice.",
    font=font_desc, fill="#8a5a00", anchor="mt",
)

# Bharat stripe at bottom (mirror of top)
draw.rectangle([0, H - stripe_h, W // 3, H], fill=BHARAT_NAVY)
draw.rectangle([W // 3, H - stripe_h, 2 * W // 3, H], fill=BHARAT_GOLD)
draw.rectangle([2 * W // 3, H - stripe_h, W, H], fill=BHARAT_SAFFRON)

both_path = os.path.join(OUT_DIR, "qr_chitti_both.png")
poster.save(both_path, "PNG")
print("WROTE:", both_path, "(", poster.size, ")")
