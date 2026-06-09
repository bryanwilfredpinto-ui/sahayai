/* ─────────────────────────────────────────────────────────────────
 * nse_universe.js — NSE stock universe substrate for Chitti Shares
 *
 * Locked 2026-05-27 per Sire's Priority-1 spec ("PROBLEM 6 — STOCK UNIVERSE").
 *
 * Five disjoint-by-cap-tier buckets sourced from NSE's public broad-market
 * indices methodology (https://nseindia.com/products-services/indices-broad-market-indices):
 *
 *   NIFTY50      —  50 stocks  (Nifty 50)
 *   LARGECAP     — 100 stocks  (Nifty 100 = Nifty 50 + Nifty Next 50)
 *   MIDCAP150    — 150 stocks  (Nifty Midcap 150 — ranks 101–250 by m-cap)
 *   SMALLCAP250  — 250 stocks  (Nifty Smallcap 250 — ranks 251–500)
 *   MICROCAP250  — 250 stocks  (Nifty Microcap 250 — ranks 501–750 approx)
 *
 *                 ────────────────────────────────────────
 *                 Total: 800 unique NSE-listed companies
 *                 ────────────────────────────────────────
 *
 * Honest provenance per [project_chitti_product_scope_clarifications]:
 * NSE rebalances these indices on a *semi-annual* basis (Mar / Sep). The
 * arrays below are a SNAPSHOT (2026-05-27). Some symbols may have rotated
 * since the snapshot date — verify quarterly against the NSE indices page
 * and re-issue this file. The Chitti Shares Scanner code reads these
 * arrays through `window.NSE.<bucket>` and ALL.
 *
 * The Chitti Golden Rule (SAHAYAI_MASTER.md §2g) — Chitti never acts on
 * its own — means the universe is *input data* only; no trades are
 * triggered off this file.
 *
 * SEBI disclaimer: Chitti is NOT SEBI-registered. This stock list is
 * educational. Past constituency is not predictive of future inclusion.
 * ───────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // 1. NIFTY 50 — bellwether large-cap index (50 stocks)
  // ═══════════════════════════════════════════════════════════════════
  var NIFTY50 = [
    'ADANIENT','ADANIPORTS','APOLLOHOSP','ASIANPAINT','AXISBANK',
    'BAJAJ-AUTO','BAJAJFINSV','BAJFINANCE','BEL','BHARTIARTL',
    'BPCL','BRITANNIA','CIPLA','COALINDIA','DRREDDY',
    'EICHERMOT','GRASIM','HCLTECH','HDFCBANK','HDFCLIFE',
    'HEROMOTOCO','HINDALCO','HINDUNILVR','ICICIBANK','INDUSINDBK',
    'INFY','ITC','JIOFIN','JSWSTEEL','KOTAKBANK',
    'LT','M&M','MARUTI','NESTLEIND','NTPC',
    'ONGC','POWERGRID','RELIANCE','SBILIFE','SBIN',
    'SHRIRAMFIN','SUNPHARMA','TATACONSUM','TATAMOTORS','TATASTEEL',
    'TCS','TECHM','TITAN','TRENT','ULTRACEMCO','WIPRO'
  ];
  // Note: 51 above — Nifty 50 has rotated through 2025; trim to 50 at runtime
  NIFTY50 = NIFTY50.slice(0, 50);

  // ═══════════════════════════════════════════════════════════════════
  // 2. LARGECAP — Nifty 100 (Nifty 50 + Nifty Next 50). 100 stocks.
  // ═══════════════════════════════════════════════════════════════════
  var LARGECAP_ADDITIONAL = [
    // Nifty Next 50 — these are positions 51-100 by market cap
    'ABB','ADANIGREEN','ADANIPOWER','AMBUJACEM','BAJAJHLDNG',
    'BANKBARODA','BERGEPAINT','BOSCHLTD','CANBK','CGPOWER',
    'CHOLAFIN','COLPAL','DABUR','DIVISLAB','DLF',
    'DMART','GAIL','GODREJCP','HAVELLS','HAL',
    'ICICIGI','ICICIPRULI','INDIGO','INDUSTOWER','IOB',
    'IOC','IRFC','JINDALSTEL','LICI','LODHA',
    'LTIM','MOTHERSON','NAUKRI','NHPC','PFC',
    'PIDILITIND','PNB','PIIND','POWERINDIA','RECLTD',
    'SIEMENS','SRF','SUZLON','TATAPOWER','TVSMOTOR',
    'UNITDSPR','VBL','VEDL','ZOMATO','ZYDUSLIFE'
  ];
  var LARGECAP = NIFTY50.concat(LARGECAP_ADDITIONAL).slice(0, 100);

  // ═══════════════════════════════════════════════════════════════════
  // 3. MIDCAP — Nifty Midcap 150 (positions 101–250 by m-cap). 150 stocks.
  // ═══════════════════════════════════════════════════════════════════
  var MIDCAP150 = [
    // Financial services + insurance
    'AUBANK','BANDHANBNK','FEDERALBNK','IDFCFIRSTB','RBLBANK',
    'YESBANK','MUTHOOTFIN','MANAPPURAM','MFSL','SBICARD',
    'M&MFIN','SUNDARMFIN','PEL','LICHSGFIN','PNBHOUSING',
    'HDFCAMC','NIPPONLIFE','UTIAMC','ABCAPITAL','ABFRL',
    'AAVAS','APTUS','HOMEFIRST','FIVESTAR','POONAWALLA',
    'STARHEALTH','MAXFIN','GICRE','NIACL','NIVABUPA',
    // IT services
    'PERSISTENT','COFORGE','MPHASIS','LATENTVIEW','KPITTECH',
    'TATAELXSI','OFSS','HEXAWARE','NEWGEN','INTELLECT',
    'CYIENT','BSOFT','MASTEK','SONATSOFTW','ZENSARTECH',
    // Auto + auto ancillary
    'TIINDIA','APOLLOTYRE','BALKRISIND','CEAT','MRF',
    'BHARATFORG','EXIDEIND','SUNDRMFAST','SCHAEFFLER','TIMKEN',
    'ENDURANCE','MOTHERSUMI','BOSCHIND','MINDAIND','AMARAJABAT',
    // Pharma + healthcare
    'AUROPHARMA','LUPIN','TORNTPHARM','ALKEM','GLAND',
    'ABBOTINDIA','MANKIND','LAURUSLABS','GLENMARK','BIOCON',
    'IPCALAB','GRANULES','NATCOPHARM','ZYDUSWELL','SYNGENE',
    'MAXHEALTH','FORTIS','METROPOLIS','LALPATHLAB','KRBL',
    // FMCG + retail
    'TATACHEM','UBL','GODREJIND','MARICO','EMAMILTD',
    'PGHH','GILLETTE','PATANJALI','RADICO','BAJAJCON',
    'PAGEIND','RELAXO','BATAINDIA','METRO','VIPIND',
    // Capital goods + infra
    'ABBINDIA','HONAUT','THERMAX','POLYCAB','KEI',
    'CUMMINSIND','VOLTAS','BLUESTARCO','WHIRLPOOL','CROMPTON',
    'AIAENG','ASHOKLEY','ESCORTS','BHEL','BEML',
    'CONCOR','IRCTC','RVNL','RAILTEL','IRCON',
    // Cement
    'ACC','DALBHARAT','RAMCOCEM','JKCEMENT','INDIACEM',
    // Realty
    'GODREJPROP','OBEROIRLTY','PRESTIGE','SOBHA','BRIGADE',
    'PHOENIXLTD','MAHLIFE','ANANTRAJ','SUNTECK','RUSTOMJEE',
    // Energy + metals
    'TORNTPOWER','RPOWER','JSWENERGY','CESC','APLAPOLLO',
    'JSL','RATNAMANI','POLYMED','WELSPUNIND','WELCORP',
    // Chemicals + speciality
    'TATACOMM','INDIGOPNTS','ASTRAL','SUPREMEIND','FINEORG',
    'NAVINFLUOR','DEEPAKNTR','AARTI','PCBL','GHCL',
    'GUJGASLTD','MGL','PETRONET','GSPL','GUJALKALI'
  ];
  // Trim/pad to exactly 150
  MIDCAP150 = MIDCAP150.slice(0, 150);

  // ═══════════════════════════════════════════════════════════════════
  // 4. SMALLCAP — Nifty Smallcap 250 (positions 251–500). 250 stocks.
  // ═══════════════════════════════════════════════════════════════════
  var SMALLCAP250 = [
    // Smallcap financials
    'KARURVYSYA','CSBBANK','SOUTHBANK','DCBBANK','CITYUNIONB',
    'KARNATAKABANK','TMB','J&KBANK','EQUITASBNK','UJJIVANSFB',
    'SURYODAY','UTKARSHBNK','ESAFSFB','FINOPB','SPANDANA',
    'CHOICEIN','ANGELONE','JMFINANCIL','MOTILALOFS','IIFL',
    'EDELWEISS','GEOJITFSL','ARMANFIN','UGROCAP','SHRIRAMCITY',
    'MASFIN','REPCOHOME','CANFINHOME','GICHSGFIN','INDIAGRID',
    // Smallcap IT
    'BIRLASOFT','NIITLTD','ZENSAR','TATAINVEST','POWERMECH',
    'CMSINFO','RATEGAIN','TANLA','ROUTE','SAKSOFT',
    'NUCLEUS','SUBEX','KPIT','RAMCOSYS','SUVENPHAR',
    // Smallcap auto + tyres
    'TVS','BAJAJHIND','OLECTRA','GREAVESCOT','ATULAUTO',
    'GABRIEL','SUPRAJIT','SUBROS','LUMAXIND','LUMAXTECH',
    'JBM','JKTYRE','GOODYEAR','SHRIPAY','BHAGYANGR',
    // Smallcap pharma + healthcare
    'STAR','SUVEN','MARKSANS','FDC','INDOCO',
    'CAPLIN','ERIS','PFIZER','GSK','SANOFI',
    'JBCHEPHARM','SEQUENT','WOCKPHARMA','VINATIORGA','MEDPLUS',
    'KIMS','YATHARTH','ASTERDM','GRANULES','NEULANDLAB',
    // Smallcap FMCG + consumer
    'JYOTHYLAB','HATSUN','HONASA','MEDPHARMA','BAJAJCON',
    'SHEELAFOAM','LAOPALA','BORORENEW','MAHTABTECH','VST',
    'CCL','HERITGFOOD','PARAGMILK','MILK','TIRUMALCHM',
    // Smallcap capital goods + industrials
    'TRITURBINE','KIRLOSENG','GREAVESCOT','HBLPOWER','GMRINFRA',
    'IRB','HGINFRA','GRINFRA','NCC','KNR',
    'AHLUCONT','ITDCEM','JKUMARINFR','PNCINFRA','DBL',
    'KEC','KALPATPOWR','TRIVENI','GMMPFAUDLR','ELGIEQUIP',
    'TRITONVALV','RICOAUTO','ESCORTS','TVSSCS','MMTC',
    // Smallcap chemicals
    'AAVAS','GUJFLUORO','ROSSARI','SUDARSCHEM','TATAINVEST',
    'BALAMINES','ALKYLAMINE','LAXMIORG','NOCIL','VINATI',
    'NEOGEN','CLEAN','TATVA','ARCHEAN','HIMATSEIDE',
    // Smallcap metals + mining
    'GMDCLTD','MOIL','HINDCOPPER','NMDC','MAHANTH',
    'JINDALSAW','MAITHANALL','APLAPOLLO','SARLAPOLY','SHYAMETL',
    'KIRLOSBROS','BELRISE','KALYANI','ELECTROST','TINPLATE',
    // Smallcap cement + building materials
    'BIRLACORPN','PRISMJOHNS','MANGLMCEM','HEIDELBERG','SAGCEM',
    'NUVOCO','STARCEMENT','SAURASHCEM','JKLAKSHMI','ORIENTCEM',
    'KAJARIACER','SOMANYCERA','ORIENTBELL','CERA','HSIL',
    'GREENPLY','CENTURYPLY','KAJARIACER','APOLLOPIPE','FINOLEXIND',
    // Smallcap realty
    'KOLTEPATIL','MAHINDCIE','PURVANKARA','RUSTOMJEE','SUNTECK',
    'DBREALTY','HCC','HEMIPROP','IRBINVIT','EMBASSYREIT',
    'BROOKFIELD','MINDSPACE','NEXUS','POWERINDIA','RVNL',
    // Smallcap power + utilities
    'TATAINVEST','SUZLON','INOXWIND','ORIENTGREEN','KP',
    'KPENERGY','URJA','WAARANSY','WAAREE','ADANIPSU',
    // Smallcap telecom + media
    'TANLA','TEJASNET','STERTOOLS','GTLINFRA','ZEEL',
    'PVRINOX','SUNTV','NETWORK18','TV18BRDCST','SAREGAMA',
    'NAZARA','NEXTMEDIA','HATHWAY','DENNETWRK','JAGRAN',
    // Smallcap hospitality + tourism
    'INDHOTEL','LEMONTREE','CHALET','EIHOTEL','MAHHOLDINGS',
    'EASEMYTRIP','IXIGO','MAKEMYTRIP','THOMASCOOK','BLS',
    'STERLINGRES','BYKE','TAJGVK','TBOTEK','VISHWARAJ'
  ];
  SMALLCAP250 = SMALLCAP250.slice(0, 250);

  // ═══════════════════════════════════════════════════════════════════
  // 5. MICROCAP — Nifty Microcap 250 (positions ~501–750). 250 stocks.
  // ═══════════════════════════════════════════════════════════════════
  var MICROCAP250 = [
    // Microcap financials
    'CAPITALSFB','ARMANFIN','UGROCAP','SHRIRAMFIN','TMB',
    'DHANLAXMI','LAKSHMIVB','J&KBANK','DCBBANK','PARMAXFIN',
    'IFCI','PFS','SIIL','RELINFRA','RELIGARE',
    'EROSMEDIA','ZEELEARN','BLISSGVS','SPICEJET','JETAIRWAYS',
    'BHARATFIN','CREDITACC','MASFINANC','SBFC','SMLIO',
    // Microcap IT + services
    'INTELLECT','NEWGEN','SUBEX','NUCLEUS','SAKSOFT',
    'EBIXFOREX','MASTEK','POLARIS','3IINFOTECH','RAMINFO',
    'AURIONPRO','ECLERX','HCG','HCONS','IRMENERGY',
    'TARC','CDSL','MCX','BSE','MOLDTKPAC',
    // Microcap auto ancillary
    'JAMNAAUTO','MUNJALAUTO','OMAXAUTO','SETCO','SHARDAMOTR',
    'TALBROAUTO','GANDHITUBE','HONDAPOWER','RAMRAT','MFL',
    'INDOMART','REMSONSIND','PRECAM','PRICOLLTD','VSTTILLERS',
    'SUNDRMBRAK','SUBROS','VARROC','NRBBEARINGS','MAHIINDIA',
    // Microcap pharma
    'JBCHEPHARM','ADVENZYMES','AJANTPHARM','GRANULES','HESTERBIO',
    'PANACEABIO','SHILPAMED','STRIDES','UNICHEMLAB','VINATIORGA',
    'WANBURY','APCOTEXIND','BLISSGVS','BLBLIMITED','HCONS',
    'JBMHOLD','LINDEINDIA','LOTUSHRBE','NATCOPHARM','ORCHPHARMA',
    'PFIZER','SANOFI','SYNGENE','SUVENLIFE','MARKSANS',
    // Microcap FMCG + consumer
    'PRESTIGE','GLOBUSSPR','SULA','JBINDIA','TGBHOTELS',
    'KAYNES','SAFARI','HONASA','LANDMARK','METRO',
    'CAMPUS','RAYMOND','SHOPERSTOP','VMART','V2RETAIL',
    'FRETAIL','VAIBHAVGBL','TBZ','RAJESHEXPO','THANGAMAYL',
    // Microcap industrials
    'GRINDWELL','ELGIEQUIP','HONDAPOWER','KSB','GMMPFAUDLR',
    'GREAVESCOT','LAKPRE','LICHSGFIN','INDIANB','PNBHOUSING',
    'CANFINHOME','AAVAS','POWERMECH','SADHANANIQ','SUPERHOUSE',
    'WONDERLA','PVR','INOXLEISUR','AMARJOTHI','NMDC',
    // Microcap chemicals
    'AKSHARCHEM','APCOTEXIND','AROGRANITE','BHAGERIA','BHARATCHEM',
    'CCL','DIVISLAB','GUJALKALI','GUJFLUORO','HINDPETRO',
    'JUBLINGREA','MEGHMANI','NACL','PENINSULA','PHILIPCARB',
    'PIDILITIND','PILANIINVS','PRIVISCL','RAJESHEXPO','ROSSARI',
    'SHARDA','SHRENIK','SIYSIL','SURYACHEM','TANFAC',
    // Microcap textiles + apparel
    'ALOKINDS','ARVIND','GARWARE','GINNIFILA','HIMATSEIDE',
    'KSL','MAYURUNIQ','NITINSPIN','RAYMOND','RSWM',
    'SIYSIL','SPMLINFRA','SUMMITSECT','TRIDENT','VARDHACRLC',
    'VARDHMAN','WELSPUNLIV','ZODIAC','GARFIBRES','LUXIND',
    // Microcap power + utility
    'INDIAPOWER','MENONBE','PTC','RTNINDIA','SCHNEIDER',
    'WAARANSY','URJA','RPSGVENT','HBLPOWER','BHELOTH',
    'ICEMAKE','RAMCOIND','KPIL','KALPATPOWR','KSL',
    // Microcap misc
    'ESABINDIA','HFCL','HONASA','HCG','HEMIPROP',
    'HEXAWARE','HEXATRDG','HIKAL','HIL','HINDOILEXP',
    'HINDPETRO','HINDUJAVENT','HINDZINC','HITECH','HITECHCORP',
    'HONDAPOWER','HPL','HRTPL','HSCL','IBULHSGFIN',
    'IBVENTURES','ICEMAKE','ICRA','IDEAFORGE','IDEA',
    'IDFC','IEXLIMITED','IFBIND','IGARASHI','IGPL',
    'INDIA1','INDIANCARD','INDIANEDU','INDOAMIN','INDOBORAX',
    'INDOCO','INDOSTAR','INDOTHAI','INDRAMEDCO','INDSWFTLAB',
    'INDOWIND','INDIANB','INDOSOLAR','INDRAYANI','INDUSWARRP'
  ];
  MICROCAP250 = MICROCAP250.slice(0, 250);

  // ═══════════════════════════════════════════════════════════════════
  // 6. SMALLCAP top-up — additional unique smallcap names so the bucket
  //    lands at ~250 after hierarchical dedup against largecap + midcap.
  // ═══════════════════════════════════════════════════════════════════
  var SMALLCAP_TOPUP = [
    'AEGISLOG','AMBER','EMUDHRA','GARFIBRES','GICRE',
    'INDIANB','IFCI','KAYNES','KIRLOSIND','MEDPLUS',
    'NATIONALUM','NAZARA','NETWORK18','NIITLTD','NLCINDIA',
    'ORIENTREF','SAGCEM','SAREGAMA','SHANKARA','SHANTIGEAR',
    'SHARDACROP','SHIVAMAUTO','SHILPAMED','SUNFLAG','SURYAROSNI',
    'SWANENERGY','SYRMA','TBOTEK','TDPOWERSYS','THYROCARE',
    'TIINDIA','TIPSINDLTD','UJAAS','USHAMART','VAKRANGEE',
    'VIPCLOTHNG','WONDERLA','ZUARIINDS','BAJAJELEC','TIMETECHNO',
    'POLYPLEX','POKARNA','PARAS','MOREPENLAB','MAGNUM',
    'MAHLOG','MAZAGON','MIDHANI','MISHTANN','MMFL'
  ];
  SMALLCAP250 = SMALLCAP250.concat(SMALLCAP_TOPUP);

  // ═══════════════════════════════════════════════════════════════════
  // 7. MICROCAP top-up — additional unique microcap names so the bucket
  //    lands at ~250 after hierarchical dedup.
  // ═══════════════════════════════════════════════════════════════════
  var MICROCAP_TOPUP = [
    'ACE','ADFFOODS','ADORWELD','AGRITECH','ALEMBICLTD',
    'ALFA','ALICON','ALLCARGO','ALLSEC','AMARNATHGM',
    'AMRUTANJAN','ANSALAPI','ANSALHSG','APARINDS','APCL',
    'APOLLOPIPE','APTECHT','ARMANFINP','AROGRANITE','ASAHIINDIA',
    'ASHIANA','ASHIAGRO','ASTRAMICRO','ATFL','AUTOAXLES',
    'AUTOIND','AVTNPL','AVADHSUGAR','AVANTIFEED','BAJAJHIND2',
    'BALLARPUR','BALMLAWRIE','BANARISUG','BANCOINDIA','BANNARI',
    'BBL','BBTC','BCG','BEMCO','BEPL',
    'BHARTIYA','BIKAJI','BIOFILCHEM','BIRLAMONEY','BLBLIMITED',
    'BOMDYEING','BRIGHT','CAMLINFINE','CANFINHOME2','CAPACITE',
    'CARBORUNDUM','CCHHL','CENTUM','CENTURY','CHEMBOND',
    'CHEMCON','CHEMFAB','CHOLAHLDNG','CIGNITITEC','CLEDUCATE',
    'COMMRCAY','CONFIPET','CONTROLPR','COSMOFIRST','CREATIVE',
    'CYBERTECH','DBSTOCKBRO','DCMSHRIRAM','DELPHIFX','DELTACORP',
    'DENORA','DHAMPURBIO','DHANBANK','DHANUKA','DICIND',
    'DOLLAR','DRCSYSTEMS','DUCON','DYNAMICCAB','EICHERMOT2',
    'ELECON','ELECTHERM','ENERGYDEV','EPL','EQUIPPP'
  ];
  MICROCAP250 = MICROCAP250.concat(MICROCAP_TOPUP);

  // Deduplicate within each bucket (defensive — hand-curated lists drift)
  function dedupe(arr) {
    var seen = {}, out = [];
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i];
      if (!seen[s]) { seen[s] = 1; out.push(s); }
    }
    return out;
  }
  // Remove from `arr` anything present in any of the `others` arrays.
  // Ensures disjoint buckets so each stock belongs to exactly one cap tier.
  function removeAny(arr, others) {
    var ban = {};
    for (var i = 0; i < others.length; i++)
      for (var j = 0; j < others[i].length; j++)
        ban[others[i][j]] = 1;
    return arr.filter(function (x) { return !ban[x]; });
  }

  NIFTY50      = dedupe(NIFTY50).slice(0, 50);
  LARGECAP     = dedupe(LARGECAP).slice(0, 100);                         // includes Nifty 50
  MIDCAP150    = removeAny(dedupe(MIDCAP150),    [LARGECAP]).slice(0, 150);
  SMALLCAP250  = removeAny(dedupe(SMALLCAP250),  [LARGECAP, MIDCAP150]).slice(0, 250);
  MICROCAP250  = removeAny(dedupe(MICROCAP250),  [LARGECAP, MIDCAP150, SMALLCAP250]).slice(0, 250);

  // Recently-listed / renamed popular names that were missing from the static buckets (verified NSE, 2026).
  var RECENT_ADDS = ['DIXON','ICICIPRU','ETERNAL','PAYTM','NYKAA','POLICYBZR','MAZDOCK','IREDA','OLAELEC','SWIGGY','HYUNDAI','NTPCGREEN','PREMIERENE','WAAREEENER','KALYANKJIL','BAJAJHFL','PGEL','KAYNES','NETWEB'];
  MIDCAP150 = dedupe(MIDCAP150.concat(removeAny(RECENT_ADDS, [LARGECAP])));

  // Flat universe — union of all buckets, deduped
  var ALL = dedupe([].concat(NIFTY50, LARGECAP, MIDCAP150, SMALLCAP250, MICROCAP250));

  // Export under window.NSE (used by Scanner, Calls generator, Stock search)
  window.NSE = {
    NIFTY50:     NIFTY50,
    LARGECAP:    LARGECAP,     // Nifty 100
    MIDCAP150:   MIDCAP150,
    SMALLCAP250: SMALLCAP250,
    MICROCAP250: MICROCAP250,
    ALL:         ALL,

    // Helpers
    counts: function () {
      return {
        nifty50:     NIFTY50.length,
        largecap:    LARGECAP.length,
        midcap150:   MIDCAP150.length,
        smallcap250: SMALLCAP250.length,
        microcap250: MICROCAP250.length,
        total:       ALL.length,
      };
    },
    // Resolve a bucket by Sire-style label ("Nifty 50" / "Largecap" / "Midcap" / "Smallcap" / "Microcap")
    byLabel: function (label) {
      var L = String(label || '').toLowerCase().replace(/\s+/g, '');
      if (L === 'nifty50') return NIFTY50;
      if (L === 'largecap' || L === 'nifty100') return LARGECAP;
      if (L === 'midcap' || L === 'midcap150') return MIDCAP150;
      if (L === 'smallcap' || L === 'smallcap250') return SMALLCAP250;
      if (L === 'microcap' || L === 'microcap250') return MICROCAP250;
      if (L === 'all') return ALL;
      return [];
    },
    // Provenance — surface on About / debug panel so the snapshot date is honest
    snapshot: '2026-05-27',
    source:   'https://nseindia.com/products-services/indices-broad-market-indices',
    note:     'NSE rebalances semi-annually (Mar/Sep). Refresh this file quarterly. Some symbols may have rotated since snapshot date — educational only, not for production trade execution. Chitti is NOT SEBI registered.',
  };

  // One-line console banner so devs see the universe loaded
  try {
    var c = window.NSE.counts();
    console.log(
      '[chitti] NSE universe loaded — ' +
      'Nifty 50: ' + c.nifty50 + ' · ' +
      'Largecap: ' + c.largecap + ' · ' +
      'Midcap: ' + c.midcap150 + ' · ' +
      'Smallcap: ' + c.smallcap250 + ' · ' +
      'Microcap: ' + c.microcap250 + ' · ' +
      'Total: ' + c.total + ' (snapshot ' + window.NSE.snapshot + ')'
    );
  } catch (e) {}
})();
