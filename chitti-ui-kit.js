/**
 * CHITTI UI KIT v1.1
 * window.Chitti: Speech · SEBI · Colours · SR · Utils
 */
(function (global) {
  'use strict';

  const DISCLAIMER_EN = 'Not SEBI Registered. This is an educational tool only — not investment advice. Chitti shows direction, not a guarantee. Never invest money you cannot afford to lose.';
  const DISCLAIMER_HI = 'SEBI पंजीकृत नहीं। यह केवल शैक्षिक उपकरण है — निवेश सलाह नहीं। चिट्टी दिशा दिखाता है, गारंटी नहीं। वही पैसा लगाएं जो खो सकते हैं।';

  const Speech = {
    sp(text, lang='en'){if(!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang==='hi'?'hi-IN':'en-IN';u.rate=0.88;u.pitch=1.05;speechSynthesis.speak(u);},
    cancel(){if(window.speechSynthesis)speechSynthesis.cancel();},
    speakDisclaimer(lang){this.sp(lang==='hi'?DISCLAIMER_HI:DISCLAIMER_EN,lang||'en');}
  };

  function renderSEBIBanner(el){
    el.innerHTML=`<span>⚠️ <strong>Not SEBI Registered</strong> · Educational only · Not investment advice</span><button onclick="Chitti.Speech.speakDisclaimer()" aria-label="Hear disclaimer" style="background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.35);color:#fbbf24;border-radius:4px;padding:2px 10px;font-size:11px;cursor:pointer;font-family:inherit">🔊 Hear</button>`;
  }

  /* TF colour + line style — matches TradingView/Kite convention */
  const TF_STYLE = {
    Monthly: { color:'#f59e0b', width:2.5, dash:[],    label:'Mo',  srAlpha:.95, tlAlpha:.80 },
    Weekly:  { color:'#38bdf8', width:2,   dash:[],    label:'Wk',  srAlpha:.85, tlAlpha:.70 },
    Daily:   { color:'#4ade80', width:1.5, dash:[6,3], label:'D',   srAlpha:.75, tlAlpha:.60 },
    '4H':    { color:'#fb923c', width:1.5, dash:[5,3], label:'4H',  srAlpha:.65, tlAlpha:.52 },
    '1H':    { color:'#a78bfa', width:1,   dash:[3,3], label:'1H',  srAlpha:.58, tlAlpha:.44 },
    '15min': { color:'#f472b6', width:1,   dash:[2,3], label:'15m', srAlpha:.50, tlAlpha:.38 },
    '5min':  { color:'#2dd4bf', width:1,   dash:[2,3], label:'5m',  srAlpha:.44, tlAlpha:.32 },
    '1min':  { color:'#94a3b8', width:1,   dash:[2,3], label:'1m',  srAlpha:.38, tlAlpha:.28 },
  };
  const TF_ORDER = ['Monthly','Weekly','Daily','4H','1H','15min','5min','1min'];
  function visibleTFs(tf){ const i=TF_ORDER.indexOf(tf); return i<0?[tf]:TF_ORDER.slice(0,i+1); }

  /* S/R — pivot high/low, cluster within 0.3% */
  function computeSR(candles, n=5){
    if(!candles||candles.length<n*2+2)return{supports:[],resistances:[]};
    const ph=[],pl=[];
    for(let i=n;i<candles.length-n;i++){
      let isH=true,isL=true;
      for(let j=i-n;j<=i+n;j++){if(j===i)continue;if(candles[j].high>=candles[i].high)isH=false;if(candles[j].low<=candles[i].low)isL=false;}
      if(isH)ph.push(candles[i].high);if(isL)pl.push(candles[i].low);
    }
    function cluster(arr){const s=[...arr].sort((a,b)=>a-b),r=[];for(const v of s){if(!r.length||v>r[r.length-1]*1.003)r.push(v);else r[r.length-1]=(r[r.length-1]+v)/2;}return r.slice(-6);}
    return{supports:cluster(pl),resistances:cluster(ph)};
  }

  /**
   * TRENDLINES — wick-to-wick, returns time-based coordinates
   * for direct use with lightweight-charts setData().
   * Each line: { t1 (unix), p1 (price), t2 (unix), p2 (price) }
   */
  function computeTrendlines(candles){
    if(!candles||candles.length<14)return{upLines:[],downLines:[]};
    const n=3, pH=[], pL=[];
    for(let i=n;i<candles.length-n;i++){
      let isH=true,isL=true;
      for(let j=i-n;j<=i+n;j++){
        if(j===i)continue;
        if(candles[j].high>=candles[i].high)isH=false;
        if(candles[j].low<=candles[i].low)isL=false;
      }
      if(isH)pH.push({idx:i,price:candles[i].high,time:candles[i].time});
      if(isL)pL.push({idx:i,price:candles[i].low, time:candles[i].time});
    }

    function buildLines(pivots, type){
      const lines=[];
      for(let a=0;a<pivots.length-1;a++){
        for(let b=a+1;b<pivots.length;b++){
          const p1=pivots[a],p2=pivots[b];
          const slope=(p2.price-p1.price)/(p2.idx-p1.idx);
          let valid=true, touches=2;
          for(let k=p1.idx+1;k<p2.idx;k++){
            const proj=p1.price+slope*(k-p1.idx);
            // wick-to-wick: use high for resistance, low for support
            if(type==='res'&&candles[k].high>proj*1.003){valid=false;break;}
            if(type==='sup'&&candles[k].low<proj*0.997){valid=false;break;}
            // count additional touches (strengthens line)
            if(type==='res'&&Math.abs(candles[k].high-proj)/proj<0.002)touches++;
            if(type==='sup'&&Math.abs(candles[k].low-proj)/proj<0.002)touches++;
          }
          if(valid){
            // extend line to last candle
            const last=candles.length-1;
            const extPrice=p1.price+slope*(last-p1.idx);
            lines.push({
              t1:p1.time, p1:p1.price,
              t2:candles[last].time, p2:extPrice,
              strength:touches+(b-a)
            });
          }
        }
      }
      return lines.sort((a,b)=>b.strength-a.strength).slice(0,3);
    }
    return{
      upLines:  buildLines(pL,'sup'),
      downLines:buildLines(pH,'res'),
    };
  }

  const Utils={
    formatINR:n=>'₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}),
    formatPct:n=>(n>=0?'+':'')+Number(n).toFixed(2)+'%',
    hexAlpha(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgba(${r},${g},${b},${a})`;},
    shortVol(v){return v>=1e7?(v/1e7).toFixed(1)+'Cr':v>=1e5?(v/1e5).toFixed(1)+'L':v>=1000?(v/1000).toFixed(0)+'K':v.toFixed(0);}
  };

  global.Chitti={Speech,SEBI:{renderSEBIBanner,DISCLAIMER_EN,DISCLAIMER_HI},Colours:{TF_STYLE,TF_ORDER,visibleTFs},SR:{computeSR,computeTrendlines},Utils};
  console.log('[ChittiKit v1.1] ready');
})(window);
