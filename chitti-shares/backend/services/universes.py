"""
services/universes.py
---------------------
Stock universe lists for the Roshan Scanner.

Categorisation source: AMFI Jan 2026 (effective H1 CY2026):
  - Largecap = top 100 by 6-month avg market cap (cutoff ~ Rs 1,05,000 cr)
  - Midcap   = ranks 101-250 (cutoff ~ Rs 34,700 cr)
  - Smallcap = ranks 251-500
  - Microcap = ranks 501+

This file ships an INITIAL set drawn from AMFI's published list. When
your stock_universe table grows beyond 153 stocks, filter against this
file to expand each bucket without changing scanner logic.

All symbols are in canonical "NSE:TICKER" form so they pass straight
into angel_client.get_quote() and technical.fetch_candles().

If a symbol is requested that isn't in your DB seed, the scanner just
skips it — no crash. So we can safely list more symbols here than
the DB has and the scanner self-prunes.
"""
from __future__ import annotations

# -----------------------------------------------------------------
# NIFTY 50  (the 50 most-traded large caps; subset of Largecap)
# -----------------------------------------------------------------
NIFTY_50 = [
    "NSE:RELIANCE", "NSE:TCS", "NSE:HDFCBANK", "NSE:ICICIBANK", "NSE:INFY",
    "NSE:HINDUNILVR", "NSE:ITC", "NSE:LT", "NSE:SBIN", "NSE:BHARTIARTL",
    "NSE:KOTAKBANK", "NSE:AXISBANK", "NSE:BAJFINANCE", "NSE:ASIANPAINT",
    "NSE:MARUTI", "NSE:HCLTECH", "NSE:WIPRO", "NSE:ULTRACEMCO", "NSE:NESTLEIND",
    "NSE:TATAMOTORS", "NSE:TITAN", "NSE:SUNPHARMA", "NSE:M&M", "NSE:NTPC",
    "NSE:POWERGRID", "NSE:ONGC", "NSE:TATASTEEL", "NSE:JSWSTEEL", "NSE:COALINDIA",
    "NSE:ADANIPORTS", "NSE:ADANIENT", "NSE:HDFCLIFE", "NSE:SBILIFE",
    "NSE:BAJAJFINSV", "NSE:BAJAJ-AUTO", "NSE:HEROMOTOCO", "NSE:EICHERMOT",
    "NSE:GRASIM", "NSE:CIPLA", "NSE:DRREDDY", "NSE:DIVISLAB", "NSE:APOLLOHOSP",
    "NSE:TECHM", "NSE:LTIM", "NSE:BRITANNIA", "NSE:TATACONSUM", "NSE:UPL",
    "NSE:BPCL", "NSE:INDUSINDBK", "NSE:HINDALCO",
]


# -----------------------------------------------------------------
# LARGECAP — AMFI top 100 (Jan 2026)
# (NIFTY 50 is a subset of this; we include the additional 50 here)
# -----------------------------------------------------------------
LARGECAP_EXTRA = [
    "NSE:DMART", "NSE:LICI", "NSE:DLF", "NSE:HAL", "NSE:VEDL",
    "NSE:VBL", "NSE:PIDILITIND", "NSE:GODREJCP", "NSE:BAJAJHLDNG",
    "NSE:SHREECEM", "NSE:SIEMENS", "NSE:AMBUJACEM", "NSE:ICICIPRULI",
    "NSE:DABUR", "NSE:HAVELLS", "NSE:CHOLAFIN", "NSE:BEL", "NSE:NAUKRI",
    "NSE:GAIL", "NSE:IOC", "NSE:TVSMOTOR", "NSE:MARICO", "NSE:CONCOR",
    "NSE:PFC", "NSE:RECLTD", "NSE:IRCTC", "NSE:JINDALSTEL", "NSE:TRENT",
    "NSE:ZOMATO", "NSE:NYKAA", "NSE:PAYTM", "NSE:POLICYBZR", "NSE:ABB",
    "NSE:ICICIGI", "NSE:SBICARD", "NSE:COLPAL", "NSE:BERGEPAINT",
    "NSE:TORNTPHARM", "NSE:MUTHOOTFIN", "NSE:CANBK", "NSE:BANKBARODA",
    "NSE:PNB", "NSE:UNIONBANK", "NSE:IDBI", "NSE:IDFCFIRSTB",
    "NSE:LUPIN", "NSE:BIOCON", "NSE:AUROPHARMA", "NSE:ZYDUSLIFE",
    "NSE:CUMMINSIND", "NSE:BOSCHLTD", "NSE:HDFCAMC", "NSE:POLYCAB",
    "NSE:TATAPOWER", "NSE:ADANIPOWER", "NSE:ADANIGREEN", "NSE:NHPC",
    "NSE:SBICARD",
]
LARGECAP = list(dict.fromkeys(NIFTY_50 + LARGECAP_EXTRA))  # dedupe, preserve order


# -----------------------------------------------------------------
# MIDCAP — AMFI ranks 101-250 (representative)
# -----------------------------------------------------------------
MIDCAP = [
    "NSE:PERSISTENT", "NSE:MPHASIS", "NSE:LTTS", "NSE:COFORGE", "NSE:OFSS",
    "NSE:KPITTECH", "NSE:TATAELXSI", "NSE:CYIENT", "NSE:HEXAWARE",
    "NSE:FEDERALBNK", "NSE:AUBANK", "NSE:RBLBANK", "NSE:YESBANK",
    "NSE:BANDHANBNK", "NSE:CITYUNIONBNK", "NSE:KARURVYSYA",
    "NSE:LICHSGFIN", "NSE:HUDCO", "NSE:BAJAJHFL", "NSE:CDSL", "NSE:BSE",
    "NSE:MCX", "NSE:ANGELONE", "NSE:CAMS", "NSE:KFINTECH",
    "NSE:VOLTAS", "NSE:DIXON", "NSE:CROMPTON", "NSE:WHIRLPOOL",
    "NSE:BLUESTARCO", "NSE:ASTRAL", "NSE:SUPREMEIND", "NSE:POLYMED",
    "NSE:APLLTD", "NSE:GLAND", "NSE:LAURUSLABS", "NSE:GLENMARK",
    "NSE:IPCALAB", "NSE:JBCHEPHARM", "NSE:NATCOPHARM",
    "NSE:GUJGASLTD", "NSE:IGL", "NSE:MGL", "NSE:PETRONET", "NSE:OIL",
    "NSE:HINDPETRO", "NSE:MRPL", "NSE:CASTROLIND",
    "NSE:JKCEMENT", "NSE:RAMCOCEM", "NSE:DALBHARAT", "NSE:ACC",
    "NSE:SAIL", "NSE:NMDC", "NSE:NATIONALUM", "NSE:HINDZINC",
    "NSE:RVNL", "NSE:IRCON", "NSE:RAILTEL", "NSE:MAZDOCK",
    "NSE:COCHINSHIP", "NSE:GRSE", "NSE:BDL", "NSE:BEML",
    "NSE:ASHOKLEY", "NSE:ESCORTS", "NSE:BHARATFORG", "NSE:MOTHERSON",
    "NSE:BALKRISIND", "NSE:CEATLTD", "NSE:APOLLOTYRE", "NSE:MRF",
    "NSE:JUBLFOOD", "NSE:DEVYANI", "NSE:WESTLIFE", "NSE:BARBEQUE",
    "NSE:RADICO", "NSE:UBL", "NSE:VARUN", "NSE:EMAMILTD",
    "NSE:ABFRL", "NSE:PAGEIND", "NSE:PIIND", "NSE:SRF",
    "NSE:DEEPAKNTR", "NSE:GUJALKALI", "NSE:NAVINFLUOR",
    "NSE:LINDEINDIA", "NSE:GMRINFRA", "NSE:GVKPIL", "NSE:IRB",
    "NSE:JSWENERGY", "NSE:TORNTPOWER", "NSE:CESC",
    "NSE:INDUSTOWER", "NSE:IDEA", "NSE:MTNL",
    "NSE:OBEROIRLTY", "NSE:GODREJPROP", "NSE:PRESTIGE", "NSE:LODHA",
    "NSE:BAJAJHFL", "NSE:CANFINHOME", "NSE:PEL",
    "NSE:UNITDSPR", "NSE:MANKIND", "NSE:SHREECEM", "NSE:HAVELLS",
    "NSE:INFOEDGE", "NSE:BAJAJHFL",
]


# -----------------------------------------------------------------
# SMALLCAP — AMFI ranks 251-500 (representative subset)
# -----------------------------------------------------------------
SMALLCAP = [
    "NSE:MAHABANK", "NSE:CENTRALBK", "NSE:UCOBANK", "NSE:IOB", "NSE:PSB",
    "NSE:JSBANK", "NSE:DCBBANK", "NSE:SOUTHBANK", "NSE:KTKBANK",
    "NSE:GICRE", "NSE:NIACL", "NSE:GENERALINSCO", "NSE:STARHEALTH",
    "NSE:INDIAMART", "NSE:JUSTDIAL", "NSE:NETWORK18", "NSE:TV18BRDCST",
    "NSE:SUNTV", "NSE:ZEEL", "NSE:PVRINOX", "NSE:DISHTV",
    "NSE:NIITLTD", "NSE:RTNINDIA", "NSE:MASTEK", "NSE:BIRLASOFT",
    "NSE:INTELLECT", "NSE:ROUTE", "NSE:HAPPSTMNDS", "NSE:NEWGEN",
    "NSE:RATEGAIN", "NSE:LATENTVIEW", "NSE:MAPMYINDIA",
    "NSE:CARTRADE", "NSE:EASEMYTRIP", "NSE:YATRA", "NSE:THOMASCOOK",
    "NSE:GREAVESCOT", "NSE:VESUVIUS", "NSE:GRINDWELL", "NSE:CARBORUNIV",
    "NSE:WHEELS", "NSE:JAMNAAUTO", "NSE:LUMAXIND", "NSE:GABRIEL",
    "NSE:RANEHOLDIN", "NSE:SUBROS", "NSE:SETCO",
    "NSE:JKLAKSHMI", "NSE:BIRLACORPN", "NSE:HEIDELBERG", "NSE:ORIENTCEM",
    "NSE:GRASIM", "NSE:CENTURYTEX",
    "NSE:JKPAPER", "NSE:WSTCSTPAPR", "NSE:TNPL", "NSE:ANDHRAPAP",
    "NSE:INDIAGLYCO", "NSE:GHCL", "NSE:NOCIL", "NSE:JUBLFOODS",
    "NSE:KSCL", "NSE:BAYERCROP", "NSE:RALLIS", "NSE:INSECTICID",
    "NSE:DHANUKA", "NSE:BHARATRAS", "NSE:UFLEX", "NSE:ESSELPACK",
    "NSE:COSMOFIRST", "NSE:JINDALPOLY",
    "NSE:VTL", "NSE:RSWM", "NSE:SUTLEJTEX", "NSE:WELSPUNIND",
    "NSE:TRIDENT", "NSE:VARDHACRLC", "NSE:KPRMILL", "NSE:ARVIND",
    "NSE:RAYMOND", "NSE:INDORAMA", "NSE:GOKEX",
    "NSE:HBLPOWER", "NSE:GENUSPOWER", "NSE:KEC", "NSE:KALPATPOWR",
    "NSE:KIRLOSENG", "NSE:THERMAX", "NSE:GMMPFAUDLR", "NSE:AIAENG",
    "NSE:ELGIEQUIP", "NSE:TIMKEN", "NSE:SKFINDIA",
    "NSE:JBMA", "NSE:TI", "NSE:RAMKY", "NSE:NCC", "NSE:HCC",
    "NSE:ASHOKA", "NSE:KNRCON", "NSE:PNCINFRA", "NSE:DBL",
    "NSE:ENGINERSIN", "NSE:HGINFRA", "NSE:PRAJIND", "NSE:KIRLOSBROS",
    "NSE:EXIDEIND", "NSE:AMARAJABAT",
    "NSE:CHENNPETRO", "NSE:GULFOILLUB", "NSE:CASTROLIND",
    "NSE:GUJGAS", "NSE:ATGL",
]


# -----------------------------------------------------------------
# MICROCAP — AMFI ranks 501+ (representative)
# Many of these are not actively traded; scanner self-prunes.
# -----------------------------------------------------------------
MICROCAP = [
    "NSE:JKTYRE", "NSE:GOODYEAR", "NSE:TIINDIA", "NSE:GREENPLY",
    "NSE:CENTURYPLY", "NSE:HSIL", "NSE:CERA", "NSE:KAJARIACER",
    "NSE:ORIENTBELL", "NSE:JKPAPER", "NSE:RUCHIRA", "NSE:WSTCSTPAPR",
    "NSE:BLUEDART", "NSE:TCIEXP", "NSE:GATI", "NSE:ALLCARGO",
    "NSE:SCI", "NSE:GESHIP", "NSE:GPPL", "NSE:JSWHL",
    "NSE:NAVNETEDUL", "NSE:ZEELEARN", "NSE:CAREER", "NSE:MTEDUCARE",
    "NSE:SPENCERS", "NSE:V2RETAIL", "NSE:SHOPERSTOP",
    "NSE:VMART", "NSE:VIPIND", "NSE:SAFARI", "NSE:RELAXO",
    "NSE:BATAINDIA", "NSE:CAMPUS", "NSE:METROPOLIS",
    "NSE:THYROCARE", "NSE:KIMS", "NSE:HCG", "NSE:NH",
    "NSE:RAINBOW", "NSE:JUBLPHARMA", "NSE:STAR", "NSE:GRANULES",
    "NSE:WOCKPHARMA", "NSE:STRIDES", "NSE:SUVEN",
    "NSE:CLEAN", "NSE:ROSSARI", "NSE:CHEMCON", "NSE:TATVA",
    "NSE:ANUPAMRAS", "NSE:AARTIIND", "NSE:VINATIORGA",
]


# -----------------------------------------------------------------
# Public API
# -----------------------------------------------------------------
UNIVERSES = {
    "nifty50":  NIFTY_50,
    "largecap": LARGECAP,
    "midcap":   MIDCAP,
    "smallcap": SMALLCAP,
    "microcap": MICROCAP,
}


def get_universe(name: str) -> list[str]:
    """Get a universe by name. Falls back to NIFTY_50 if unknown."""
    return UNIVERSES.get(name.lower().strip(), NIFTY_50)


def universe_size(name: str) -> int:
    return len(get_universe(name))


def all_universe_names() -> list[str]:
    return list(UNIVERSES.keys())
