/* gen_fashion_samples.mjs — writes REAL sample files to test_samples/fashion/ (committed,
   not placeholders). 5 categories × 5 = 25 files. Run once: node tools/gen_fashion_samples.mjs */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = resolve(ROOT, 'test_samples', 'fashion');
const dir = (d) => { const x = resolve(base, d); mkdirSync(x, { recursive: true }); return x; };
const J = (d, n, o) => writeFileSync(resolve(dir(d), n), JSON.stringify(o, null, 2));
const T = (d, n, s) => writeFileSync(resolve(dir(d), n), s);

// 1. wardrobe_sets — full wardrobes; buildOutfits must produce >=1 outfit
J('wardrobe_sets','office_capsule.json',{ expectOutfitsMin:2, items:[
  {id:'a1',category:'top',colour:'white',hex:'#FFFFFF',fabric:'cotton',occasions:['office']},
  {id:'a2',category:'top',colour:'navy',hex:'#1A3A6B',fabric:'cotton',occasions:['office']},
  {id:'a3',category:'bottom',colour:'beige',hex:'#D9C7A0',fabric:'cotton',occasions:['office']},
  {id:'a4',category:'footwear',colour:'brown',hex:'#5A3A20',occasions:['office']}]});
J('wardrobe_sets','festive_family.json',{ expectOutfitsMin:1, items:[
  {id:'b1',category:'outfit',colour:'maroon',hex:'#800000',desc:'silk saree',fabric:'silk',occasions:['festive']},
  {id:'b2',category:'jewellery',colour:'gold',hex:'#D4AF37'},
  {id:'b3',category:'footwear',colour:'gold',hex:'#D4AF37',desc:'jutti'}]});
J('wardrobe_sets','casual_student.json',{ expectOutfitsMin:1, items:[
  {id:'c1',category:'top',colour:'blue',hex:'#2A6FB0',desc:'t-shirt',fabric:'cotton',occasions:['casual']},
  {id:'c2',category:'bottom',colour:'blue',hex:'#2A4B7C',desc:'jeans',fabric:'denim',occasions:['casual']},
  {id:'c3',category:'footwear',colour:'white',hex:'#FFFFFF',desc:'sneakers'}]});
J('wardrobe_sets','minimal_two.json',{ expectOutfitsMin:1, items:[
  {id:'d1',category:'top',colour:'grey',hex:'#808080',occasions:['casual']},
  {id:'d2',category:'bottom',colour:'black',hex:'#111111',occasions:['casual']}]});
J('wardrobe_sets','mixed_brights.json',{ expectOutfitsMin:1, items:[
  {id:'e1',category:'top',colour:'red',hex:'#C0392B',occasions:['casual']},
  {id:'e2',category:'top',colour:'white',hex:'#FFFFFF',occasions:['casual']},
  {id:'e3',category:'bottom',colour:'navy',hex:'#1A3A6B',occasions:['casual']},
  {id:'e4',category:'footwear',colour:'white',hex:'#FFFFFF'}]});

// 2. outfit_reviews — free-text outfits; classify + harmony must run
T('outfit_reviews','interview.txt','navy blazer, white shirt, grey trousers, black oxfords');
T('outfit_reviews','wedding.txt','maroon silk saree, gold jhumka, gold heels');
T('outfit_reviews','clash.txt','red shirt, green trousers, yellow shoes');
T('outfit_reviews','casual.txt','blue t-shirt, blue jeans, white sneakers');
T('outfit_reviews','funeral.txt','white kurta, white pyjama, brown sandals');

// 3. occasions — classify within expected band
J('occasions','sherwani.json',{ expectOccasion:'wedding', items:[{category:'outfit',colour:'cream',desc:'sherwani'}] });
J('occasions','office.json',{ expectBandMin:2.2, items:[{category:'top',desc:'blazer'},{category:'bottom',desc:'trousers'},{category:'footwear',desc:'loafers'}] });
J('occasions','gym.json',{ expectOccasion:'casual', items:[{category:'top',desc:'gym tee'},{category:'bottom',desc:'track pants'},{category:'footwear',desc:'sneakers'}] });
J('occasions','saree_festive.json',{ expectOneOf:['festive','wedding'], items:[{category:'outfit',desc:'silk saree'},{category:'jewellery',desc:'jhumka'}] });
J('occasions','college.json',{ expectBandMax:2.0, items:[{category:'top',desc:'kurti'},{category:'bottom',desc:'jeans'}] });

// 4. colours — analyseColour undertone
J('colours','navy.json',{ hex:'#1A3A6B', name:'navy', expectUndertone:'cool' });
J('colours','mustard.json',{ hex:'#D4A017', name:'mustard', expectUndertone:'warm' });
J('colours','maroon.json',{ hex:'#800000', name:'maroon', expectUndertone:'warm' });
J('colours','teal.json',{ hex:'#0B6E6E', name:'teal', expectUndertone:'cool' });
J('colours','charcoal.json',{ hex:'#36454F', name:'charcoal', expectValue:'dark' });

// 5. repairs — diagnoseRepair
J('repairs','button.json',{ damage:'button_missing', expectDIY:true, expectDifficulty:'easy' });
J('repairs','zip.json',{ damage:'zip_broken', expectDIY:false, expectTailor:true });
J('repairs','hem.json',{ damage:'hem_loose', expectDIY:true, expectDifficulty:'easy' });
J('repairs','tear.json',{ damage:'tear_small', expectDIY:true });
J('repairs','stain.json',{ damage:'stain_oil', expectDIY:true, expectDifficulty:'easy' });

console.log('SAMPLES_GENERATED: 25 files across 5 categories under test_samples/fashion/');
