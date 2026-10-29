(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const add=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const diff=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const dowOf=s=>parse(s).getDay();
const toMin=t=>{const[h,m]=t.split(':').map(Number);return h*60+m};
const fromMin=m=>pad(Math.floor(m/60)%24)+':'+pad(m%60);
const NOW=new Date();const TD=iso(NOW);const NOWT=pad(NOW.getHours())+':'+pad(NOW.getMinutes());
const uid=()=>'x'+Math.random().toString(36).slice(2,9);
const r2=n=>Math.round(n*100)/100;
const KEY='retorno-hub-v5', PKEY='retorno-hub-prefs';
let SAMPLE=null,DL=null;

const S={lang:'he',role:'manager',view:'dashboard',date:TD,pid:null,ptab:'overview',mine:null,arch:false,showTr:{},tlf:'all',sumId:null,ftab:'',rtab:'month',month:'',calc:null};S.month=TD.slice(0,7);
try{const p=JSON.parse(localStorage.getItem(PKEY)||'{}');['lang','role','view'].forEach(k=>{if(p[k])S[k]=p[k]})}catch(e){}
const _=(he,en)=>S.lang==='he'?he:en;
const nm=o=>o==null?'':(typeof o==='object'?(o[S.lang]??o.en??o.he):o);
const money=n=>{n=r2(n);const a=Math.abs(n);return(n<0?'−':'')+'₪'+a.toLocaleString('en-US',{minimumFractionDigits:a%1?2:0,maximumFractionDigits:2})};
const fmtDate=(s,o)=>parse(s).toLocaleDateString(S.lang==='he'?'he-IL':'en-GB',o||{day:'numeric',month:'short'});
const isHe=t=>/[֐-׿]/.test(t);

const STAGES=[{id:'gozal',he:'גוזל',en:'Gozal'},{id:'aleph',he:'שלב א׳',en:'Aleph'},{id:'bet',he:'שלב ב׳',en:'Bet'},{id:'gimel',he:'שלב ג׳',en:'Gimel'}];
const ROLES={manager:{he:'מנהל',en:'Manager'},counselor:{he:'מדריך',en:'Counselor'},therapist:{he:'מטפלת',en:'Therapist'},admissions:{he:'קליטה',en:'Admissions'},instructor:{he:'מנחה חיצוני',en:'External instructor'}};
const AS={manager:'ariel',counselor:'noa',therapist:'orit',admissions:'dvora'};
const TYPES={routine:{he:'שגרה',en:'Routine'},group:{he:'קבוצה',en:'Group'},individual:{he:'פרטני',en:'Individual'},activity:{he:'פעילות',en:'Activity'},appointment:{he:'תור',en:'Appointment'},transport:{he:'הסעה',en:'Transport'}};
const PERM={
 manager:{views:['dashboard','approvals','messages','roster','tasks','schedule','patients','summary','finance','staff','leads','reports'],clinical:true,daily:true,finance:true,incidents:true},
 counselor:{views:['dashboard','messages','tasks','roster','schedule','patients','summary','finance','staff'],clinical:false,daily:true,finance:true,incidents:true},
 therapist:{views:['dashboard','messages','schedule','patients'],clinical:true,daily:true,finance:false,incidents:true},
 admissions:{views:['leads','messages','schedule'],clinical:false,daily:false,finance:false,incidents:false}};
const VIEWS={dashboard:{he:'בית',en:'Home',i:'grid'},approvals:{he:'אישורים',en:'Approvals',i:'check'},tasks:{he:'משימות',en:'Tasks',i:'list'},messages:{he:'הודעות',en:'Messages',i:'bell'},roster:{he:'משמרות',en:'Roster',i:'clock'},schedule:{he:'לו״ז',en:'Schedule',i:'cal'},patients:{he:'מטופלים',en:'Patients',i:'users'},summary:{he:'סיכום יום',en:'Daily summary',i:'pen'},finance:{he:'כספים',en:'Finance',i:'wallet'},staff:{he:'צוות',en:'Staff',i:'badge'},leads:{he:'פניות',en:'Leads',i:'funnel'},reports:{he:'דוחות',en:'Reports',i:'chart'}};
const LEADST=[{id:'new',he:'חדשה',en:'New'},{id:'contact',he:'בקשר',en:'In contact'},{id:'assess',he:'הערכה',en:'Assessment'},{id:'approved',he:'אושר',en:'Approved'},{id:'admitted',he:'נקלט',en:'Admitted'}];
const ICON={
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.6.8 2.6 2.5 3 5.2"/>',
 pen:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
 wallet:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>',
 badge:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17c.8-1.8 2.2-2.7 4-2.7s3.2.9 4 2.7"/>',
 funnel:'<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
 flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
 check:'<path d="M4 12l5 5L20 6"/>',
 bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
 list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'};
const ic=n=>`<svg viewBox="0 0 24 24" aria-hidden="true" class="ic">${ICON[n]}</svg>`;

let D, IC={}, PS=null;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- money model ----------
 Every transaction carries "moves": {p: pool, d: change, m: medium}.
 Pools: 'retorno', 'program', 'patient:<id>'. Medium: 'cash' | 'bank' | 'other' (card / paid by staff, still to be settled).
 Physical cash = sum of all cash moves, so the cash breakdown by pool always adds up to the cash in hand. */
const PK=pid=>'patient:'+pid;
const okTx=x=>!x.status||x.status==='approved';
const okShift=s=>!s.status||s.status==='approved';
function stampTx(t){t.by=t.by||me();t.status=S.role==='manager'?'approved':'pending';if(t.status==='pending')notifyMgr(_('תנועה כספית ממתינה לאישור','A money entry needs approval'),`${staffName(me())} · ${money(t.amount)}`);return t}
function poolStats(){
 if(PS)return PS;const pools={};let cash=0,bank=0,other=0;
 D.tx.forEach(x=>okTx(x)&&x.moves.forEach(mv=>{const o=pools[mv.p]||(pools[mv.p]={t:0,cash:0,bank:0});o.t+=mv.d;if(mv.m==='cash'){o.cash+=mv.d;cash+=mv.d}else if(mv.m==='bank'){o.bank+=mv.d;bank+=mv.d}else other+=mv.d}));
 return PS={pools,cash:r2(cash),bank:r2(bank),other:r2(other)};
}
const pool=k=>poolStats().pools[k]||{t:0,cash:0,bank:0};
const poolName=k=>k==='retorno'?_('כספי רטורנו','Retorno funds'):k==='program'?_('קרן התוכנית','Program fund'):(pat(k.slice(8))?.name||k);
const medium=method=>method==='cash'?'cash':(method==='bank'||method==='card')?'bank':'other';
function txIn(date,from,method,amount,desc,kind){return{id:uid(),date,kind:kind||'in',method,amount,desc,moves:[{p:from,d:amount,m:method}]}}
function txExp(date,method,amount,desc,alloc,extra){const m=medium(method);const pm=extra&&extra.from;return{id:uid(),date,kind:'exp',method,amount,desc,moves:alloc.map(a=>({p:a.to,d:-a.amount,m:a.m||(pm&&a.to.startsWith('patient:')?pm:m)})),...(extra||{})}}
function mediumFor(k,amt){const o=pool(k);if(o.cash>=amt-.001)return'cash';if(o.bank>=amt-.001)return'bank';return'cash'}
function txMoveBetween(date,from,to,amount,desc,kind,extra){
 // move value between pools without money leaving the box; use the medium the source actually holds
 const o=pool(from);const moves=[];let left=amount;
 const c=Math.max(0,Math.min(left,r2(o.cash)));if(c>0){moves.push({p:from,d:-c,m:'cash'},{p:to,d:c,m:'cash'});left=r2(left-c)}
 const b=Math.max(0,Math.min(left,r2(o.bank)));if(b>0){moves.push({p:from,d:-b,m:'bank'},{p:to,d:b,m:'bank'});left=r2(left-b)}
 if(left>0)moves.push({p:from,d:-left,m:'cash'},{p:to,d:left,m:'cash'});
 return{id:uid(),date,kind,method:'none',amount,desc,moves,...(extra||{})};
}

/* ---------- seed ---------- */
function seed(){
 const d=n=>add(TD,n);const L=(he,en)=>({he,en});
 const C=(amt,per)=>({amt,per:per||'session'});
 const staff=[
  {id:'ariel',name:L('אהרון','Aharon'),role:'manager',phone:'050-000-0101',comp:{}},
  {id:'gal',name:L('גל','Gal'),role:'therapist',phone:'050-000-0102',comp:{individual:C(300)}},
  {id:'omer',name:L('עומר','Omer'),role:'counselor',phone:'050-000-0108',comp:{shift:450}},
  {id:'shira',name:L('שירה','Shira'),role:'counselor',phone:'050-000-0109',comp:{shift:450}},
  {id:'noa',name:L('נועה','Noa'),role:'counselor',phone:'050-000-0103',comp:{shift:450}},
  {id:'orit',name:L('אורית','Orit'),role:'therapist',phone:'050-000-0104',comp:{individual:C(350),group:C(400)}},
  {id:'haim',name:L('חיים','Haim'),role:'therapist',phone:'050-000-0105',comp:{individual:C(300),group:C(250,'hour')}},
  {id:'pablo',name:L('פבלו','Pablo'),role:'therapist',phone:'050-000-0107',comp:{activity:C(300)}},
  {id:'dvora',name:L('דבורה','Dvora'),role:'admissions',phone:'050-000-0106',comp:{monthly:6000}}];
 const P=(id,name,country,arr,st,counselor,therapist)=>({id,name,country,arrival:d(-arr),stage:st[st.length-1][0],
   history:st.map(([s,o])=>({stage:s,date:d(-o),by:'ariel'})),counselor,therapist,archived:false,fees:[]});
 const patients=[
  P('p1','Daniel K.','USA',74,[['gozal',74],['aleph',58],['bet',22]],'omer','orit'),
  P('p2','Michael R.','UK',41,[['gozal',41],['aleph',27]],'omer','orit'),
  P('p3','Sarah L.','Canada',12,[['gozal',12]],'noa','haim'),
  P('p4','Josh B.','Australia',103,[['gozal',103],['aleph',88],['bet',55],['gimel',14]],'noa','haim'),
  P('p5','Ethan M.','USA',27,[['gozal',27],['aleph',10]],'omer','gal'),
  P('p6','Rachel G.','South Africa',6,[['gozal',6]],'noa','orit'),
  P('p7','Adam S.','USA',140,[['gozal',140],['aleph',122],['bet',85],['gimel',45]],'omer','orit')];
 patients[6].archived=true;patients[6].discharged=d(-20);
 // treatment payments: one per patient per month they were in treatment, attributed to that month
 const thisM=TD.slice(0,7), prevM=add(TD.slice(0,8)+'01',-1).slice(0,7);
 const fx={[thisM]:3.71,[prevM]:3.68};
 patients.forEach(p=>[prevM,thisM].forEach(m=>{const first=m+'-01';const last=add(add(first,32).slice(0,8)+'01',-1);
  if(p.arrival>last||(p.discharged&&p.discharged<first))return;const date=p.arrival>first?p.arrival:first;if(date>TD)return;
  p.fees.push({id:uid(),date,month:m,cur:'USD',amt:p.id==='p4'?9500:10000,fx:fx[m],note:L('חודש טיפול','Treatment month')})}));
 const notes=[
  {pid:'p1',date:d(-1),time:'16:10',author:'orit',kind:'therapy',lang:'en',text:'Daniel spoke openly about the upcoming family visit. Anxiety is lower than last week and he is using the breathing tools.',tr:'דניאל דיבר בפתיחות על ביקור המשפחה הקרוב. החרדה נמוכה מבשבוע שעבר והוא משתמש בכלי הנשימה.'},
  {pid:'p4',date:d(-2),time:'14:40',author:'haim',kind:'therapy',lang:'he',text:'ג׳וש מתכונן לשלב הבא ומדבר על תוכנית מגורים אחרי הטיפול.',tr:'Josh is preparing for the next stage and is talking about a living plan after treatment.',followup:true}
 ].map(n=>({id:uid(),followup:false,resolved:false,...n}));
 const incidents=[
  {id:uid(),pid:'p5',date:d(0),time:'08:20',author:'omer',lang:'en',what:'Ethan arrived 20 minutes late to the morning meeting and argued with the counselor in front of the group.',response:'Private talk after the meeting. Phone time reduced to 30 minutes today.',decidedBy:'omer',followup:true,resolved:false,
   tr:{what:'איתן הגיע באיחור של 20 דקות לישיבת הבוקר והתווכח עם המדריך מול הקבוצה.',response:'שיחה אישית אחרי הישיבה. זמן הטלפון קוצר ל־30 דקות היום.'}},
  {id:uid(),pid:'p3',date:d(-2),time:'21:40',author:'noa',lang:'he',what:'שרה יצאה מהבית בלי לעדכן ונעדרה כ־40 דקות. חזרה בעצמה.',response:'שיחה עם המדריכה. היציאה החופשית ביום ראשון בוטלה.',decidedBy:'ariel',followup:true,resolved:false,
   tr:{what:'Sarah left the house without telling anyone and was gone for about 40 minutes. She came back on her own.',response:'Talk with the counselor. Sunday free outing cancelled.'}}];
 const summaries=[{id:uid(),date:d(-1),author:'noa',status:'published',source:'text',aiUsed:true,
  original:"Quiet day overall. Rachel's second full day, she joined all groups and talked a lot at dinner. Sarah was tense in the evening and asked again about calling her mom, I told her the team will decide tomorrow. Van to NA meeting left 10 min late because Michael couldn't find his shoes.",
  lang:'en',general:'A calm day overall. The van to the NA meeting left about 10 minutes late.',
  parts:[{pid:'p6',text:'Second full day. Took part in all groups and talked a lot at dinner.'},{pid:'p3',text:'Tense in the evening. Asked again about calling her mother; was told the team will decide tomorrow.'},{pid:'p2',text:'The van left about 10 minutes late because he could not find his shoes.'}],unclear:[]}];
 const T=(id,time,end,type,title,loc,staff,pts,x={})=>({id,time,end,type,title,loc,staff,pts,...x});
 const house=L('הבית','The house'),office=L('בניין המשרדים','Office building'),room=L('חדר קבוצות','Group room');
 const core=()=>[
  T('m','08:00','08:30','group',L('ישיבת בוקר','Morning meeting'),house,'omer','all',{inShift:true}),
  T('g','09:30','11:00','group',L('קבוצה טיפולית','Therapy group'),room,'haim','all'),
  T('a','11:30','13:00','activity',L('כושר והליכה','Fitness & walk'),L('הפארק','The park'),'noa','all',{inShift:true}),
  T('cg','15:00','16:30','group',L('קבוצה עם המדריך','Counselor group'),house,'noa','all',{inShift:true}),
  T('na','19:00','21:00','activity',L('פגישת NA','NA meeting'),L('פגישה מקומית','Local meeting'),'noa','all',{transport:L('ואן – נועה','Van – Noa'),inShift:true})];
 const template={0:core(),1:core(),2:core(),3:core(),4:core(),5:[core()[0],core()[2]],6:[]};
 const ind=L('טיפול פרטני','Individual therapy');
 template[0].push(T('i0','14:00','15:00','individual',ind,office,'haim',['p3']));
 template[1].push(T('i1','15:00','16:00','individual',ind,office,'orit',['p2']),T('og','13:30','14:30','group',L('קבוצת רגשות','Emotions group'),room,'orit','all'));
 template[2].push(T('i2a','13:30','14:30','individual',ind,office,'orit',['p1']),T('i2b','14:00','15:00','individual',ind,office,'haim',['p5']),T('yg','17:00','18:00','activity',L('קבוצת יוגה','Yoga group'),L('סטודיו','Studio'),'pablo','all'));
 template[3].push(T('i3a','15:00','16:00','individual',ind,office,'orit',['p6']),T('i3b','13:30','14:30','individual',ind,office,'haim',['p4']),T('i3c','16:30','17:30','individual',ind,office,'gal',['p5']));
 template[4].push(T('i4','15:00','16:00','individual',ind,office,'orit',['p2']),
   T('t4','15:00','16:30','transport',L('איסוף מהמרפאה','Clinic pickup'),L('מרפאה – רופא משפחה','Clinic – family doctor'),'omer',['p1'],{transport:L('רכב פרטי – עומר','Private car – Omer')}));
 const leads=[
  {id:uid(),name:'Tom W.',country:'USA',source:'Website',status:'new',next:d(1),todo:L('שיחת היכרות ראשונה','First intro call')},
  {id:uid(),name:'Lily H.',country:'UK',source:'Referral – therapist',status:'contact',next:d(-1),todo:L('לשלוח טופס קליטה','Send intake form')},
  {id:uid(),name:'Noah P.',country:'Canada',source:'Family',status:'contact',next:d(2),todo:L('שיחה עם ההורים','Call with parents')},
  {id:uid(),name:'Ben A.',country:'USA',source:'LeadManager',status:'assess',next:d(0),todo:L('הערכה פסיכיאטרית','Psychiatric assessment')},
  {id:uid(),name:'Maya F.',country:'Australia',source:'Website',status:'approved',next:d(3),todo:L('לתאם טיסה והסעה משדה התעופה','Coordinate flight and airport pickup'),arrival:d(5)},
  {id:uid(),name:'Rachel G.',country:'South Africa',source:'Referral – alumni',status:'admitted',next:'',todo:L('נקלטה','Admitted')}];
 const requests=[
  {id:uid(),staff:'omer',kind:'trip',date:d(-3),desc:L('הסעה למרפאה – דניאל','Clinic drive – Daniel'),km:34,amount:0,status:'pending'},
  {id:uid(),staff:'noa',kind:'reimb',date:d(-2),desc:L('קבלה – חומרי יצירה','Receipt – art supplies'),amount:86,status:'pending'},
  {id:uid(),staff:'omer',kind:'bonus',date:d(-15),desc:L('בונוס על משמרות כפולות','Bonus for double shifts'),amount:500,status:'approved'},
  {id:uid(),staff:'noa',kind:'trip',date:d(-18),desc:L('נסיעה לבית חולים','Hospital drive'),km:52,amount:0,status:'approved'}];
 const rules=[{id:uid(),name:L('יציאה קבוצתית','Group outing'),retorno:60,patients:40,program:0},{id:uid(),name:L('קניות לבית','House groceries'),retorno:100,patients:0,program:0}];
 const shifts=[];
 // three counselors rotate so nobody works a night and the next morning back to back
 const C3=['noa','omer','shira'];const roster={};for(let i=50;i>=-21;i--){const dt=d(-i),k=50-i;roster[dt]={day:C3[k%3],evening:C3[(k+2)%3]}}
 roster[d(10)]={day:'noa',evening:''};roster[d(12)]={day:'',evening:'omer'};
 const now=shiftAt(TD,NOWT),pv=prevShift(now),pv2=prevShift(pv);
 const tasks=[
  {id:uid(),text:'Call the pharmacy to renew Daniel’s prescription before Thursday',by:'omer',shift:shiftKey(pv2),created:pv2.date+'T10:15',urgent:true,pid:'p1',due:d(2)},
  {id:uid(),text:'להזמין טכנאי למזגן בחדר הקבוצות',by:'noa',shift:shiftKey(pv),created:pv.date+'T19:40'},
  {id:uid(),text:'Pick up laundry from the cleaners',by:'noa',shift:shiftKey(pv),created:pv.date+'T21:05'},
  {id:uid(),text:'לבדוק מלאי מוצרי ניקיון ולעדכן את רשימת הקניות',by:roster[now.date]?roster[now.date][now.kind]:'omer',shift:shiftKey(now),created:TD+'T'+NOWT}
 ].map(t=>({done:false,...t}));
 tasks.push({id:uid(),text:'להחזיר את הוואן עם מיכל מלא',by:'omer',shift:shiftKey(pv2),created:pv2.date+'T12:00',done:true,doneBy:'noa',doneAt:pv.date+'T18:30'});
 for(let i=50;i>=0;i--){const dt=d(-i);['day','evening'].forEach(k=>{if(i===0&&k==='evening')return;if(roster[dt][k])shifts.push({id:uid(),staff:roster[dt][k],date:dt,kind:k,rate:450})})}
 D={roster,tasks,settings:{cigPrice:38,kmRate:1.2,fx:3.71,rules,cancel:{patient:100,staff:0,other:0}},staff,patients,notes,incidents,summaries,template,overrides:{},log:{},leads,requests,shifts,payments:[],tx:[],cigSettlements:[{date:d(-30),packs:10,amount:380}]};
 const X=t=>{D.tx.push(t);PS=null};
 const E=(o,method,amt,desc,alloc,cat,receipt,extra)=>X(txExp(d(-o),method,amt,desc,alloc,{cat,receipt,...(extra||{})}));
 X(txIn(d(-140),PK('p7'),'cash',900,L('הפקדה מהמשפחה','Family deposit')));
 X(txIn(d(-30),'retorno','cash',2000,L('מזומן מרטורנו','Cash from Retorno')));
 X(txIn(d(-10),'retorno','cash',1500,L('מזומן מרטורנו','Cash from Retorno')));
 X(txIn(d(-70),PK('p1'),'bank',2000,L('העברה מהמשפחה','Family transfer')));
 X(txIn(d(-40),PK('p2'),'bank',1500,L('העברה מהמשפחה','Family transfer')));
 X(txIn(d(-11),PK('p3'),'cash',1000,L('מזומן מהמשפחה','Cash from family')));
 X(txIn(d(-100),PK('p4'),'bank',3000,L('העברה מהמשפחה','Family transfer')));
 X(txIn(d(-25),PK('p5'),'cash',1000,L('מזומן מהמשפחה','Cash from family')));
 X(txIn(d(-5),PK('p6'),'bank',800,L('העברה מהמשפחה','Family transfer')));
 E(25,'cash',380,L('קניות לבית','House groceries'),[{to:'retorno',amount:380}],'food',true);
 E(18,'cash',210,L('דלק לוואן','Van fuel'),[{to:'retorno',amount:210}],'transport',true);
 E(12,'cash',640,L('יום ים','Beach day'),[{to:'retorno',amount:400},...['p1','p2','p4','p5','p6'].map(p=>({to:PK(p),amount:48}))],'activity',true);
 E(6,'card',455,L('קניות לבית','House groceries'),[{to:'retorno',amount:455}],'food',false);
 E(30,'cash',120,L('בית מרקחת','Pharmacy'),[{to:PK('p1'),amount:120}],'personal',true);
 E(9,'card',260,L('בגדים','Clothes'),[{to:PK('p1'),amount:260}],'personal',true);
 E(8,'card',420,L('נעלי ספורט','Sneakers'),[{to:PK('p3'),amount:420}],'personal',true);
 E(3,'cash',67,L('שווארמה','Shawarma'),[{to:PK('p3'),amount:67}],'personal',true);
 E(2,'cash',50,L('קפה ומאפה','Coffee and pastry'),[{to:PK('p3'),amount:50}],'personal',false);
 E(35,'cash',60,L('תספורת','Haircut'),[{to:PK('p4'),amount:60}],'personal',true);
 const rq={id:uid(),staff:'omer',kind:'reimb',date:d(-12),desc:L('כרטיס חיוג – מייקל','Phone card – Michael'),amount:50,status:'approved'};requests.push(rq);
 E(12,'staff:omer',50,L('כרטיס חיוג','Phone card'),[{to:PK('p2'),amount:50}],'personal',true,{reqId:rq.id});
 E(4,'cash',240,L('ערב פיצה','Pizza night'),['p1','p2','p4','p5','p6'].map(p=>({to:PK(p),amount:48})),'personal',true);
 const cig=(pid,n,settled,start)=>{for(let i=0;i<n;i++)X(txMoveBetween(d(-(start-i)),PK(pid),'retorno',38,L('חפיסת סיגריות','Cigarette pack'),'cig',{settled,pid}))};
 cig('p1',10,true,40);cig('p1',4,false,8);cig('p4',3,false,6);cig('p5',3,false,5);
 X(txExp(d(-20),'cash',260,L('הוחזר בשחרור','Returned at discharge'),[{to:PK('p7'),amount:260}],{kind:'refund'}));
 X(txMoveBetween(d(-20),PK('p7'),'program',640,L('יתרה לקרן התוכנית','Balance to program fund'),'transfer'));
 D.tx.sort((a,b)=>a.date.localeCompare(b.date));PS=null;
 genHistory();
 // staff were paid everything accrued up to the end of last month, except part of Orit's
 const end=add(TD.slice(0,8)+'01',-1);IC={};
 D.staff.forEach(s=>{const acc=staffAccrued(s.id,end);let pay=r2(acc);if(s.id==='orit')pay=r2(acc-1050);if(pay>0)D.payments.push({id:uid(),staff:s.id,date:add(end,1)>TD?TD:add(end,1),amount:pay,method:'org',note:L('תשלום חודשי','Monthly payment')})});
}
function genHistory(){
 const rnd=mulberry(11);
 const reasons=[[{he:'המטפל חולה',en:'Therapist sick'},'staff'],[{he:'גשם – הפעילות בוטלה',en:'Rain – activity called off'},'other'],[{he:'המטופל ביטל ברגע האחרון',en:'Patient cancelled last minute'},'patient'],[{he:'אירוע משפחתי של מטופל',en:'Patient family event'},'patient']];
 for(let i=50;i>=0;i--){const date=add(TD,-i);IC={};
  instances(date).forEach(x=>{
   if(i===0&&x.id!=='m')return;
   if(i>0&&rnd()<0.06){const[rs,by]=reasons[Math.floor(rnd()*reasons.length)];const pct=D.settings.cancel[by]||0;D.log[x.key]={status:'cancelled',reason:rs,cancelBy:by,by:x.staff,cost:r2(rateCost(x)*pct/100),pct};return}
   const att={};x.patients.forEach(pid=>{const r=rnd();let v='p';
    if(pid==='p5'&&x.time<'10:00'&&(r<0.5||i===0))v='l';else if(pid==='p3'&&r<0.13)v='a';else if(r<0.03)v='l';else if(r<0.04)v='a';att[pid]=v});
   const lg={status:'done',att,by:x.staff,cost:rateCost(x),basis:basisSnap(x),costStatus:'approved'};
   if(i>=1&&i<=4&&staffBy(x.staff).role==='therapist'){lg.costStatus='pending';lg.suggest=lg.cost;lg.cost=0;lg.reportedBy='noa'}
   D.log[x.key]=lg});
 }
 IC={};
}
function load(){try{const s=localStorage.getItem(KEY);if(s){D=JSON.parse(s);D.messages=D.messages||[];D.reads=D.reads||[];return}}catch(e){}seed();D.messages=[];D.reads=[];save()}
function save(){IC={};PS=null;if(SH.on){if(SH.ready)syncNow();return}try{localStorage.setItem(KEY,JSON.stringify(D))}catch(e){}}
function savePrefs(){try{localStorage.setItem(PKEY,JSON.stringify({lang:S.lang,role:S.role,view:S.view}))}catch(e){}}

/* ---------- domain ---------- */
const me=()=>{if(SH.on){if(S.viewAs){const s=D.staff.find(x=>x.role===S.viewAs);return s?s.id:''}return myStaffId()||''}return AS[S.role]};
const P=()=>PERM[S.role];
const staffBy=id=>D.staff.find(s=>s.id===id);
const staffName=id=>{const s=staffBy(id);return s?nm(s.name):(id||'')};
const pat=id=>D.patients.find(p=>p.id===id);
const activeP=()=>D.patients.filter(p=>!p.archived);
const stageLbl=id=>{const s=STAGES.find(s=>s.id===id);return s?s[S.lang]:id};
const stagePill=id=>`<span class="pill st-${id}">${stageLbl(id)}</span>`;
const dayN=p=>diff(p.arrival,p.discharged||TD)+1;
const bal=p=>pool(PK(p.id)).t;
const cigOpen=pid=>D.tx.filter(x=>x.kind==='cig'&&okTx(x)&&!x.settled&&(!pid||x.pid===pid));
const cigN=pid=>cigOpen(pid).reduce((s,x)=>s+(x.packs||1),0);
const cigAmt=pid=>r2(cigOpen(pid).reduce((s,x)=>s+x.amount,0));
function cigTx(date,pid,packs,unit,bucket,id){const amt=r2(packs*unit);return{id:id||uid(),date,kind:'cig',method:'none',amount:amt,packs,unit,settled:false,pid,desc:{he:packs>1?packs+' חפיסות סיגריות':'חפיסת סיגריות',en:packs>1?packs+' cigarette packs':'Cigarette pack'},moves:[{p:PK(pid),d:-amt,m:bucket},{p:'retorno',d:amt,m:bucket}]}}
function activeOn(date){return D.patients.filter(p=>p.arrival<=date&&(!p.discharged||p.discharged>date))}
function instances(date){
 if(IC[date])return IC[date];
 const ov=D.overrides[date]||{};
 let list=(D.template[dowOf(date)]||[]).map(x=>({...x,src:'tpl'})).concat((ov.add||[]).map(x=>({...x,src:'day'})));
 list=list.map(x=>{const e=(ov.edit||{})[x.id];if(!e)return x;const y={...x,...e,edited:true};if(e.time&&e.time!==x.time)y.movedFrom=x.time;else delete y.movedFrom;return y}).filter(x=>!x.hidden);
 list.forEach(x=>{x.date=date;x.key=date+'|'+x.id;x.log=D.log[x.key]||{status:'planned'}});
 list.forEach(x=>{
  if(x.pts!=='all'){x.patients=x.pts.filter(id=>{const p=pat(id);return p&&p.arrival<=date&&(!p.discharged||p.discharged>date)});return}
  const busy=new Set();
  list.forEach(o=>{if(o!==x&&o.pts!=='all'&&o.log.status!=='cancelled'&&toMin(o.time)<toMin(x.end)&&toMin(o.end)>toMin(x.time))o.pts.forEach(id=>busy.add(id))});
  x.patients=activeOn(date).map(p=>p.id).filter(id=>!busy.has(id));
 });
 list.sort((a,b)=>a.time.localeCompare(b.time));
 return IC[date]=list;
}
const findInst=key=>{const[date,id]=key.split('|');return instances(date).find(x=>x.id===id)};
function attStats(pid,days=14){let p=0,l=0,a=0;for(let i=days;i>=0;i--){instances(add(TD,-i)).forEach(x=>{const v=x.log.att&&x.log.att[pid];if(v==='p')p++;else if(v==='l')l++;else if(v==='a')a++})}const tot=p+l+a;return{p,l,a,tot,rate:tot?Math.round((p+l)/tot*100):null}}
const canEditSched=()=>S.role==='manager'||S.role==='counselor';
const canAct=x=>x.type!=='routine'&&(S.role==='manager'||(S.role!=='admissions'&&x.staff===me())||(S.role==='counselor'&&x.byShift));
// activities led by whichever counselor is on shift
const isMine=x=>x.staff===me()||(S.role==='counselor'&&x.byShift&&[me(),''].includes(onShift(shiftAt(x.date,x.time))));
const whoLeads=x=>x.staff?staffName(x.staff):x.leader?esc(nm(x.leader)):x.byShift?(staffName(onShift(shiftAt(x.date,x.time)))||_('מדריך במשמרת','Counselor on shift')):'';
const canSeeNote=n=>n.kind==='therapy'?P().clinical:P().daily;
const reqAmount=r=>r.kind==='trip'?Math.round(r.km*D.settings.kmRate):r.amount;
const myPatients=()=>S.role==='therapist'?activeP().filter(p=>p.therapist===me()):activeP();

/* ---------- cost engine ----------
 Staff costs come from documented work only. A scheduled item carries a forecast cost at the current rate;
 once staff confirm it (or cancel it) the cost is frozen on that one log record, so a session is never counted twice. */
const PER={session:{he:'למפגש',en:'per session'},hour:{he:'לשעה',en:'per hour'}};
function compFor(st,type){const c=(st&&st.comp)||{};return type==='individual'?c.individual:type==='group'?c.group:type==='activity'?(c.activity||c.group):null}
function rateCost(x){if(x.inShift)return 0;const c=compFor(staffBy(x.staff),x.type);if(!c||!c.amt)return 0;return c.per==='hour'?r2(c.amt*(toMin(x.end)-toMin(x.time))/60):c.amt}
function basisSnap(x){if(x.inShift)return{shift:1};const c=compFor(staffBy(x.staff),x.type);return c&&c.amt?{amt:c.amt,per:c.per||'session'}:null}
function basisText(x,b){b=b===undefined?basisSnap(x):b;if(b&&typeof b==='object'){if(b.shift)return _('חלק מהמשמרת','Part of the shift');return`${money(b.amt)} ${nm(PER[b.per||'session'])}`}return'—'}
const monthDays=ym=>{const first=ym+'-01';const out=[];let d=first;while(d.slice(0,7)===ym){out.push(d);d=add(d,1)}return out};
const monthLbl=ym=>parse(ym+'-01').toLocaleDateString(S.lang==='he'?'he-IL':'en-GB',{month:'long',year:'numeric'});
const addMonth=(ym,n)=>{const d=parse(ym+'-01');d.setMonth(d.getMonth()+n);return iso(d).slice(0,7)};
// every costed piece of work in a month: accrued (confirmed / cancelled with pay) or forecast (still planned)
function monthWork(ym){
 const rows=[];
 monthDays(ym).forEach(d=>instances(d).forEach(x=>{
  const st=x.log.status;let cost,kind;
  if((st==='done'||st==='cancelled')&&x.log.costStatus==='pending'){cost=x.log.suggest||rateCost(x);kind='pending'}
  else if((st==='done'||st==='cancelled')&&x.log.costStatus==='rejected')return;
  else if(st==='done'||st==='cancelled'){cost=x.log.cost||0;kind=st==='done'?'accrued':'cancel'}
  else{cost=rateCost(x);kind=d<TD?'unconfirmed':'forecast'}
  if(!cost&&kind!=='pending')return;
  const who=st==='done'?Object.entries(x.log.att||{}).filter(([,v])=>v!=='a').map(([k])=>k):x.patients;
  rows.push({d,x,cost,kind,staff:x.staff,pts:who.length?who:x.patients});
 }));
 return rows;
}
function monthStaffCosts(ym,upTo){
 // per staff: sessions, shifts, monthly salary, approved requests; upTo limits to dates <= upTo
 const lim=d=>d.slice(0,7)===ym&&(!upTo||d<=upTo);const o={};const g=id=>o[id]||(o[id]={sessions:0,cancel:0,shifts:0,monthly:0,requests:0,reimb:0,n:0});
 monthWork(ym).forEach(r=>{if(!lim(r.d))return;if(r.kind==='accrued'){g(r.staff).sessions+=r.cost;g(r.staff).n++}else if(r.kind==='cancel')g(r.staff).cancel+=r.cost});
 D.shifts.forEach(s=>{if(okShift(s)&&lim(s.date))g(s.staff).shifts+=s.rate});
 D.staff.forEach(s=>{if(s.comp&&s.comp.monthly&&ym<=TD.slice(0,7)&&(!upTo||ym+'-01'<=upTo))g(s.id).monthly+=s.comp.monthly});
 D.requests.forEach(r=>{if(r.status==='approved'&&lim(r.date)){if(r.kind==='reimb'&&D.tx.some(t=>t.reqId===r.id))g(r.staff).reimb+=reqAmount(r);else g(r.staff).requests+=reqAmount(r)}});
 Object.values(o).forEach(v=>{v.cost=r2(v.sessions+v.cancel+v.shifts+v.monthly+v.requests);v.owedTotal=r2(v.cost+v.reimb)});
 return o;
}
function staffAccrued(id,upTo){let t=0;let ym=addMonth(TD.slice(0,7),-3);const last=(upTo||TD).slice(0,7);while(ym<=last){const c=monthStaffCosts(ym,upTo||TD)[id];if(c)t+=c.owedTotal;ym=addMonth(ym,1)}return r2(t)}
const staffPaid=(id,upTo)=>r2(D.payments.filter(p=>p.staff===id&&(!upTo||p.date<=upTo)).reduce((s,p)=>s+p.amount,0));
const staffOwed=id=>r2(staffAccrued(id)-staffPaid(id));
const feeIls=f=>r2(f.cur==='USD'?f.amt*f.fx:f.amt);
const progExpense=x=>x.kind==='exp'&&okTx(x)?r2(-x.moves.filter(m=>m.p==='retorno'||m.p==='program').reduce((s,m)=>s+m.d,0)):0;
const CATS={food:{he:'אוכל ובית',en:'Food & house'},activity:{he:'פעילויות',en:'Activities'},transport:{he:'נסיעות',en:'Transport'},supplies:{he:'ציוד',en:'Supplies'},cigarettes:{he:'סיגריות',en:'Cigarettes'},other:{he:'אחר',en:'Other'},personal:{he:'אישי',en:'Personal'}};
function monthReport(ym){
 const days=monthDays(ym).filter(d=>d<=TD);
 const pdays={};let pd=0;days.forEach(d=>activeOn(d).forEach(p=>{pdays[p.id]=(pdays[p.id]||0)+1;pd++}));
 const income={};let incomeT=0;D.patients.forEach(p=>p.fees.filter(f=>f.month===ym).forEach(f=>{income[p.id]=(income[p.id]||0)+feeIls(f);incomeT+=feeIls(f)}));
 const sc=monthStaffCosts(ym);const staffT=r2(Object.values(sc).reduce((s,v)=>s+v.cost,0));
 const work=monthWork(ym).filter(r=>r.kind==='accrued'||r.kind==='cancel');
 const direct={};work.forEach(r=>{const n=r.pts.length||1;r.pts.forEach(pid=>direct[pid]=(direct[pid]||0)+r.cost/n)});
 const workT=r2(work.reduce((s,r)=>s+r.cost,0));
 const prog={};let progT=0;D.tx.filter(x=>x.date.slice(0,7)===ym).forEach(x=>{const v=progExpense(x);if(v>0){const c=x.cat||'other';prog[c]=(prog[c]||0)+v;progT+=v}});
 const overhead=r2(staffT-workT+progT);// shifts, salaries, approved requests and program spending are shared
 const totalCost=r2(staffT+progT);
 const pts=Object.keys({...pdays,...income}).map(id=>{const share=pd?overhead*(pdays[id]||0)/pd:0;const c=r2((direct[id]||0)+share);return{id,days:pdays[id]||0,direct:r2(direct[id]||0),share:r2(share),cost:c,income:r2(income[id]||0),net:r2((income[id]||0)-c)}});
 let att=0,attT=0,sessions=0,cancels=0;days.forEach(d=>instances(d).forEach(x=>{if(x.log.status==='cancelled')cancels++;if(x.log.status==='done'){if(x.type==='individual')sessions++;Object.values(x.log.att||{}).forEach(v=>{attT++;if(v!=='a')att++})}}));
 return{ym,pd,incomeT:r2(incomeT),staffT,progT:r2(progT),prog,totalCost,net:r2(incomeT-totalCost),pts,sc,workT,costPerPatient:pd?Math.round(totalCost/pd*days.length):0,avgPatients:days.length?pd/days.length:0,sessions,cancels,attRate:attT?Math.round(att/attT*100):0};
}

/* ---------- UI helpers ---------- */
const typeChip=t=>`<span class="typ ${t}">${TYPES[t][S.lang]}</span>`;
function statusPill(lg){
 if(lg.status==='done')return`<span class="pill done">${_('בוצע','Done')}</span>`;
 if(lg.status==='cancelled')return`<span class="pill cancelled">${_('בוטל','Cancelled')}</span>`;
 return`<span class="pill planned">${_('מתוכנן','Planned')}</span>`;
}
function ptsLabel(x){
 if(x.pts==='all')return`${_('כל המטופלים','All patients')} (${x.patients.length})`;
 return x.patients.map(id=>esc(pat(id)?.name||'')).join(', ')||'—';
}
function attSummary(x){
 const v=Object.values(x.log.att||{});if(!v.length)return'';
 const l=v.filter(a=>a==='l').length,a=v.filter(a=>a==='a').length;
 return`<span class="chip">${_('נוכחו','Present')} ${v.length-a}/${v.length}</span>${l?`<span class="pill warn">${_('איחורים','Late')} ${l}</span>`:''}${a?`<span class="pill bad">${_('חסרו','Absent')} ${a}</span>`:''}`;
}
function agRow(x,full){
 const ed=full&&canEditSched()?`<button class="btn sm ghost" data-a="edit" data-v="${x.key}">${_('עריכה','Edit')}</button>`:'';
 if(x.type==='routine')return`<div class="ag routine"><div class="ag-t mono">${x.time}</div><div style="min-width:0" class="rt">${esc(nm(x.title))}${x.edited?` <span class="chip">${_('שונה ליום זה','Changed for this day')}</span>`:''}${x.src==='day'?` <span class="chip">${_('נוסף ליום זה','Added for this day')}</span>`:''}</div><div class="ag-acts">${ed}</div></div>`;
 const lg=x.log, act=canAct(x);
 let acts='';
 if(lg.status==='planned'&&act){
  acts=`<button class="btn sm primary" data-a="att" data-v="${x.key}">${x.type==='individual'?_('תיעוד מפגש','Log session'):_('נוכחות','Attendance')}</button>`;
  if(full)acts+=`<button class="btn sm ghost danger" data-a="cancel" data-v="${x.key}">${_('ביטול','Cancel')}</button>`;
 }else if(lg.status==='done'&&act&&full){acts=`<button class="btn sm ghost" data-a="att" data-v="${x.key}">${_('עריכה','Edit')}</button>`}
 if(lg.status==='cancelled'&&act&&full)acts=`<button class="btn sm ghost" data-a="restore" data-v="${x.key}">${_('שחזור','Restore')}</button>`;
 if(lg.status==='planned')acts+=ed;
 const extra=[];
 if(x.transport)extra.push(`<span class="chip">${_('הסעה','Transport')}: ${esc(nm(x.transport))}</span>`);
 if(x.movedFrom)extra.push(`<span class="pill warn">${_('הוזז מ־','Moved from ')}${x.movedFrom}</span>${x.moveReason?`<span class="muted">${esc(nm(x.moveReason))}</span>`:''}`);
 if(lg.status==='cancelled'&&lg.reason)extra.push(`<span class="muted">${_('סיבה','Reason')}: ${esc(nm(lg.reason))}</span>`);
 if(lg.status==='done')extra.push(attSummary(x));
 if(lg.status==='done'&&x.type==='individual'&&S.role==='manager'&&lg.cost)extra.push(`<span class="chip mono">${money(lg.cost)}</span>`);
 if(x.src==='day')extra.push(`<span class="chip">${_('נוסף ליום זה','Added for this day')}</span>`);
 else if(x.edited&&!x.movedFrom)extra.push(`<span class="chip">${_('שונה ליום זה','Changed for this day')}</span>`);
 return`<div class="ag ${lg.status}"><div class="ag-t mono">${x.time}<small>${x.end}</small></div>
 <div style="min-width:0"><div class="ag-title">${esc(nm(x.title))} ${typeChip(x.type)} ${full?statusPill(lg):''}</div>
 <div class="ag-meta">${[esc(nm(x.loc)),whoLeads(x),ptsLabel(x)].filter(Boolean).join(' · ')}</div>
 ${extra.length?`<div class="ag-extra">${extra.join('')}</div>`:''}</div>
 <div class="ag-acts">${!full&&lg.status!=='planned'?statusPill(lg):''}${acts}</div></div>`;
}
const empty=t=>`<div class="empty">${t}</div>`;
const lockBox=t=>`<div class="lock">${ic('lock')}<span>${t}</span></div>`;
const when=(d,t)=>`${fmtDate(d)}${t?' · '+t:''}`;
// translation: original always kept; a stored or AI translation is shown on request
function trControl(kind,id,o){
 if(o.lang===S.lang)return'';
 const key=kind+':'+id, show=S.showTr[key];
 if(o.tr)return`<div><button class="chip" data-a="tr" data-v="${key}">${show?_('הסתרת תרגום','Hide translation'):_('הצגת תרגום','Show translation')}</button></div>`;
 if(SAMPLE)return`<div><button class="chip" data-a="translate" data-v="${key}">${_('תרגום לעברית','Translate to English').replace('לעברית',S.lang==='he'?'לעברית':'')}</button></div>`;
 return'';
}
const trShown=(kind,id)=>S.showTr[kind+':'+id];

/* ---------- views ---------- */
function vDash(){
 if(S.role==='counselor')return vHomeCounselor();
 if(S.role==='therapist')return vHomeTherapist();
 const all=instances(TD).filter(x=>x.type!=='routine'), act=activeP();
 let h=`<div class="page-h"><div><p class="eyebrow">${fmtDate(TD,{weekday:'long',day:'numeric',month:'long'})}</p><h1>${_('סקירת התוכנית','Program overview')}</h1></div>
  <div class="acts"><button class="btn" data-a="incident">${ic('flag')} ${_('דיווח חריגה','Report incident')}</button></div></div>`;
 const live=all.filter(x=>x.log.status!=='cancelled'), done=all.filter(x=>x.log.status==='done').length;
 let p=0,t=0;act.forEach(pt=>{const s=attStats(pt.id);p+=s.p+s.l;t+=s.tot});
 const pend=D.requests.filter(r=>r.status==='pending');
 const ps=poolStats();
 h+=`<div class="kpis">
  <div class="kpi"><span class="lbl">${_('מטופלים פעילים','Active patients')}</span><span class="val">${act.length}</span><span class="sub">${act.filter(x=>dayN(x)<=7).length} ${_('הגיעו השבוע','arrived this week')}</span></div>
  <div class="kpi"><span class="lbl">${_('פעילויות היום','Today’s activities')}</span><span class="val">${done}/${live.length}</span><span class="sub">${all.length-live.length} ${_('בוטלו','cancelled')}</span></div>
  <div class="kpi"><span class="lbl">${_('נוכחות – 14 יום','Attendance – 14 days')}</span><span class="val">${t?Math.round(p/t*100):0}%</span><span class="sub">${_('כולל איחורים','including late arrivals')}</span></div>
  <div class="kpi"><span class="lbl">${_('מזומן בקופה','Cash in hand')}</span><span class="val">${money(ps.cash)}</span><span class="sub">${pend.length} ${_('בקשות ממתינות לאישור','requests awaiting approval')}</span></div></div>`;
 h+=`<div class="grid2"><div class="stack"><section class="card"><div class="card-h"><h2>${_('הלו״ז של היום','Today’s schedule')}</h2><button class="btn sm ghost" data-a="nav" data-v="schedule">${_('ללו״ז המלא','Full schedule')}</button></div>
  <div class="list">${all.map(x=>agRow(x,false)).join('')||empty(_('אין פעילויות היום.','No activities today.'))}</div></section>${incidentsCard(7)}</div>
  <div class="stack">${shiftCard()}${alertsCard()}${tasksMini()}${stageCard()}${followCard()}</div></div>`;
 return h;
}
function quickActions(list){return`<div class="qa">${list.map(([a,v,icn,lbl,sub])=>`<button class="qa-b" data-a="${a}" ${v?`data-v="${v}"`:''}>${ic(icn)}<span><b>${lbl}</b><small>${sub}</small></span></button>`).join('')}</div>`}
function vHomeCounselor(){
 const mine=instances(TD).filter(x=>x.type!=='routine'&&isMine(x));
 const todaySum=D.summaries.find(s=>s.date===TD&&s.author===me());
 return`${unreadBanner()}<div class="page-h"><div><p class="eyebrow">${fmtDate(TD,{weekday:'long',day:'numeric',month:'long'})}</p><h1>${_('היום שלי','My day')}, ${staffName(me())}</h1></div></div>
 ${quickActions([['incident','',"flag",_('דיווח חריגה','Report an incident'),_('מה קרה ואיזו תגובה ניתנה','What happened and the response')],['nav','summary','pen',todaySum?_('סיכום היום','Today’s summary'):_('כתיבת סיכום יום','Write daily summary'),todaySum?(todaySum.status==='published'?_('פורסם לצוות','Published to the team'):_('טיוטה – ממתין לאישור','Draft – awaiting approval')):_('בכתיבה או בהכתבה','Type or dictate')],['nav','schedule','cal',_('לו״ז ונוכחות','Schedule & attendance'),`${mine.filter(x=>x.log.status==='planned').length} ${_('פעילויות פתוחות היום','open activities today')}`],['reportExp','','wallet',_('דיווח הוצאה','Report an expense'),_('פירוט לכל פריט – המנהל מסווג','Item by item – the manager classifies')],['reportSession','','check',_('דיווח פגישה עם מטפל','Report a therapist session'),_('נשלח לאישור המנהל','Goes to the manager for approval')],['shift','','badge',_('דיווח משמרת','Report a shift'),D.shifts.some(s=>s.staff===me()&&s.date===TD)?_('דווחה משמרת להיום','Today’s shift reported'):_('נרשם לעלות החודש','Counts toward this month’s cost')]])}
 <div class="grid2"><div class="stack"><section class="card"><div class="card-h"><h2>${_('הפעילויות שלי היום','My activities today')}</h2></div><div class="list">${mine.map(x=>agRow(x,false)).join('')||empty(_('אין לך פעילויות היום.','You have no activities today.'))}</div></section>${incidentsCard(3)}</div>
 <div class="stack">${shiftCard()}${tasksMini()}${followCard()}</div></div>`;
}
function vHomeTherapist(){
 const mine=instances(TD).filter(x=>x.type!=='routine'&&x.staff===me());
 const ps=myPatients();const ban=unreadBanner();
 const open=[];for(let i=7;i>=1;i--)instances(add(TD,-i)).forEach(x=>{if(x.staff===me()&&x.type==='individual'&&x.log.status==='done'&&!D.notes.some(n=>n.session===x.key))open.push(x)});
 return`${ban}<div class="page-h"><div><p class="eyebrow">${fmtDate(TD,{weekday:'long',day:'numeric',month:'long'})}</p><h1>${_('היום שלי','My day')}, ${staffName(me())}</h1></div></div>
 <div class="grid2"><div class="stack"><section class="card"><div class="card-h"><h2>${_('המטופלים שלי','My patients')}</h2><span class="chip">${ps.length}</span></div><div class="list">
 ${ps.map(p=>{const s=attStats(p.id,7);const inc=D.incidents.filter(i=>i.pid===p.id&&diff(i.date,TD)<=7);const last=lastDaily(p.id);
  return`<button class="prow" data-a="openP" data-v="${p.id}"><div class="grow"><div class="t">${esc(p.name)} ${stagePill(p.stage)} <span class="dayn">${_('יום','Day')} ${dayN(p)}</span></div>
   <div class="ag-extra">${inc.length?`<span class="pill bad">${inc.length} ${_('חריגות השבוע','incidents this week')}</span>`:''}${s.l?`<span class="pill warn">${s.l} ${_('איחורים','late')}</span>`:''}${s.a?`<span class="pill bad">${s.a} ${_('היעדרויות','absences')}</span>`:''}${!inc.length&&!s.l&&!s.a?`<span class="pill ok">${_('שבוע תקין','Steady week')}</span>`:''}</div>
   ${last?`<div class="s" dir="auto">${esc(last.date===TD?_('היום','Today'):fmtDate(last.date))} · ${esc(trim(last.text,110))}</div>`:''}</div></button>`}).join('')}</div></section></div>
 <div class="stack"><section class="card"><div class="card-h"><h2>${_('המפגשים שלי היום','My sessions today')}</h2></div><div class="list">${mine.map(x=>agRow(x,false)).join('')||empty(_('אין מפגשים היום.','No sessions today.'))}</div></section>
 <section class="card"><div class="card-h"><h2>${_('מפגשים בלי סיכום','Sessions without a summary')}</h2><span class="chip">${open.length}</span></div><div class="list">${open.slice(-6).reverse().map(x=>`<div class="row"><div class="grow"><div class="t">${esc(pat(x.patients[0])?.name||'')}</div><div class="s">${fmtDate(x.date,{weekday:'short',day:'numeric',month:'short'})} · ${x.time}</div></div><button class="btn sm" data-a="att" data-v="${x.key}">${_('הוספת סיכום','Add summary')}</button></div>`).join('')||empty(_('כל המפגשים מסוכמים.','All sessions have a summary.'))}</div></section></div></div>`;
}
const trim=(t,n)=>t.length>n?t.slice(0,n-1)+'…':t;
function lastDaily(pid){
 const items=[];D.incidents.filter(i=>i.pid===pid).forEach(i=>items.push({date:i.date,time:i.time,text:(S.lang!==i.lang&&i.tr?i.tr.what:i.what)}));
 D.summaries.filter(s=>s.status==='published').forEach(s=>s.parts.filter(p=>p.pid===pid).forEach(p=>items.push({date:s.date,time:'23:00',text:p.text})));
 D.notes.filter(n=>n.pid===pid&&n.kind==='daily').forEach(n=>items.push({date:n.date,time:n.time||'',text:n.text}));
 return items.sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))[0];
}
function incidentsCard(days){
 if(!P().incidents)return'';
 const list=D.incidents.filter(i=>diff(i.date,TD)<=days&&!pat(i.pid)?.archived).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
 return`<section class="card"><div class="card-h"><h2>${_('חריגות אחרונות','Recent incidents')}</h2><button class="btn sm ghost" data-a="incident">+ ${_('דיווח','Report')}</button></div>
 <div class="list">${list.map(i=>incidentBlock(i,true)).join('')||empty(_('לא דווחו חריגות.','No incidents reported.'))}</div></section>`;
}
function incidentBlock(i,withName){
 const t=trShown('inc',i.id)&&i.tr;
 return`<div class="note"><div class="note-h"><span class="typ bad">${_('חריגה','Incident')}</span>${withName?`<button class="link" data-a="openP" data-v="${i.pid}">${esc(pat(i.pid)?.name||'')}</button>`:''}<span>${when(i.date,i.time)}</span><span>${_('דיווח','Reported by')}: ${staffName(i.author)}</span>${i.followup?`<span class="pill ${i.resolved?'ok':'warn'}">${i.resolved?_('טופל','Handled'):_('למעקב','Follow-up')}</span>`:''}</div>
 <div class="inc"><div><span class="k">${_('מה קרה','What happened')}</span><div class="note-b" dir="auto">${esc(t?i.tr.what:i.what)}</div></div>
 <div><span class="k">${_('תגובה / השלכה','Response / consequence')}</span><div class="note-b" dir="auto">${esc(t?i.tr.response:i.response)||'—'}</div><div class="hint">${_('החליט/ה','Decided by')}: ${staffName(i.decidedBy)}</div></div></div>
 ${trControl('inc',i.id,i)}</div>`;
}
function stageCard(){
 const act=activeP();const c=STAGES.map(s=>({s,n:act.filter(p=>p.stage===s.id).length}));
 return`<section class="card"><div class="card-h"><h2>${_('מטופלים לפי שלב','Patients by stage')}</h2></div>
 <div class="sbar">${c.filter(x=>x.n).map(x=>`<div class="st-${x.s.id}" style="flex:${x.n}">${x.n}</div>`).join('')}</div>
 <div class="legend">${c.map(x=>`<span><i class="st-${x.s.id}"></i>${x.s[S.lang]} · ${x.n}</span>`).join('')}</div></section>`;
}
function alertsCard(){
 const out=[];const act=activeP();
 const packs=cigN();
 if(packs>=10)out.push(['warn',`${_('הגיע הזמן להתחשבן עם רטורנו על סיגריות','Time to settle cigarettes with Retorno')}: ${packs} ${_('חפיסות','packs')} (${money(cigAmt())})`,`<button class="btn sm" data-a="nav" data-v="finance">${_('להתחשבנות','Settle')}</button>`]);
 const pa=pendingAll();
 if(pa.n)out.push(['warn',`${pa.n} ${_('פריטים ממתינים לסיווג ואישור שלך','items await your classification and approval')}: ${pa.sess.length} ${_('פגישות','sessions')}, ${pa.tx.length} ${_('תנועות כספיות','money entries')}, ${pa.sh.length+pa.rq.length} ${_('משמרות ובקשות','shifts & requests')}`,`<button class="btn sm" data-a="nav" data-v="approvals">${_('לאישורים','Review')}</button>`]);
 act.forEach(p=>{const s=attStats(p.id);if(s.l>=3)out.push(['warn',`${esc(p.name)}: ${s.l} ${_('איחורים בשבועיים האחרונים','late arrivals in the last two weeks')}`,`<button class="btn sm ghost" data-a="openP" data-v="${p.id}">${_('לתיק','File')}</button>`]);
  if(s.a>=2)out.push(['bad',`${esc(p.name)}: ${s.a} ${_('היעדרויות בשבועיים האחרונים','absences in the last two weeks')}`,`<button class="btn sm ghost" data-a="openP" data-v="${p.id}">${_('לתיק','File')}</button>`]);
  const b=bal(p);if(b<0)out.push(['bad',`${esc(p.name)}: ${_('יתרה שלילית','negative balance')} ${money(b)}`,`<button class="btn sm ghost" data-a="openAcc" data-v="${p.id}">${_('לחשבון','Account')}</button>`])});
 D.leads.filter(l=>l.status!=='admitted'&&l.next&&l.next<TD).forEach(l=>out.push(['warn',`${_('פנייה – מעקב באיחור','Lead follow-up overdue')}: ${esc(l.name)}`,`<button class="btn sm ghost" data-a="nav" data-v="leads">${_('לפניות','Leads')}</button>`]));
 return`<section class="card"><div class="card-h"><h2>${_('דורש תשומת לב','Needs attention')}</h2></div>${out.length?out.map(([k,t,b])=>`<div class="alert"><span class="mk ${k}"></span><div class="grow">${t}</div>${b}</div>`).join(''):empty(_('אין התראות פתוחות.','Nothing needs attention.'))}</section>`;
}
function followCard(){
 if(!P().daily)return'';
 const items=[];
 D.incidents.filter(i=>i.followup&&!i.resolved&&!pat(i.pid)?.archived).forEach(i=>items.push({id:'inc:'+i.id,pid:i.pid,date:i.date,who:i.author,text:(S.lang!==i.lang&&i.tr?i.tr.what:i.what),tag:_('חריגה','Incident')}));
 D.notes.filter(n=>n.followup&&!n.resolved&&canSeeNote(n)&&!pat(n.pid)?.archived).forEach(n=>items.push({id:'note:'+n.id,pid:n.pid,date:n.date,who:n.author,text:(n.lang!==S.lang&&n.tr?n.tr:n.text),tag:n.kind==='therapy'?_('טיפולי','Therapy'):_('תיעוד','Note')}));
 items.sort((a,b)=>b.date.localeCompare(a.date));
 return`<section class="card"><div class="card-h"><h2>${_('משימות להמשך','Follow-ups')}</h2><span class="chip">${items.length}</span></div>
 ${items.length?items.map(n=>`<div class="alert"><span class="mk ok"></span><div class="grow"><b>${esc(pat(n.pid).name)}</b> · <span class="muted">${n.tag} · ${staffName(n.who)}, ${fmtDate(n.date)}</span><div class="note-b" dir="auto">${esc(trim(n.text,160))}</div></div><button class="btn sm ghost" data-a="resolve" data-v="${n.id}">${_('טופל','Done')}</button></div>`).join(''):empty(_('אין משימות פתוחות.','No open follow-ups.'))}</section>`;
}

function vSched(){
 const sun=add(S.date,-dowOf(S.date));
 if(S.mine===null)S.mine=S.role!=='manager';
 let list=instances(S.date);
 if(S.mine&&(S.role==='counselor'||S.role==='therapist'))list=list.filter(x=>x.type!=='routine'&&isMine(x));
 const canAdd=S.role==='manager'||S.role==='counselor';
 const days=[...Array(7)].map((_x,i)=>{const d=add(sun,i);const changed=D.overrides[d]&&(Object.keys(D.overrides[d].edit||{}).length||(D.overrides[d].add||[]).length);
  return`<button class="day-b ${d===S.date?'on':''} ${d===TD?'today':''}" data-a="day" data-v="${d}" aria-pressed="${d===S.date}"><span class="d">${fmtDate(d,{weekday:'short'})}</span><span class="n">${parse(d).getDate()}</span>${changed?'<span class="dot"></span>':''}</button>`}).join('');
 const prev=S.lang==='he'?'›':'‹', next=S.lang==='he'?'‹':'›';
 return`<div class="page-h"><div><p class="eyebrow">${fmtDate(S.date,{month:'long',year:'numeric'})}</p><h1>${_('לו״ז','Schedule')} · ${fmtDate(S.date,{weekday:'long',day:'numeric',month:'short'})}</h1></div>
 <div class="acts">${S.date!==TD?`<button class="btn ghost" data-a="day" data-v="${TD}">${_('היום','Today')}</button>`:''}${canAdd?`<button class="btn primary" data-a="addAct">+ ${_('פעילות','Activity')}</button>`:''}</div></div>
 <div class="week"><button class="arrow" data-a="week" data-v="-1" aria-label="${_('שבוע קודם','Previous week')}">${prev}</button>${days}<button class="arrow" data-a="week" data-v="1" aria-label="${_('שבוע הבא','Next week')}">${next}</button></div>
 <div class="toolbar">${S.role==='counselor'||S.role==='therapist'?`<label class="toggle"><input type="checkbox" id="mineT" data-c="mine" ${S.mine?'checked':''}>${_('רק הפעילויות שלי','My activities only')}</label>`:''}
 <span class="hint">${_('הלו״ז השבועי הקבוע מוצג אוטומטית. שינויים כאן חלים על היום הזה בלבד, אלא אם סימנת “חוזר כל שבוע”.','The weekly base schedule fills in automatically. Changes here apply to this day only, unless you tick “repeats weekly”.')}</span></div>
 <section class="card"><div class="list">${list.length?list.map(x=>agRow(x,true)).join(''):empty(_('אין פעילויות ביום הזה.','No activities on this day.'))}</div></section>`;
}

function vPatients(){
 if(S.pid)return vProfile(pat(S.pid));
 const arch=S.arch&&S.role==='manager';
 let ps=D.patients.filter(p=>!!p.archived===arch);
 if(S.role==='therapist')ps=ps.filter(p=>p.therapist===me());
 const fin=S.role==='manager';
 return`<div class="page-h"><div><p class="eyebrow">${ps.length} ${arch?_('בארכיון','archived'):_('פעילים','active')}</p><h1>${_('מטופלים','Patients')}</h1></div>
 <div class="acts">${S.role==='manager'?`<button class="btn primary" data-a="addPatient">+ ${_('מטופל','Patient')}</button>`:''}${S.role==='manager'?`<button class="btn ${arch?'':'primary'}" data-a="arch" data-v="0">${_('פעילים','Active')}</button><button class="btn ${arch?'primary':''}" data-a="arch" data-v="1">${_('ארכיון','Archive')}</button>`:''}</div></div>
 ${S.role==='therapist'?`<p class="hint">${_('מוצגים המטופלים שבאחריותך.','Showing patients in your care.')}</p>`:''}
 <div class="pgrid">${ps.map(p=>{const s=attStats(p.id);const b=bal(p);const inc=D.incidents.filter(i=>i.pid===p.id&&diff(i.date,TD)<=7).length;return`<button class="pcard" data-a="openP" data-v="${p.id}">
  <div class="top-r"><div><div class="pname">${esc(p.name)}</div><div class="dayn">${_('יום','Day')} ${dayN(p)} · ${esc(p.country)}</div></div>${stagePill(p.stage)}</div>
  <dl class="kv"><dt>${_('מדריך','Counselor')}</dt><dd>${staffName(p.counselor)}</dd><dt>${_('מטפל/ת','Therapist')}</dt><dd>${staffName(p.therapist)}</dd>${fin?`<dt>${_('יתרה','Balance')}</dt><dd class="num ${b<0?'neg':''}">${money(b)}</dd>`:''}</dl>
  ${!p.archived&&s.rate!=null?`<div><div class="bar"><i style="width:${s.rate}%"></i></div><div class="hint" style="margin-top:4px">${_('נוכחות','Attendance')} ${s.rate}%${s.l?` · ${s.l} ${_('איחורים','late')}`:''}${s.a?` · ${s.a} ${_('היעדרויות','absent')}`:''}${inc&&P().incidents?` · <span class="neg">${inc} ${_('חריגות השבוע','incidents this week')}</span>`:''}</div></div>`:''}
  ${p.archived?`<div class="hint">${_('שוחרר/ה ב־','Discharged ')}${fmtDate(p.discharged,{day:'numeric',month:'short',year:'numeric'})}</div>`:''}</button>`}).join('')||empty(_('אין מטופלים להצגה.','No patients to show.'))}</div>`;
}
// One ordered stream of what happened to a patient, filtered by what this role may see
function timeline(p){
 const ev=[];const pr=P();
 for(let i=14;i>=0;i--){const d=add(TD,-i);instances(d).forEach(x=>{const v=x.log.att&&x.log.att[p.id];if(v==='l'||v==='a')ev.push({t:'att',date:d,time:x.time,html:`<span class="pill ${v==='l'?'warn':'bad'}">${v==='l'?_('איחר','Late'):_('נעדר','Absent')}</span> ${esc(nm(x.title))} <span class="muted">· ${staffName(x.log.by||x.staff)}</span>`})})}
 if(pr.incidents)D.incidents.filter(i=>i.pid===p.id).forEach(i=>ev.push({t:'inc',date:i.date,time:i.time,html:incidentBlock(i,false),raw:true}));
 D.notes.filter(n=>n.pid===p.id&&canSeeNote(n)).forEach(n=>ev.push({t:'sum',date:n.date,time:n.time||'',raw:true,html:noteBlock(n)}));
 if(pr.daily)D.summaries.filter(s=>s.status==='published').forEach(s=>s.parts.filter(x=>x.pid===p.id).forEach(x=>ev.push({t:'sum',date:s.date,time:'23:59',raw:true,html:`<div class="note"><div class="note-h"><span class="typ">${_('סיכום יום','Daily summary')}</span><b style="color:var(--ink)">${staffName(s.author)}</b><span>${fmtDate(s.date)}</span></div><div class="note-b" dir="auto">${esc(x.text)}</div></div>`})));
 p.history.forEach(h=>ev.push({t:'stage',date:h.date,time:'00:00',html:`${_('מעבר ל','Moved to ')}${stagePill(h.stage)} <span class="muted">· ${staffName(h.by)}</span>${h.note?` <span class="muted" dir="auto">· ${esc(h.note)}</span>`:''}`}));
 const hidden=D.notes.filter(n=>n.pid===p.id&&!canSeeNote(n)).length;
 return{ev:ev.sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)),hidden};
}
function noteBlock(n){
 const t=trShown('note',n.id)&&n.tr;
 return`<div class="note"><div class="note-h">${n.kind==='therapy'?`<span class="typ individual">${_('סיכום טיפולי','Therapy summary')}</span>`:`<span class="typ">${_('תיעוד','Note')}</span>`}<b style="color:var(--ink)">${staffName(n.author)}</b><span>${when(n.date,n.time)}</span>${n.followup?`<span class="pill ${n.resolved?'ok':'warn'}">${n.resolved?_('טופל','Handled'):_('למעקב','Follow-up')}</span>`:''}${n.session?`<span class="chip">${_('מקושר למפגש','Linked to session')}</span>`:''}${n.source==='whatsapp'?`<span class="chip">${_('מקבוצת הוואטסאפ','From the WhatsApp group')}</span>`:''}</div>
 <div class="note-b" dir="auto">${esc(t?n.tr:n.text)}</div>${trControl('note',n.id,n)}</div>`;
}
function vProfile(p){
 if(!p){S.pid=null;return vPatients()}
 const tabs=[['overview',_('סקירה','Overview')],['timeline',_('רצף אירועים','Timeline')],['week',_('השבוע','This week')]];
 if(S.role==='manager')tabs.push(['account',_('קופה אישית','Personal fund')]);
 if(!tabs.some(t=>t[0]===S.ptab))S.ptab='overview';
 const mgr=S.role==='manager';
 let body='';
 if(S.ptab==='overview'){
  const s=attStats(p.id);
  body=`<div class="grid2 even"><section class="card"><div class="card-h"><h2>${_('היסטוריית שלבים','Stage history')}</h2>${mgr&&!p.archived?`<button class="btn sm" data-a="stage" data-v="${p.id}">${_('שינוי שלב','Change stage')}</button>`:''}</div>
   <div class="timeline">${p.history.map(h=>`<div class="tl"><div>${stagePill(h.stage)} <span class="muted">${fmtDate(h.date,{day:'numeric',month:'short',year:'numeric'})}</span></div>${h.note?`<div class="hint" dir="auto">${esc(h.note)}</div>`:''}<div class="hint">${_('עודכן ע״י','By')} ${staffName(h.by)}</div></div>`).join('')}</div></section>
   <div class="stack"><section class="card"><div class="card-h"><h2>${_('צוות מטפל','Care team')}</h2></div><dl class="kv"><dt>${_('מדריך','Counselor')}</dt><dd>${staffName(p.counselor)}</dd><dt>${_('מטפל/ת','Therapist')}</dt><dd>${staffName(p.therapist)}</dd><dt>${_('תאריך הגעה','Arrival')}</dt><dd>${fmtDate(p.arrival,{day:'numeric',month:'long',year:'numeric'})}</dd><dt>${_('מדינה','Country')}</dt><dd>${esc(p.country)}</dd></dl></section>
   <section class="card"><div class="card-h"><h2>${_('נוכחות – 14 יום','Attendance – 14 days')}</h2><span class="pill ${s.rate>=90?'ok':s.rate>=75?'warn':'bad'}">${s.rate??'—'}%</span></div><dl class="kv"><dt>${_('נוכח','Present')}</dt><dd class="num">${s.p}</dd><dt>${_('איחר','Late')}</dt><dd class="num">${s.l}</dd><dt>${_('נעדר','Absent')}</dt><dd class="num">${s.a}</dd></dl></section></div></div>`;
 }else if(S.ptab==='timeline'){
  const{ev,hidden}=timeline(p);
  const f={all:_('הכל','All'),inc:_('חריגות','Incidents'),sum:_('סיכומים ותיעוד','Summaries & notes'),att:_('נוכחות','Attendance'),stage:_('שלבים','Stages')};
  const shown=S.tlf==='all'?ev:ev.filter(e=>e.t===S.tlf);
  let lastDay='';
  body=`<div class="toolbar">${Object.keys(f).filter(k=>k!=='inc'||P().incidents).map(k=>`<button class="chip ${S.tlf===k?'on':''}" data-a="tlf" data-v="${k}" aria-pressed="${S.tlf===k}">${f[k]}</button>`).join('')}
   <span style="flex:1"></span>${!p.archived&&P().incidents?`<button class="btn sm" data-a="incident" data-v="${p.id}">${ic('flag')} ${_('דיווח חריגה','Report incident')}</button>`:''}${!p.archived&&P().daily?`<button class="btn sm primary" data-a="note" data-v="${p.id}">+ ${_('תיעוד','Note')}</button>`:''}${!p.archived&&S.role==='counselor'?`<button class="btn sm" data-a="reportExp" data-v="${p.id}">${_('דיווח הוצאה','Report an expense')}</button>`:''}</div>
   <section class="card"><div class="tline">${shown.map(e=>{const day=e.date!==lastDay;lastDay=e.date;return`${day?`<div class="tday">${e.date===TD?_('היום','Today'):fmtDate(e.date,{weekday:'long',day:'numeric',month:'short'})}</div>`:''}<div class="tev tev-${e.t}">${e.raw?e.html:`<div class="tsmall"><span class="mono muted">${e.time!=='00:00'?e.time:''}</span> ${e.html}</div>`}</div>`}).join('')||empty(_('אין אירועים להצגה.','Nothing to show.'))}</div>
   ${hidden?lockBox(`${hidden} ${_('סיכומים טיפוליים מוסתרים לפי ההרשאה שלך.','therapy summaries are hidden by your access level.')}`):''}</section>`;
 }else if(S.ptab==='week'){
  const sun=add(TD,-dowOf(TD));let rows='';
  for(let i=0;i<7;i++){const d=add(sun,i);const its=instances(d).filter(x=>x.type!=='routine'&&x.patients.includes(p.id));
   const att=x=>{const v=x.log.att&&x.log.att[p.id];return v==='p'?`<span class="pill ok">${_('נוכח','Present')}</span>`:v==='l'?`<span class="pill warn">${_('איחר','Late')}</span>`:v==='a'?`<span class="pill bad">${_('נעדר','Absent')}</span>`:statusPill(x.log)};
   if(its.length)rows+=`<tr><td colspan="4" class="trh">${fmtDate(d,{weekday:'long',day:'numeric',month:'short'})}</td></tr>`+its.map(x=>`<tr><td class="mono">${x.time}</td><td>${esc(nm(x.title))} ${typeChip(x.type)}</td><td class="muted">${staffName(x.staff)}</td><td class="n">${att(x)}</td></tr>`).join('')}
  body=`<section class="card"><div class="tw"><table><tbody>${rows||`<tr><td>${empty(_('אין פעילויות השבוע.','No activities this week.'))}</td></tr>`}</tbody></table></div></section>`;
 }else if(S.ptab==='account'){
  const o=pool(PK(p.id)), cn=cigN(p.id);
  const rows=D.tx.filter(x=>okTx(x)&&x.moves.some(m=>m.p===PK(p.id))).sort((a,b)=>b.date.localeCompare(a.date));
  body=`<div class="kpis"><div class="kpi"><span class="lbl">${_('מזומן','Cash')}</span><span class="val ${o.cash<0?'neg':''}">${money(o.cash)}</span><span class="sub">${_('כסף פיזי בקופה','physical cash in the box')}</span></div>
   <div class="kpi"><span class="lbl">${_('אשראי','Credit')}</span><span class="val ${o.bank<0?'neg':''}">${money(o.bank)}</span><span class="sub">${_('העברות וכרטיס אשראי','transfers and credit card')}</span></div>
   <div class="kpi"><span class="lbl">${_('יתרה כוללת','Total balance')}</span><span class="val ${o.t<0?'neg':''}">${money(o.t)}</span><span class="sub">${o.t<0?_('חוב של המטופל','owed by the patient'):_('זמין להוצאות אישיות','available for personal spending')}</span></div>
   <div class="kpi ${cn>=10?'warn':''}"><span class="lbl">${_('חפיסות שלא הותחשבנו','Unsettled packs')}</span><span class="val">${cn}</span><span class="sub">${money(cigAmt(p.id))} ${_('מול רטורנו','with Retorno')}</span></div></div>
   ${!p.archived?(mgr?`<div class="toolbar"><button class="btn primary" data-a="inPatient" data-v="${p.id}">+ ${_('הפקדה במזומן','Cash deposit')}</button><button class="btn" data-a="inBank" data-v="${p.id}">+ ${_('הפקדה באשראי / העברה','Credit / transfer deposit')}</button><button class="btn" data-a="expense" data-v="${p.id}">${_('הוצאה','Expense')}</button><button class="btn" data-a="cigPick" data-v="${p.id}">${_('סיגריות','Cigarettes')}</button><button class="btn" data-a="fee" data-v="${p.id}">${_('תשלום על טיפול','Treatment payment')}</button></div>`
    :`<div class="toolbar"><button class="btn primary" data-a="reportExp" data-v="${p.id}">${_('דיווח הוצאה','Report an expense')}</button><span class="hint">${_('המנהל מסווג ומאשר כל הוצאה.','The manager classifies and approves every expense.')}</span></div>`):''}
   <section class="card"><div class="card-h"><h2>${_('הקופה האישית','Personal fund')}</h2></div>${txTable(rows,PK(p.id))}</section>
   ${mgr&&p.fees.length?`<section class="card"><div class="card-h"><h2>${_('תשלומים על הטיפול – לא חלק מהקופה האישית','Treatment payments – not part of the personal fund')}</h2></div><div class="tw"><table><thead><tr><th>${_('תאריך','Date')}</th><th>${_('מיוחס לחודש','For month')}</th><th class="n">${_('סכום','Amount')}</th><th class="n">${_('שער','Rate')}</th><th class="n">₪</th></tr></thead><tbody>${p.fees.map(f=>`<tr><td class="mono">${fmtDate(f.date)}</td><td>${monthLbl(f.month)}</td><td class="n">${f.cur==='USD'?'$'+f.amt.toLocaleString('en-US'):money(f.amt)}</td><td class="n mono">${f.cur==='USD'?f.fx.toFixed(2):'—'}</td><td class="n">${money(feeIls(f))}</td></tr>`).join('')}</tbody></table></div></section>`:''}`;
 }
 return`<div><button class="btn ghost sm" data-a="backP">${S.lang==='he'?'→':'←'} ${_('כל המטופלים','All patients')}</button></div>
 <div class="hero-p"><div><p class="eyebrow">${esc(p.country)} · ${_('הגיע/ה','Arrived')} ${fmtDate(p.arrival,{day:'numeric',month:'short',year:'numeric'})}${p.archived?` · ${_('בארכיון','Archived')}`:''}</p><h1>${esc(p.name)} ${stagePill(p.stage)}</h1></div>
 <div style="display:flex;gap:16px;align-items:flex-end"><div class="daybig">${dayN(p)}<small>${_('ימים בטיפול','days in treatment')}</small></div>${mgr?`<button class="btn" data-a="editPatient" data-v="${p.id}">${_('עריכת פרטים','Edit details')}</button>`:''}${mgr&&!p.archived?`<button class="btn danger" data-a="discharge" data-v="${p.id}">${_('שחרור','Discharge')}</button>`:''}${mgr&&p.archived?`<button class="btn primary" data-a="unarchive" data-v="${p.id}">${_('ביטול השחרור','Undo discharge')}</button>`:''}</div></div>
 <div class="tabs" role="tablist">${tabs.map(t=>`<button class="tab ${S.ptab===t[0]?'on':''}" role="tab" aria-selected="${S.ptab===t[0]}" data-a="ptab" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>${body}`;
}
const methodLbl=m=>({cash:_('מזומן','Cash'),bank:_('העברה בנקאית','Bank transfer'),card:_('אשראי','Credit'),none:_('פנימי – ללא תנועת כסף','Internal – no money moved')}[m]||(m&&m.startsWith('staff:')?`${_('שולם ע״י','Paid by')} ${staffName(m.slice(6))}`:''));
const kindLbl=x=>({in:_('הכנסה','Money in'),exp:_('הוצאה','Expense'),refund:_('הוחזר למטופל','Returned to patient'),cig:_('סיגריות','Cigarettes'),transfer:_('העברה בין קופות','Transfer between funds'),staffpay:_('תשלום לצוות','Staff payment')}[x.kind]||x.kind);
function txTable(rows,focus){
 return`<div class="tw"><table><thead><tr><th>${_('תאריך','Date')}</th><th>${_('סוג','Type')}</th><th>${_('פירוט','Details')}</th><th>${_('איך שולם','How paid')}</th><th>${_('על חשבון','Charged to')}</th><th class="n">${focus?_('השפעה','Effect'):_('סכום','Amount')}</th></tr></thead><tbody>
 ${rows.map(x=>{const mt=m=>focus.endsWith(':')?m.p.startsWith(focus):m.p===focus;const mine=focus?r2(x.moves.filter(mt).reduce((s,m)=>s+m.d,0)):x.amount;
  const charged=x.kind==='in'?`<span class="chip">${poolName(x.moves[0].p)}</span>`:groupMoves(x).filter(g=>x.kind==='exp'||x.kind==='refund'||g.d<0).map(g=>`<span class="chip">${esc(poolName(g.p))}${x.kind==='exp'||x.kind==='refund'?' '+money(-g.d):''}</span>`).join(' ');
  return`<tr><td class="mono">${fmtDate(x.date)}</td><td>${kindLbl(x)}${pendPill(x.status)}${x.kind==='cig'?`${x.packs>1?` ×${x.packs}`:''}${S.role==='manager'?` <button class="link" data-a="cigEdit" data-v="${x.id}">${_('עריכה','Edit')}</button>`:''} <span class="pill ${x.settled?'ok':'warn'}">${x.settled?_('הותחשבן','Settled'):_('פתוח','Open')}</span>`:''}</td><td dir="auto">${esc(nm(x.desc))}</td><td class="muted">${methodLbl(x.method)}</td><td><div class="chips">${charged}</div></td><td class="n ${mine<0?'neg':'pos'}">${focus&&mine>0?'+':''}${money(mine)}</td></tr>`}).join('')||`<tr><td colspan="6">${empty(_('אין תנועות.','No entries.'))}</td></tr>`}</tbody></table></div>`;
}
function groupMoves(x){const m={};x.moves.forEach(v=>{m[v.p]=(m[v.p]||0)+v.d});return Object.entries(m).map(([p,d])=>({p,d:r2(d)}))}

function vFin(){
 const mgr=S.role==='manager';
 const tabs=mgr?[['program',_('הכנסות ועלויות','Income & costs')],['personal',_('קופות אישיות','Personal funds')],['box',_('קופת רטורנו ומזומן','Retorno box & cash')]]:[['mine',_('ההוצאות שלי','My expenses')]];
 if(!tabs.some(t=>t[0]===S.ftab))S.ftab=tabs[0][0];
 const body={program:finProgram,personal:finPersonal,box:finBox,mine:finMine}[S.ftab]();
 return`<div class="page-h"><div><p class="eyebrow">${_('שלוש קופות נפרדות שמתעדכנות מאותם רישומים','Three separate books, updated from the same records')}</p><h1>${_('כספים','Finance')}</h1></div></div>
 <div class="tabs" role="tablist">${tabs.map(t=>`<button class="tab ${S.ftab===t[0]?'on':''}" role="tab" aria-selected="${S.ftab===t[0]}" data-a="ftab" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>${body}`;
}
function monthNav(){return`<div class="mnav"><button class="arrow" data-a="month" data-v="-1" aria-label="${_('חודש קודם','Previous month')}">${S.lang==='he'?'›':'‹'}</button><b>${monthLbl(S.month)}</b><button class="arrow" data-a="month" data-v="1" aria-label="${_('חודש הבא','Next month')}" ${S.month>=TD.slice(0,7)?'disabled':''}>${S.lang==='he'?'‹':'›'}</button></div>`}
function finProgram(){
 const ym=S.month, cur=ym===TD.slice(0,7);
 const rows=monthWork(ym);
 const acc=rows.filter(r=>r.kind==='accrued'||r.kind==='cancel'), fc=rows.filter(r=>r.kind==='forecast'||r.kind==='unconfirmed'), pend=rows.filter(r=>r.kind==='pending');
 const sc=monthStaffCosts(ym);const staffT=Object.values(sc).reduce((s,v)=>s+v.cost,0);
 const fcT=r2(fc.reduce((s,r)=>s+r.cost,0));
 const restDays=cur?monthDays(ym).filter(d=>d>TD).length:0;const msh=D.shifts.filter(s=>s.date.slice(0,7)===ym);const el=monthDays(ym).filter(d=>d<=TD).length;const shiftFc=cur&&el?Math.round(msh.reduce((s,x)=>s+x.rate,0)/el*restDays):0;
 const fees=D.patients.flatMap(p=>p.fees.filter(f=>f.month===ym).map(f=>({p,f})));
 const incomeT=r2(fees.reduce((s,{f})=>s+feeIls(f),0));
 const progT=r2(D.tx.filter(x=>x.date.slice(0,7)===ym).reduce((s,x)=>s+progExpense(x),0));
 const owedAll=r2(D.staff.reduce((s,st)=>s+Math.max(0,staffOwed(st.id)),0));
 const workRow=r=>{const x=r.x;const n=r.pts.length;
  return`<tr><td class="mono">${fmtDate(r.d)}</td><td>${esc(nm(x.title))} ${typeChip(x.type)}</td><td>${staffName(x.staff)}</td><td class="muted">${r.kind==='cancel'?`${_('ביטול','Cancelled')} · ${x.log.pct??0}%`:esc(basisText(x,x.log.basis&&typeof x.log.basis==='object'?x.log.basis:undefined))}</td>
  <td>${n===1?esc(pat(r.pts[0])?.name||''):`${_('מתחלק בין','Split across')} ${n}`}</td><td>${r.kind==='accrued'?`<span class="pill done">${_('אושר','Confirmed')}</span>`:r.kind==='cancel'?`<span class="pill cancelled">${_('ביטול בתשלום','Paid cancellation')}</span>`:r.kind==='pending'?`<span class="pill warn">${_('ממתין לאישור מנהל','Awaiting manager approval')}</span>`:r.kind==='unconfirmed'?`<span class="pill warn">${_('לא דווח שבוצע','Not reported as done')}</span>`:`<span class="pill planned">${_('תחזית','Forecast')}</span>`}</td><td class="n">${money(r.cost)}</td></tr>`};
 return`<div class="toolbar">${monthNav()}<span style="flex:1"></span><button class="btn" data-a="cancelRule">${_('כלל תשלום בביטול','Cancellation pay rule')}</button><button class="btn primary" data-a="fee">+ ${_('תשלום על טיפול','Treatment payment')}</button></div>
 <div class="kpis"><div class="kpi"><span class="lbl">${_('הכנסות מטיפול','Treatment income')}</span><span class="val">${money(incomeT)}</span><span class="sub">${fees.length} ${_('תשלומים המיוחסים לחודש','payments attributed to the month')}</span></div>
 <div class="kpi"><span class="lbl">${_('עלות שנצברה','Cost accrued')}</span><span class="val">${money(staffT+progT)}</span><span class="sub">${_('צוות','Staff')} ${money(staffT)} · ${_('תוכנית','Program')} ${money(progT)}</span></div>
 <div class="kpi"><span class="lbl">${cur?_('תחזית לסוף החודש','Forecast to month end'):_('לא אושרו','Not confirmed')}</span><span class="val">${money(cur?staffT+progT+fcT+shiftFc:fcT)}</span><span class="sub">${cur?`${_('עוד','Plus')} ${money(fcT)} ${_('מהלו״ז','from the schedule')} + ${money(shiftFc)} ${_('משמרות','shifts')}`:_('פעילויות שלא סומנו כבוצעו','activities never marked done')}</span></div>
 <div class="kpi ${owedAll?'warn':''}"><span class="lbl">${_('חייבים לצוות כרגע','Owed to staff now')}</span><span class="val">${money(owedAll)}</span><span class="sub">${_('עלות שנצברה פחות תשלומים','accrued minus paid')}</span></div></div>
 <section class="card"><div class="card-h"><h2>${_('צוות – עלות שנצברה, תשלום וחוב','Staff – accrued, paid, owed')}</h2></div><div class="tw"><table><thead><tr><th>${_('איש צוות','Staff')}</th><th class="n">${_('מפגשים','Sessions')}</th><th class="n">${_('משמרות','Shifts')}</th><th class="n">${_('משכורת','Salary')}</th><th class="n">${_('נסיעות ובונוסים','Trips & bonuses')}</th><th class="n">${_('נצבר בחודש','Accrued this month')}</th><th class="n">${_('חוב פתוח','Owed now')}</th><th></th></tr></thead><tbody>
 ${D.staff.filter(s=>s.role!=='manager').map(s=>{const v=sc[s.id]||{sessions:0,cancel:0,shifts:0,monthly:0,requests:0,cost:0,n:0};const ow=staffOwed(s.id);return`<tr><td><b>${nm(s.name)}</b> <span class="muted">${ROLES[s.role][S.lang]}</span></td><td class="n">${money(v.sessions+v.cancel)} <span class="muted">(${v.n})</span></td><td class="n">${money(v.shifts)}</td><td class="n">${money(v.monthly)}</td><td class="n">${money(v.requests)}</td><td class="n"><b>${money(v.cost)}</b></td><td class="n ${ow>0?'neg':''}">${money(ow)}</td><td>${ow>0?`<button class="btn sm" data-a="pay" data-v="${s.id}">${_('רישום תשלום','Record payment')}</button>`:''}</td></tr>`}).join('')}</tbody></table></div>
 <p class="hint" style="margin-top:8px">${_('“חוב פתוח” כולל גם החזרי הוצאות ששילמו מכספם. ההחזרים לא נספרים שוב כעלות, כי ההוצאה עצמה כבר נרשמה.','“Owed now” also includes expenses staff paid from their own pocket. Those are not counted again as cost, since the expense itself is already recorded.')}</p></section>
 <section class="card"><div class="card-h"><h2>${_('עלויות מתוך העבודה המתועדת','Costs from documented work')}</h2><span class="hint">${_('עלות קבוצה נרשמת פעם אחת ומתחלקת בין המשתתפים לניתוח בלבד – לא מחייבת את הקופות האישיות.','A group cost is recorded once and split across participants for analysis only – it never touches personal funds.')}</span></div>
 <div class="tw scrolly"><table><thead><tr><th>${_('תאריך','Date')}</th><th>${_('פעילות','Activity')}</th><th>${_('צוות','Staff')}</th><th>${_('תעריף','Rate')}</th><th>${_('משויך ל','Allocated to')}</th><th>${_('מצב','Status')}</th><th class="n">${_('עלות','Cost')}</th></tr></thead><tbody>
 ${acc.length?`<tr class="trh"><td colspan="6">${_('נצבר','Accrued')}</td><td class="n">${money(acc.reduce((s,r)=>s+r.cost,0))}</td></tr>`:''}${acc.slice().reverse().map(workRow).join('')}
 ${pend.length?`<tr class="trh"><td colspan="6">${_('דווח – ממתין לאישורך','Reported – awaiting your approval')} <button class="btn sm" data-a="nav" data-v="approvals">${_('לאישורים','Review')}</button></td><td class="n">${money(pend.reduce((s,r)=>s+r.cost,0))}</td></tr>`:''}${pend.map(workRow).join('')}
 ${fc.length?`<tr class="trh"><td colspan="6">${cur?_('תחזית – מתוכנן בלו״ז','Forecast – planned in the schedule'):_('לא אושר ביצוע','Not confirmed')}</td><td class="n">${money(fcT)}</td></tr>`:''}${fc.map(workRow).join('')}</tbody></table></div></section>
 <section class="card"><div class="card-h"><h2>${_('תשלומים על טיפול','Treatment payments')}</h2><span class="hint">${_('לא נכנסים לקופה האישית של המטופל.','These never go into the patient’s personal fund.')}</span></div><div class="tw"><table><thead><tr><th>${_('מטופל','Patient')}</th><th>${_('תאריך','Date')}</th><th>${_('מיוחס לחודש','For month')}</th><th class="n">${_('סכום','Amount')}</th><th class="n">${_('שער','Rate')}</th><th class="n">₪</th></tr></thead><tbody>
 ${fees.map(({p,f})=>`<tr><td><b>${esc(p.name)}</b></td><td class="mono">${fmtDate(f.date)}</td><td>${monthLbl(f.month)}</td><td class="n">${f.cur==='USD'?'$'+f.amt.toLocaleString('en-US'):money(f.amt)}</td><td class="n mono">${f.cur==='USD'?f.fx.toFixed(2):'—'}</td><td class="n">${money(feeIls(f))}</td></tr>`).join('')||`<tr><td colspan="6">${empty(_('לא נרשמו תשלומים לחודש הזה.','No payments recorded for this month.'))}</td></tr>`}</tbody></table></div></section>`;
}
function finPersonal(){
 const act=activeP();
 const rows=D.tx.filter(x=>okTx(x)&&x.moves.some(m=>m.p.startsWith('patient:'))&&x.kind!=='transfer').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,20);
 const tot=act.reduce((s,p)=>s+bal(p),0);
 return`<p class="hint">${_('כסף שהמטופל או המשפחה הפקידו להוצאות אישיות בלבד. תשלום על הטיפול ועלויות הצוות לא נכנסים ולא יורדים מכאן.','Money the patient or family deposited for personal spending only. Treatment payments and staff costs never go in or come out of here.')}</p>
 ${S.role==='manager'?quickActions([['inPatient','','users',_('הפקדה במזומן','Cash deposit'),_('נכנס לקופת המזומן של המטופל','Goes into the patient’s cash')],['inBank','','chart',_('הפקדה באשראי / העברה','Credit / transfer deposit'),_('נכנס לקופת האשראי של המטופל','Goes into the patient’s credit')],['purchase','','wallet',_('קנייה אישית','Personal purchase'),_('בוחרים אם יורד ממזומן או מאשראי','Choose cash or credit')],['cigPick','','flag',_('סיגריות','Cigarettes'),`${cigN()} ${_('חפיסות פתוחות מול רטורנו','packs open with Retorno')}`]]):`<div class="toolbar"><button class="btn primary" data-a="reportExp">${_('דיווח הוצאה','Report an expense')}</button><span class="hint">${_('היתרות לעיון בלבד. המנהל רושם הפקדות ומסווג הוצאות.','Balances are read-only. The manager records deposits and classifies expenses.')}</span></div>`}
 ${cigN()>=10?`<div class="banner"><b>${_('תזכורת','Reminder')}:</b> ${cigN()} ${_('חפיסות לא הותחשבנו מול רטורנו. כל חפיסה נרשמת פעם אחת בלבד.','packs not yet settled with Retorno. Each pack is counted once.')} ${S.role==='manager'?`<button class="btn sm primary" data-a="settle">${_('סימון כהותחשבן','Mark as settled')}</button>`:''}</div>`:''}
 <section class="card"><div class="card-h"><h2>${_('יתרות אישיות','Personal balances')}</h2><span class="chip">${money(tot)}</span></div><div class="tw"><table><thead><tr><th>${_('מטופל','Patient')}</th><th class="n">${_('הופקד','Deposited')}</th><th class="n">${_('הוצא','Spent')}</th><th class="n">${_('מזומן','Cash')}</th><th class="n">${_('אשראי','Credit')}</th><th class="n">${_('חפיסות פתוחות','Open packs')}</th><th class="n">${_('יתרה','Balance')}</th></tr></thead><tbody>
 ${act.map(p=>{const k=PK(p.id);let inn=0,out=0;D.tx.forEach(x=>{if(x.kind==='transfer'||!okTx(x))return;x.moves.forEach(m=>{if(m.p===k){if(m.d>0)inn+=m.d;else out-=m.d}})});const o=pool(k);
  return`<tr class="click" data-a="openAcc" data-v="${p.id}"><td><b>${esc(p.name)}</b></td><td class="n">${money(inn)}</td><td class="n">${money(out)}</td><td class="n ${o.cash<0?'neg':''}">${money(o.cash)}</td><td class="n ${o.bank<0?'neg':''}">${money(o.bank)}</td><td class="n">${cigN(p.id)||'—'}</td><td class="n ${o.t<0?'neg':''}"><b>${money(o.t)}</b></td></tr>`}).join('')}</tbody></table></div></section>
 <section class="card"><div class="card-h"><h2>${_('תנועות אחרונות בקופות האישיות','Recent personal-fund entries')}</h2></div>${txTable(rows,'patient:')}</section>`;
}
function finMine(){
 const mine=D.tx.filter(x=>x.by===me()&&(x.report||x.kind==='exp')).sort((a,b)=>b.date.localeCompare(a.date));
 const st=x=>x.status==='pending'?`<span class="pill warn">${_('ממתין לסיווג המנהל','Awaiting the manager')}</span>`:x.status==='rejected'?`<span class="pill bad">${_('נדחה','Rejected')}</span>`:`<span class="pill ok">${_('אושר','Approved')}</span>`;
 return`<div class="toolbar"><button class="btn primary" data-a="reportExp">${_('דיווח הוצאה','Report an expense')}</button><span class="hint">${_('מדווחים כל פריט ועל מה הוצא. המנהל מסווג ומאשר.','Report each item and what it was for. The manager classifies and approves.')}</span></div>
 <section class="card"><div class="card-h"><h2>${_('ההוצאות שדיווחתי','Expenses I reported')}</h2><span class="chip">${mine.length}</span></div>
 <div class="list">${mine.map(x=>`<div class="appr"><div class="grow"><div class="t">${fmtDate(x.date)} · ${methodLbl(x.method)}</div>${x.items?`<ul class="items">${x.items.map(i=>`<li><span dir="auto">${esc(i.desc)}</span><b class="num">${money(i.amount)}</b></li>`).join('')}</ul>`:`<div class="s" dir="auto">${esc(nm(x.desc))}</div>`}${x.status==='approved'&&x.moves.length?`<div class="chips">${groupMoves(x).map(g=>`<span class="chip">${esc(poolName(g.p))} ${money(-g.d)}</span>`).join('')}</div>`:''}</div><b class="num">${money(x.amount)}</b>${st(x)}</div>`).join('')||empty(_('עוד לא דיווחת הוצאות.','You have not reported any expenses yet.'))}</div></section>`;
}
function finBox(){
 const ps=poolStats();const mgr=S.role==='manager';
 const act=activeP();
 const cashRows=[['retorno',pool('retorno').cash],...act.map(p=>[PK(p.id),pool(PK(p.id)).cash]),['program',pool('program').cash]].filter(r=>Math.abs(r[1])>.004);
 const bankRows=[['retorno',pool('retorno').bank],...act.map(p=>[PK(p.id),pool(PK(p.id)).bank]),['program',pool('program').bank]].filter(r=>Math.abs(r[1])>.004);
 const sumPools=Object.values(ps.pools).reduce((s,o)=>s+o.t,0);
 const recvd=D.tx.filter(x=>x.kind==='in'&&x.moves[0].p==='retorno').reduce((s,x)=>s+x.amount,0);
 const progRows=D.tx.filter(x=>progExpense(x)>0).sort((a,b)=>b.date.localeCompare(a.date));
 const spent=progRows.reduce((s,x)=>s+progExpense(x),0);
 const noRcpt=progRows.filter(x=>!x.receipt);
 const cardOut=D.tx.filter(x=>x.method==='card').reduce((s,x)=>s+x.amount,0);
 const split=(rows,total)=>`<div class="list">${rows.map(([k,v])=>`<div class="row"><div class="grow"><div class="t">${esc(poolName(k))}</div></div><div class="sbw"><div class="bar"><i style="width:${total>0?Math.max(0,Math.min(100,v/total*100)):0}%"></i></div></div><b class="num ${v<0?'neg':''}">${money(v)}</b></div>`).join('')||empty('—')}</div>`;
 return`${quickActions([['inRetorno','','wallet',_('קבלת מזומן מרטורנו','Cash from Retorno'),_('נכנס לקופה ולכספי רטורנו','Adds to the box and Retorno funds')],['expense','','pen',_('רישום הוצאה','Record expense'),_('איך שולם ועל חשבון מי','How paid and who bears it')],['inBank','','chart',_('קבלת העברה בנקאית','Bank transfer received'),_('מעדכן חשבון, לא את המזומן','Updates the account, not the cash')]])}
 <div class="grid2 even"><section class="card cashbox"><div class="card-h"><h2>${_('מזומן פיזי בקופה','Physical cash')}</h2><span class="big">${money(ps.cash)}</span></div><p class="hint">${_('למי שייך המזומן שבידך:','Who the cash in your hands belongs to:')}</p>${split(cashRows,ps.cash)}
  <div class="okline ${Math.abs(cashRows.reduce((s,r)=>s+r[1],0)-ps.cash)<.01?'ok':'bad'}">${_('סכום החלקים שווה למזומן בקופה','The parts add up to the cash in hand')} ✓</div></section>
 <section class="card cashbox"><div class="card-h"><h2>${_('אשראי ובנק','Credit and bank')}</h2><span class="big">${money(ps.bank)}</span></div><p class="hint">${_('העברות שהתקבלו פחות חיובי אשראי, לפי בעלים. סכום שלילי הוא חיוב באשראי שעוד לא כוסה.','Transfers received minus credit charges, by owner. A negative amount is a credit charge not yet covered.')}</p>${split(bankRows,ps.bank)}</section></div>
 <div class="grid2"><section class="card"><div class="card-h"><h2>${_('הוצאות התוכנית','Program spending')}</h2>${noRcpt.length?`<span class="pill warn">${noRcpt.length} ${_('בלי קבלה','without receipt')}</span>`:`<span class="pill ok">${_('כל הקבלות התקבלו','All receipts in')}</span>`}</div>
  <p class="hint">${_('אותו רישום מעדכן את הקופה וגם את עלות התוכנית בדוח החודשי.','The same record updates the box and the program cost in the monthly report.')}</p>
  <div class="tw scrolly"><table><thead><tr><th>${_('תאריך','Date')}</th><th>${_('פירוט','Details')}</th><th>${_('קטגוריה','Category')}</th><th>${_('איך שולם','How paid')}</th><th class="n">${_('על התוכנית','Program share')}</th><th>${_('קבלה','Receipt')}</th></tr></thead><tbody>
  ${progRows.map(x=>`<tr><td class="mono">${fmtDate(x.date)}</td><td dir="auto">${esc(nm(x.desc))}${x.moves.some(m=>m.p.startsWith('patient:'))?` <span class="chip">${_('משולב עם מטופלים','Shared with patients')}</span>`:''}</td><td>${nm(CATS[x.cat||'other'])}</td><td class="muted">${methodLbl(x.method)}</td><td class="n">${money(progExpense(x))}</td><td><button class="chip ${x.receipt?'on':''}" data-a="receipt" data-v="${x.id}" aria-pressed="${!!x.receipt}">${x.receipt?_('התקבלה','In'):_('חסרה','Missing')}</button></td></tr>`).join('')}</tbody></table></div></section>
 <div class="stack"><div class="kpis two"><div class="kpi"><span class="lbl">${_('כספי רטורנו – יתרה','Retorno funds – balance')}</span><span class="val">${money(pool('retorno').t)}</span><span class="sub">${_('התקבל','Received')} ${money(recvd)}</span></div>
  <div class="kpi"><span class="lbl">${_('קרן התוכנית','Program fund')}</span><span class="val">${money(pool('program').t)}</span><span class="sub">${_('יתרות מחשבונות שנסגרו','left from closed accounts')}</span></div></div>
  <section class="card"><div class="card-h"><h2>${_('התחייבויות ובדיקה','Obligations & check')}</h2></div><div class="list">
   <div class="row"><div class="grow t">${_('חיובים בכרטיס אשראי','Credit-card charges')}</div><b class="num">${money(cardOut)}</b></div>
   ${mgr?`<div class="row"><div class="grow t">${_('חוב לצוות','Owed to staff')}</div><b class="num">${money(D.staff.reduce((s,st)=>s+Math.max(0,staffOwed(st.id)),0))}</b></div>`:''}
   <div class="row"><div class="grow t">${_('סיגריות לא מותחשבנות','Unsettled cigarettes')}</div><b class="num">${cigN()} · ${money(cigAmt())}</b></div></div>
   <p class="hint" style="margin-top:8px">${_('בדיקת התאמה: מזומן + אשראי ובנק − הוצאות ששילם הצוות מכיסו = סך כל היתרות','Check: cash + credit and bank − expenses staff paid themselves = total of all balances')} (${money(sumPools)}) ${Math.abs(ps.cash+ps.bank+ps.other-sumPools)<.01?'✓':'✗'}</p></section>
  ${mgr?`<section class="card"><div class="card-h"><h2>${_('הגדרות','Settings')}</h2><button class="btn sm" data-a="settings">${_('עריכה','Edit')}</button></div><dl class="kv"><dt>${_('מחיר חפיסה','Pack price')}</dt><dd>${money(D.settings.cigPrice)}</dd><dt>${_('החזר לק״מ','Per km')}</dt><dd>${money(D.settings.kmRate)}</dd><dt>${_('שער דולר','USD rate')}</dt><dd>${D.settings.fx}</dd></dl></section>`:''}
  ${mgr?rulesCard():''}</div></div>`;
}
function rulesCard(){
 return`<section class="card"><div class="card-h"><h2>${_('כללי חלוקה','Split rules')}</h2><button class="btn sm" data-a="addRule">+ ${_('כלל','Rule')}</button></div>
 <p class="hint">${_('כלל מציע חלוקה בעת רישום הוצאה. המערכת לא מחלקת לבד – תמיד מאשרים לפני שמירה.','A rule suggests a split when recording an expense. Nothing is split automatically; you always confirm before saving.')}</p>
 <div class="list">${D.settings.rules.map(r=>`<div class="row"><div class="grow"><div class="t">${esc(nm(r.name))}</div><div class="s">${ruleText(r)}</div></div><button class="btn sm ghost danger" data-a="delRule" data-v="${r.id}">${_('מחיקה','Delete')}</button></div>`).join('')}</div></section>`;
}
const ruleText=r=>[r.retorno&&`${_('רטורנו','Retorno')} ${r.retorno}%`,r.patients&&`${_('מטופלים נבחרים, בחלקים שווים','selected patients, equal shares')} ${r.patients}%`,r.program&&`${_('קרן התוכנית','Program fund')} ${r.program}%`].filter(Boolean).join(' · ');

function vSummary(){
 const mineList=D.summaries.filter(s=>S.role==='manager'||s.author===me()||s.status==='published').sort((a,b)=>b.date.localeCompare(a.date));
 let cur=S.sumId&&D.summaries.find(s=>s.id===S.sumId);
 const list=`<section class="card"><div class="card-h"><h2>${_('סיכומים','Summaries')}</h2><button class="btn sm" data-a="newSum">+ ${_('חדש','New')}</button></div><div class="list">
  ${mineList.map(s=>`<button class="prow ${cur&&cur.id===s.id?'on':''}" data-a="openSum" data-v="${s.id}"><div class="grow"><div class="t">${fmtDate(s.date,{weekday:'short',day:'numeric',month:'short'})} · ${staffName(s.author)}</div><div class="s" dir="auto">${esc(trim(s.general||s.original,80))}</div></div>${s.status==='published'?`<span class="pill ok">${_('פורסם','Published')}</span>`:`<span class="pill warn">${_('טיוטה','Draft')}</span>`}</button>`).join('')||empty(_('אין סיכומים עדיין.','No summaries yet.'))}</div></section>`;
 let main;
 if(!cur){main=composeCard(null)}
 else if(cur.status==='published'||cur.author!==me()&&S.role!=='manager'){main=publishedCard(cur)}
 else if(cur.stage==='review'){main=reviewCard(cur)}
 else main=composeCard(cur);
 return`<div class="page-h"><div><p class="eyebrow">${fmtDate(TD,{weekday:'long',day:'numeric',month:'long'})}</p><h1>${_('סיכום יום','Daily summary')}</h1></div></div>
 <div class="grid2"><div class="stack">${main}</div><div class="stack">${list}</div></div>`;
}
function composeCard(s){
 const act=activeP();const tagged=new Set(s?.tags||[]);
 return`<section class="card"><div class="card-h"><h2>${s?_('המשך כתיבה','Keep writing'):_('מה היה היום?','How did today go?')}</h2></div><div class="form">
 <div class="fr">${fld('sd',_('תאריך','Date'),`<input id="sd" type="date" value="${s?.date||TD}">`)}<div class="f"><span class="lab">${_('הקלטה','Recording')}</span><button class="btn" disabled title="${_('בגרסה המלאה','In the full version')}">${ic('mic')} ${_('הקלטה ותמלול – בגרסה המלאה','Record & transcribe – full version')}</button></div></div>
 <div class="f"><label for="so">${_('הסיכום שלך, בעברית או באנגלית','Your summary, in Hebrew or English')}</label><textarea id="so" dir="auto" style="min-height:180px" placeholder="${_('כתבו בחופשיות: מה קרה, מי היה מעורב, מה נאמר, מה נעשה...','Write freely: what happened, who was involved, what was said, what was done...')}">${esc(s?.original||'')}</textarea>
  <span class="hint">${_('בטלפון אפשר ללחוץ על המיקרופון במקלדת ולהכתיב.','On a phone you can tap the keyboard microphone and dictate.')}</span></div>
 <div class="f"><span class="lab">${_('מטופלים שמוזכרים (לא חובה)','Patients mentioned (optional)')}</span><div class="checks">${act.map(p=>`<label><input type="checkbox" class="stg" value="${p.id}" ${tagged.has(p.id)?'checked':''}>${esc(p.name)}</label>`).join('')}</div>
  <span class="hint">${_('החלק של כל מטופל יופיע גם בתיק שלו, בלי להעתיק ידנית.','Each patient’s part also appears in their file, with no copying by hand.')}</span></div>
 <div class="toolbar">${SAMPLE?`<button class="btn primary" data-a="aiSum" data-v="${s?.id||''}">${_('ארגון הסיכום עם AI','Organize with AI')}</button>`:''}<button class="btn ${SAMPLE?'':'primary'}" data-a="manualSum" data-v="${s?.id||''}">${_('המשך בלי AI','Continue without AI')}</button></div>
 <p class="hint" id="aiStat">${SAMPLE?_('ה־AI מסדר וממשפר ניסוח בלבד: לא מוסיף, לא משמיט ולא משנה חומרה. דברים לא ברורים מסומנים לבדיקה. המקור נשמר.','The AI only organizes and polishes wording: it adds nothing, drops nothing and keeps severity as is. Unclear points are flagged for you to check. The original is kept.'):_('ארגון עם AI זמין כשהעמוד פתוח בתוך Claude.','AI organizing is available when the page is opened inside Claude.')}</p></div></section>`;
}
function reviewCard(s){
 const act=activeP();
 return`<section class="card"><div class="card-h"><h2>${_('בדיקה ואישור לפני פרסום','Review and approve before publishing')}</h2>${s.aiUsed?`<span class="chip">${_('נוסח ע״י AI – לבדיקה','AI draft – needs review')}</span>`:''}</div><div class="form">
 <details class="orig"><summary>${_('הנוסח המקורי (נשמר)','Original text (kept)')}</summary><div class="note-b" dir="auto">${esc(s.original)}</div></details>
 ${s.unclear&&s.unclear.length?`<div class="banner warnb"><div><b>${_('לבדיקה – לא ברור מהמקור','To check – unclear in the original')}:</b><ul>${s.unclear.map(u=>`<li dir="auto">${esc(u)}</li>`).join('')}</ul></div></div>`:''}
 <div class="f"><label for="sg">${_('כללי – על היום','General – about the day')}</label><textarea id="sg" dir="auto">${esc(s.general)}</textarea></div>
 ${s.parts.map((x,i)=>`<div class="f ppart"><label for="sp_${i}">${esc(pat(x.pid)?.name||'')}</label><textarea id="sp_${i}" data-pid="${x.pid}" dir="auto">${esc(x.text)}</textarea><button class="btn sm ghost danger" data-a="rmPart" data-v="${i}">${_('הסרה','Remove')}</button></div>`).join('')}
 <div class="toolbar"><select id="addPid" aria-label="${_('הוספת מטופל','Add patient')}"><option value="">${_('+ הוספת חלק למטופל','+ Add a patient section')}</option>${act.filter(p=>!s.parts.some(x=>x.pid===p.id)).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
 ${s.unclear&&s.unclear.length?`<label class="toggle"><input type="checkbox" id="chk">${_('בדקתי את הנקודות שסומנו','I checked the flagged points')}</label>`:''}
 <div class="toolbar"><button class="btn primary" data-a="pubSum" data-v="${s.id}">${_('אישור ופרסום לצוות','Approve and publish')}</button><button class="btn" data-a="draftSum" data-v="${s.id}">${_('שמירת טיוטה','Save draft')}</button><button class="btn ghost" data-a="backSum" data-v="${s.id}">${_('חזרה לעריכת המקור','Back to the original')}</button></div></div></section>`;
}
function publishedCard(s){
 return`<section class="card"><div class="card-h"><h2>${fmtDate(s.date,{weekday:'long',day:'numeric',month:'long'})} · ${staffName(s.author)}</h2>${s.status==='published'?`<span class="pill ok">${_('פורסם','Published')}</span>`:`<span class="pill warn">${_('טיוטה','Draft')}</span>`}</div>
 <div class="form"><div class="note-b" dir="auto">${esc(s.general)}</div>
 ${s.parts.map(x=>`<div class="ppub"><button class="link" data-a="openP" data-v="${x.pid}">${esc(pat(x.pid)?.name||'')}</button><div class="note-b" dir="auto">${esc(x.text)}</div></div>`).join('')}
 <details class="orig"><summary>${_('הנוסח המקורי','Original text')}${s.aiUsed?` · ${_('נוסח ערוך בעזרת AI ואושר ע״י הכותב/ת','edited with AI help, approved by the author')}`:''}</summary><div class="note-b" dir="auto">${esc(s.original)}</div></details></div></section>`;
}

function compText(s){const c=s.comp||{};const out=[];
 const f=(k,l)=>{if(c[k]&&c[k].amt)out.push(`${l} ${money(c[k].amt)} ${nm(PER[c[k].per||'session'])}`)};
 f('individual',_('פרטני','Individual'));f('group',_('קבוצה','Group'));f('activity',_('פעילות','Activity'));
 if(c.shift)out.push(`${_('משמרת','Shift')} ${money(c.shift)}`);if(c.monthly)out.push(`${_('חודשי','Monthly')} ${money(c.monthly)}`);
 return out.join(' · ')||'—'}
function vStaff(){
 const mgr=S.role==='manager';
 const kindL={trip:_('נסיעה ברכב פרטי','Private-car trip'),reimb:_('החזר הוצאה','Reimbursement'),bonus:_('בונוס','Bonus')};
 const reqs=D.requests.filter(r=>mgr||r.staff===me()).sort((a,b)=>b.date.localeCompare(a.date));
 const st=r=>r.status==='pending'?`<span class="pill warn">${_('ממתין','Pending')}</span>`:r.status==='rejected'?`<span class="pill bad">${_('נדחה','Rejected')}</span>`:`<span class="pill done">${_('אושר','Approved')}</span>`;
 const myShifts=D.shifts.filter(s=>s.staff===me()&&s.date.slice(0,7)===TD.slice(0,7));
 let h=`<div class="page-h"><div><p class="eyebrow">${mgr?_('תעריפים, הרשאות ואישורים','Rates, access and approvals'):_('הדיווחים והבקשות שלי','My reports and requests')}</p><h1>${_('צוות','Staff')}</h1></div>
 <div class="acts">${mgr?`<button class="btn primary" data-a="staffEdit">+ ${_('איש צוות','Staff member')}</button>`:''}${S.role==='counselor'?`<button class="btn primary" data-a="shift">${_('דיווח משמרת','Report a shift')}</button>`:''}${S.role!=='therapist'?`<button class="btn" data-a="req" data-v="trip">${_('דיווח נסיעה','Log a trip')}</button><button class="btn" data-a="req" data-v="reimb">${_('בקשת החזר','Request reimbursement')}</button>`:''}${mgr?`<button class="btn" data-a="req" data-v="bonus">${_('רישום בונוס','Record bonus')}</button>`:''}</div></div>`;
 if(mgr){
  h+=`<section class="card"><div class="card-h"><h2>${_('אנשי צוות ותעריפים','Team and rates')}</h2><span class="hint">${_('אפשר תעריף שונה לפרטני, לקבוצה ולפעילות – למפגש או לשעה – וגם למשמרת או לחודש.','Separate rates for individual, group and activity – per session or per hour – plus per shift or per month.')}</span></div><div class="tw"><table><thead><tr><th>${_('שם','Name')}</th><th>${_('תפקיד','Role')}</th><th>${_('טלפון','Phone')}</th>${SH.on?`<th>${_('חשבון מחובר','Linked account')}</th>`:''}<th>${_('תעריפים','Rates')}</th><th></th></tr></thead><tbody>
  ${D.staff.map(s=>{const lk=Object.entries(SH.links).filter(([,v])=>v===s.id).map(([u])=>u);return`<tr><td><b>${esc(nm(s.name))}</b>${s.demo?` <span class="chip">${_('דוגמה','Demo')}</span>`:''}</td><td>${ROLES[s.role][S.lang]}</td><td class="mono">${esc(s.phone||'—')}${window.RETORNO_SUPA?`<div class="s" dir="ltr">${s.username?'👤 '+esc(s.username):`<span class="muted">${_('אין שם משתמש','No username')}</span>`}</div>`:''}</td>${SH.on?`<td>${lk.length?lk.map(u=>`<span class="chip"><span data-uname="${u}">${_('מחובר','Linked')}</span> <button class="link" data-a="unlink" data-v="${u}">${_('ניתוק','Unlink')}</button></span>`).join(' '):`<span class="muted">${_('טרם התחבר','Not linked yet')}</span>`}</td>`:''}<td class="muted">${compText(s)}</td><td style="white-space:nowrap"><button class="btn sm ghost" data-a="staffEdit" data-v="${s.id}">${_('פרטים','Details')}</button>${s.role!=='manager'&&s.role!=='admissions'?` <button class="btn sm ghost" data-a="comp" data-v="${s.id}">${_('תעריפים','Rates')}</button>`:''}</td></tr>`}).join('')}</tbody></table></div>
  <p class="hint" style="margin-top:10px">${_('שינוי תעריף חל על עבודה שתאושר מעכשיו. מפגשים שכבר אושרו שומרים את העלות שנרשמה להם.','A rate change applies to work confirmed from now on. Sessions already confirmed keep the cost recorded for them.')}</p></section>`;
 }else if(S.role==='counselor'){
  h+=`<section class="card"><div class="card-h"><h2>${_('המשמרות שלי החודש','My shifts this month')}</h2><span class="chip">${myShifts.length}</span></div><div class="list">${myShifts.slice(-8).reverse().map(s=>`<div class="row"><div class="grow"><div class="t">${fmtDate(s.date,{weekday:'long',day:'numeric',month:'short'})}</div><div class="s">${SHIFTS[s.kind]?SHIFTS[s.kind][S.lang]:s.kind}</div></div><b class="num">${money(s.rate)}</b></div>`).join('')||empty(_('עוד לא דווחו משמרות החודש.','No shifts reported this month.'))}</div></section>`;
 }
 h+=`<section class="card"><div class="card-h"><h2>${mgr?_('בקשות לאישור חודשי','Requests for monthly approval'):_('הבקשות שלי','My requests')}</h2>${mgr?`<span class="hint">${_('תשלום בפועל נרשם במסך הכספים, “הכנסות ועלויות”.','Actual payments are recorded under Finance, “Income & costs”.')}</span>`:''}</div>
 <div class="tw"><table><thead><tr><th>${_('תאריך','Date')}</th>${mgr?`<th>${_('איש צוות','Staff')}</th>`:''}<th>${_('סוג','Type')}</th><th>${_('פירוט','Details')}</th><th class="n">${_('סכום','Amount')}</th><th>${_('מצב','Status')}</th>${mgr?'<th></th>':''}</tr></thead><tbody>
 ${reqs.map(r=>`<tr><td class="mono">${fmtDate(r.date)}</td>${mgr?`<td>${staffName(r.staff)}</td>`:''}<td>${kindL[r.kind]}${D.tx.some(t=>t.reqId===r.id)?` <span class="chip">${_('מקושר להוצאה','Linked to expense')}</span>`:''}</td><td dir="auto">${esc(nm(r.desc))}${r.kind==='trip'?` <span class="muted">(${r.km} ${_('ק״מ','km')})</span>`:''}</td><td class="n">${money(reqAmount(r))}</td><td>${st(r)}</td>${mgr?`<td style="white-space:nowrap">${r.status==='pending'?`<button class="btn sm primary" data-a="approve" data-v="${r.id}">${_('אישור','Approve')}</button> <button class="btn sm ghost danger" data-a="reject" data-v="${r.id}">${_('דחייה','Reject')}</button>`:''}</td>`:''}</tr>`).join('')||`<tr><td colspan="7">${empty(_('אין בקשות.','No requests.'))}</td></tr>`}</tbody></table></div></section>`;
 return h;
}

function vReports(){
 const tabs=[['month',_('דוח חודשי','Monthly report')],['calc',_('מחשבון עלות','Cost calculator')]];
 const body=S.rtab==='calc'?repCalc():repMonth();
 return`<div class="page-h"><div><p class="eyebrow">${S.rtab==='calc'?_('תרחישים לפי הנחות שאפשר לשנות','Scenarios from assumptions you can change'):_('מה שקרה בפועל, לפי הרישומים','What actually happened, from the records')}</p><h1>${_('דוחות','Reports')}</h1></div>
 ${S.rtab!=='calc'?`<div class="acts"><button class="btn" data-a="exportX">${_('ייצוא ל־Excel','Export to Excel')}</button><button class="btn" data-a="exportP">${_('ייצוא ל־PDF','Export to PDF')}</button></div>`:''}</div>
 <div class="tabs" role="tablist">${tabs.map(t=>`<button class="tab ${S.rtab===t[0]||(!S.rtab&&t[0]==='month')?'on':''}" role="tab" data-a="rtab" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>${body}`;
}
function repMonth(){
 const R=monthReport(S.month);S._rep=R;
 const progLines=Object.entries(R.prog).map(([c,v])=>`<div class="row"><div class="grow">${nm(CATS[c]||CATS.other)}</div><b class="num">${money(v)}</b></div>`).join('');
 const staffRows=D.staff.filter(s=>R.sc[s.id]).map(s=>{const v=R.sc[s.id];const paidM=r2(D.payments.filter(p=>p.staff===s.id&&p.date.slice(0,7)===S.month).reduce((t,p)=>t+p.amount,0));return{s,v,paidM,owed:staffOwed(s.id)}});
 return`<div class="toolbar">${monthNav()}<span class="hint">${S.month===TD.slice(0,7)?_('החודש עדיין פתוח – הנתונים עד היום.','The month is still open – figures up to today.'):''}</span></div>
 <div id="rep" class="stack"><h2 class="rep-title">Retorno · ${_('דוח חודשי','Monthly report')} · ${monthLbl(S.month)}</h2>
 <div class="kpis"><div class="kpi"><span class="lbl">${_('הכנסות מטיפול','Treatment income')}</span><span class="val">${money(R.incomeT)}</span><span class="sub">${_('מיוחסות לחודש','attributed to the month')}</span></div>
 <div class="kpi"><span class="lbl">${_('סך עלויות','Total costs')}</span><span class="val">${money(R.totalCost)}</span><span class="sub">${_('צוות','Staff')} ${money(R.staffT)} · ${_('תוכנית','Program')} ${money(R.progT)}</span></div>
 <div class="kpi ${R.net<0?'warn':''}"><span class="lbl">${R.net>=0?_('רווח','Profit'):_('הפסד','Loss')}</span><span class="val ${R.net<0?'neg':'pos'}">${money(R.net)}</span><span class="sub">${_('לפי הנתונים שנרשמו','from recorded data')}</span></div>
 <div class="kpi"><span class="lbl">${_('עלות למטופל בחודש','Cost per patient-month')}</span><span class="val">${money(R.costPerPatient)}</span><span class="sub">${_('בממוצע','average')} ${R.avgPatients.toFixed(1)} ${_('מטופלים','patients')}</span></div></div>
 <div class="grid2"><section class="card"><div class="card-h"><h2>${_('רווח והפסד','Profit and loss')}</h2></div><div class="list">
  <div class="row"><div class="grow t">${_('הכנסות מטיפול','Treatment income')}</div><b class="num pos">${money(R.incomeT)}</b></div>
  <div class="row"><div class="grow t">${_('מפגשים ופעילויות (מטפלים ומנחים)','Sessions & activities (therapists, instructors)')}</div><b class="num">−${money(R.workT)}</b></div>
  <div class="row"><div class="grow t">${_('משמרות, משכורות, נסיעות ובונוסים','Shifts, salaries, trips & bonuses')}</div><b class="num">−${money(R.staffT-R.workT)}</b></div>
  ${progLines?`<div class="row"><div class="grow t">${_('הוצאות תוכנית נוספות','Other program spending')}</div><b class="num">−${money(R.progT)}</b></div><div class="sub-list">${progLines}</div>`:''}
  <div class="row total"><div class="grow t">${R.net>=0?_('רווח','Profit'):_('הפסד','Loss')}</div><b class="num ${R.net<0?'neg':'pos'}">${money(R.net)}</b></div></div>
  <p class="hint" style="margin-top:8px">${_('הפקדות אישיות של מטופלים והעברות פנימיות לא נספרות כהכנסה מטיפול.','Patients’ personal deposits and internal transfers are not counted as treatment income.')}</p></section>
 <section class="card"><div class="card-h"><h2>${_('פעילות','Activity')}</h2></div><div class="list">
  <div class="row"><div class="grow">${_('מפגשים פרטניים','Individual sessions')}</div><b class="num">${R.sessions}</b></div>
  <div class="row"><div class="grow">${_('פעילויות שבוטלו','Cancelled activities')}</div><b class="num">${R.cancels}</b></div>
  <div class="row"><div class="grow">${_('נוכחות','Attendance')}</div><b class="num">${R.attRate}%</b></div>
  <div class="row"><div class="grow">${_('ימי מטופל','Patient-days')}</div><b class="num">${R.pd}</b></div></div></section></div>
 <section class="card"><div class="card-h"><h2>${_('עלות והכנסה לפי מטופל','Cost and income per patient')}</h2><span class="hint">${_('ישיר = מפגשים פרטניים וחלק בקבוצות שהשתתף בהן. משותף = משמרות, משכורות והוצאות תוכנית, לפי ימי שהייה.','Direct = individual sessions plus a share of groups attended. Shared = shifts, salaries and program spending, by days present.')}</span></div>
  <div class="tw"><table><thead><tr><th>${_('מטופל','Patient')}</th><th class="n">${_('ימים','Days')}</th><th class="n">${_('ישיר','Direct')}</th><th class="n">${_('משותף','Shared')}</th><th class="n">${_('עלות','Cost')}</th><th class="n">${_('הכנסה','Income')}</th><th class="n">${_('נטו','Net')}</th></tr></thead><tbody>
  ${R.pts.map(r=>`<tr><td><b>${esc(pat(r.id)?.name||'')}</b></td><td class="n">${r.days}</td><td class="n">${money(r.direct)}</td><td class="n">${money(r.share)}</td><td class="n"><b>${money(r.cost)}</b></td><td class="n">${money(r.income)}</td><td class="n ${r.net<0?'neg':'pos'}">${money(r.net)}</td></tr>`).join('')}</tbody></table></div></section>
 <section class="card"><div class="card-h"><h2>${_('לפי איש צוות','By staff member')}</h2></div><div class="tw"><table><thead><tr><th>${_('איש צוות','Staff')}</th><th class="n">${_('עלות בחודש','Cost this month')}</th><th class="n">${_('שולם בחודש','Paid this month')}</th><th class="n">${_('טרם שולם (כולל)','Still owed (total)')}</th></tr></thead><tbody>
  ${staffRows.map(r=>`<tr><td><b>${nm(r.s.name)}</b> <span class="muted">${ROLES[r.s.role][S.lang]}</span></td><td class="n">${money(r.v.cost)}</td><td class="n">${money(r.paidM)}</td><td class="n ${r.owed>0?'neg':''}">${money(r.owed)}</td></tr>`).join('')}</tbody></table></div></section></div>`;
}
function calcDefaults(){
 let groupWeek=0;for(let d=0;d<7;d++)(D.template[d]||[]).forEach(x=>{if(x.type!=='individual'&&x.type!=='transport')groupWeek+=rateCost({...x})});
 const indRates=D.staff.map(s=>s.comp&&s.comp.individual&&s.comp.individual.amt).filter(Boolean);
 let indCount=0;for(let d=0;d<7;d++)(D.template[d]||[]).forEach(x=>{if(x.type==='individual')indCount++});
 const shiftsPerDay=2,shiftRate=450;
 return{n:activeP().length||1,groupMonth:Math.round(groupWeek*4.33),shiftsMonth:Math.round(shiftsPerDay*shiftRate*26),salaries:D.staff.reduce((s,x)=>s+((x.comp&&x.comp.monthly)||0),0),otherFixed:3000,
  indPerWeek:Math.max(1,Math.round(indCount/Math.max(1,activeP().length)*2)/2),indRate:indRates.length?Math.round(indRates.reduce((a,b)=>a+b,0)/indRates.length):300,varPer:1200,revUsd:10000,fx:D.settings.fx};
}
function repCalc(){
 const c=S.calc||(S.calc=calcDefaults());
 const fixed=c.groupMonth+c.shiftsMonth+c.salaries+c.otherFixed;
 const varPer=c.indPerWeek*4.33*c.indRate+c.varPer;
 const rows=[1,2,3,4,5,6,7,8].map(n=>{const total=Math.round(fixed+varPer*n);return{n,total,per:Math.round(total/n),rev:Math.round(c.revUsd*c.fx*n),groupPer:Math.round(c.groupMonth/n)}});
 const maxPer=Math.max(...rows.map(r=>r.per));
 const inp=(k,l,step)=>`<div class="f"><label for="c_${k}">${l}</label><input id="c_${k}" data-calc="${k}" type="number" inputmode="decimal" step="${step||1}" value="${c[k]}"></div>`;
 const W=560,H=180,pl=48,pb=24,bw=(W-pl)/8;
 const chart=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${_('עלות למטופל לפי מספר מטופלים','Cost per patient by number of patients')}" style="width:100%;height:auto;direction:ltr">
  ${[0,.5,1].map(f=>{const y=8+(H-pb-8)*(1-f);return`<line class="gl" x1="${pl}" x2="${W}" y1="${y}" y2="${y}"/><text x="${pl-6}" y="${y+4}" text-anchor="end">${Math.round(maxPer*f/1000)}k</text>`}).join('')}
  ${rows.map((r,i)=>{const h=(H-pb-8)*r.per/maxPer;const x=pl+i*bw+6;return`<rect class="b ${r.n===c.n?'':'dim'}" x="${x}" y="${H-pb-h}" width="${bw-12}" height="${h}" rx="3"><title>${money(r.per)}</title></rect><text x="${x+(bw-12)/2}" y="${H-6}" text-anchor="middle">${r.n}</text>`}).join('')}</svg>`;
 const sel=rows.find(r=>r.n===c.n)||rows[0];
 return`<div class="grid2"><section class="card"><div class="card-h"><h2>${_('תחזית לחודש','Monthly projection')}</h2><button class="btn sm ghost" data-a="calcReset">${_('איפוס להנחות מהנתונים','Reset to data-based assumptions')}</button></div>
  <div class="f"><label for="c_n">${_('מספר מטופלים','Number of patients')}: <b>${c.n}</b></label><input id="c_n" data-calc="n" type="range" min="1" max="8" value="${c.n}"></div>
  <div class="kpis two" style="margin-top:12px"><div class="kpi"><span class="lbl">${_('עלות חודשית כוללת','Total monthly cost')}</span><span class="val">${money(sel.total)}</span><span class="sub">${_('קבוע','Fixed')} ${money(fixed)} + ${_('משתנה','variable')} ${money(Math.round(varPer*sel.n))}</span></div>
  <div class="kpi"><span class="lbl">${_('עלות למטופל','Cost per patient')}</span><span class="val">${money(sel.per)}</span><span class="sub">${_('הכנסה למטופל','Income per patient')} ${money(c.revUsd*c.fx)}</span></div></div>
  <div class="tw" style="margin-top:12px">${chart}</div>
  <div class="tw"><table><thead><tr><th class="n">${_('מטופלים','Patients')}</th><th class="n">${_('עלות כוללת','Total cost')}</th><th class="n">${_('למטופל','Per patient')}</th><th class="n">${_('קבוצות למשתתף','Groups per participant')}</th><th class="n">${_('הכנסה','Income')}</th><th class="n">${_('תוצאה','Result')}</th></tr></thead><tbody>
  ${rows.map(r=>`<tr class="${r.n===c.n?'trh':''}"><td class="n">${r.n}</td><td class="n">${money(r.total)}</td><td class="n">${money(r.per)}</td><td class="n">${money(r.groupPer)}</td><td class="n">${money(r.rev)}</td><td class="n ${r.rev-r.total<0?'neg':'pos'}">${money(r.rev-r.total)}</td></tr>`).join('')}</tbody></table></div>
  <p class="hint" style="margin-top:8px">${_('עלות קבוצה לא משתנה עם מספר המשתתפים, רק העלות הממוצעת למשתתף. כל טיפול פרטני נוסף מגדיל את העלות הכוללת.','A group costs the same whatever the number of participants; only the average per participant changes. Each added individual session raises the total.')}</p></section>
 <section class="card"><div class="card-h"><h2>${_('הנחות','Assumptions')}</h2></div><div class="form">
  <p class="eyebrow">${_('עלויות קבועות לחודש','Fixed monthly costs')}</p>
  <div class="fr">${inp('groupMonth',_('קבוצות ופעילויות ₪','Groups & activities ₪'))}${inp('shiftsMonth',_('משמרות מדריכים ₪','Counselor shifts ₪'))}</div>
  <div class="fr">${inp('salaries',_('משכורות חודשיות ₪','Monthly salaries ₪'))}${inp('otherFixed',_('קבוע אחר – דירה, רכב ₪','Other fixed – housing, car ₪'))}</div>
  <p class="eyebrow">${_('עלויות לכל מטופל','Costs per patient')}</p>
  <div class="fr">${inp('indPerWeek',_('טיפולים פרטניים בשבוע','Individual sessions a week'),0.5)}${inp('indRate',_('תעריף פרטני ממוצע ₪','Average individual rate ₪'))}</div>
  ${inp('varPer',_('הוצאות אחרות למטופל בחודש ₪','Other costs per patient a month ₪'))}
  <p class="eyebrow">${_('הכנסה','Income')}</p>
  <div class="fr">${inp('revUsd',_('תשלום לחודש טיפול $','Payment per treatment month $'))}${inp('fx',_('שער דולר','Exchange rate'),0.01)}</div>
  <p class="hint">${_('ברירות המחדל מחושבות מהלו״ז ומהתעריפים שהגדרת.','Defaults are calculated from the schedule and the rates you set.')}</p></div></section></div>`;
}
function vLeads(){
 return`<div class="page-h"><div><p class="eyebrow">${_('מעקב מפנייה ועד קליטה','From first contact to admission')}</p><h1>${_('פניות וקליטה','Leads & admissions')}</h1></div><div class="acts"><button class="btn primary" data-a="addLead">+ ${_('פנייה חדשה','New lead')}</button></div></div>
 <div class="banner">${_('בגרסה המלאה פניות ייכנסו אוטומטית מ־LeadManager, וכשמטופל נקלט כל הפרטים עוברים לפרופיל שלו בלי הקלדה חוזרת.','In the full version, leads will flow in from LeadManager, and on admission all details carry over to the patient profile without retyping.')}</div>
 <div class="kan">${LEADST.map((c,ci)=>{const ls=D.leads.filter(l=>l.status===c.id);return`<div class="col"><div class="col-h"><span>${c[S.lang]}</span><span class="chip">${ls.length}</span></div>
  ${ls.map(l=>`<div class="lead"><div class="nm">${esc(l.name)}</div><div class="s">${esc(l.country)} · ${esc(l.source)}</div>
   ${l.next?`<div class="fu ${l.next<TD?'over':''}">${l.next<TD?_('באיחור','Overdue'):fmtDate(l.next)} · <span dir="auto">${esc(nm(l.todo))}</span></div>`:''}
   ${l.arrival?`<div class="fu">${_('הגעה צפויה','Expected arrival')}: ${fmtDate(l.arrival)}</div>`:''}
   ${c.id!=='admitted'?`<div class="la">${ci>0?`<button class="btn sm ghost" data-a="lmove" data-v="${l.id}|-1" aria-label="${_('שלב קודם','Previous step')}">${S.lang==='he'?'→':'←'}</button>`:''}${c.id==='approved'?`<button class="btn sm primary" data-a="admit" data-v="${l.id}">${_('קליטה כמטופל','Admit as patient')}</button>`:`<button class="btn sm" data-a="lmove" data-v="${l.id}|1">${_('לשלב הבא','Next step')} ${S.lang==='he'?'←':'→'}</button>`}</div>`:''}</div>`).join('')||`<div class="hint" style="padding:4px">—</div>`}</div>`}).join('')}</div>`;
}

/* ---------- shared store ----------
 The whole app keeps working on the in-memory D and calls save().
 In shared mode save() diffs D against what the store last held and writes only what changed.
 Month documents (log, overrides, roster) are merged entry by entry, so two staff saving
 attendance at the same time do not overwrite each other. Manager-only data lives under mgr/,
 which the store hides from everyone below Editor. */
const SH={on:false,db:null,user:null,uid:null,admin:false,owner:false,ready:false,loaded:{},cache:{},synced:{},q:{},pending:false,links:{},err:null};
const COLS=['meta','patients','notes','notesarch','incidents','summaries','tasks','reports','messages','reads','requests','shifts','leads','log','overrides','roster','links'];
const MCOLS=['mgr/data/comp','mgr/data/fees','mgr/data/payments','mgr/data/secure','mgr/data/tx'];
const ITEMS=['patients','notes','incidents','summaries','tasks','requests','shifts','leads','messages','reads'];
const DARR=ITEMS.concat(['tx','payments','cigSettlements']);
// what staff may see of an expense they reported: no allocations, so no patient balances
const reportView=x=>({id:x.id,kind:'exp',report:true,date:x.date,method:x.method,amount:x.amount,desc:x.desc,items:x.items||[],forPids:x.forPids||[],note:x.note||'',receipt:x.receipt!==false,by:x.by,status:x.status||'pending',cat:x.cat||'other',moves:[]});
const MONTHLY=['log','overrides','roster'];
function stable(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return'['+v.map(stable).join(',')+']';return'{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}'}
const clone=o=>JSON.parse(JSON.stringify(o));
function emptyD(){return{roster:{},tasks:[],settings:{cigPrice:38,kmRate:1.2,fx:3.7,rules:[],cancel:{patient:100,staff:0,other:0}},staff:[],patients:[],notes:[],incidents:[],summaries:[],template:{0:[],1:[],2:[],3:[],4:[],5:[],6:[]},overrides:{},log:{},leads:[],requests:[],shifts:[],payments:[],tx:[],cigSettlements:[],messages:[],reads:[]}}
function toDocs(d){
 const o={};
 o['meta/settings']=clone(d.settings);
 o['meta/staff']={list:d.staff.map(s=>{const c={...s};delete c.comp;return c})};
 o['meta/template']={t:d.template};
 o['meta/cig']={list:d.cigSettlements};
 ITEMS.forEach(k=>d[k].forEach(it=>{if(it.arch)return;let b=it;if(k==='patients'){b={...it};delete b.fees}o[k+'/'+it.id]=b}));
 d.tx.forEach(x=>{if(x.report)o['reports/'+x.id]=reportView(x);if(SH.admin&&(!x.report||x.status==='approved'))o['mgr/data/tx/'+x.id]=x});
 const mon=(k,src,keyOf)=>{Object.keys(src).forEach(e=>{const m=keyOf(e);(o[k+'/'+m]||(o[k+'/'+m]={e:{}})).e[e]=src[e]})};
 mon('log',d.log,e=>e.slice(0,7));mon('roster',d.roster,e=>e.slice(0,7));
 // overrides are flattened to one entry per added or edited activity, so two people changing the same day do not clash
 const ovf={};Object.entries(d.overrides).forEach(([dt,o])=>{(o.add||[]).forEach(a=>{ovf[dt+'~a~'+a.id]=a});Object.entries(o.edit||{}).forEach(([id,v])=>{ovf[dt+'~e~'+id]=v})});mon('overrides',ovf,e=>e.slice(0,7));
 if(SH.admin){
  const comp={};d.staff.forEach(s=>{if(s.comp&&Object.keys(s.comp).length)comp[s.id]=s.comp});o['mgr/data/comp/all']={map:comp};
  d.patients.forEach(p=>{if(p.fees&&p.fees.length)o['mgr/data/fees/'+p.id]={list:p.fees}});
  d.payments.forEach(p=>{o['mgr/data/payments/'+p.id]=p});
 }
 return o;
}
function fromDocs(){
 const c=SH.cache,d=emptyD();const get=p=>c[p];
 if(get('meta/settings'))d.settings={...d.settings,...clone(get('meta/settings'))};
 if(get('meta/staff'))d.staff=clone(get('meta/staff').list||[]);
 if(get('meta/template'))d.template={...d.template,...clone(get('meta/template').t||{})};
 if(get('meta/cig'))d.cigSettlements=clone(get('meta/cig').list||[]);
 const comp=(get('mgr/data/comp/all')||{}).map||{};d.staff.forEach(s=>{s.comp=clone(comp[s.id]||{})});
 const txIds=new Set();
 Object.keys(c).sort().forEach(p=>{const[k,id]=p.split('/');const b=c[p];
  if(ITEMS.includes(k)&&p.split('/').length===2){const it=clone(b);if(k==='patients')it.fees=clone((get('mgr/data/fees/'+id)||{}).list||[]);d[k].push(it)}
  else if(k==='overrides'&&p.split('/').length===2){Object.entries(b.e||{}).forEach(([e,v])=>{if(v===null)return;const[dt,t,id]=e.split('~');if(!id){d.overrides[e]=clone(v);return}const o=d.overrides[dt]||(d.overrides[dt]={});if(t==='a')(o.add||(o.add=[])).push(clone(v));else (o.edit||(o.edit={}))[id]=clone(v)})}
  else if(MONTHLY.includes(k)&&p.split('/').length===2){Object.entries(b.e||{}).forEach(([e,v])=>{if(v!==null)d[k][e]=clone(v)})}
  else if(p.startsWith('mgr/data/payments/'))d.payments.push(clone(b));
  else if(p.startsWith('mgr/data/tx/')){d.tx.push(clone(b));txIds.add(b.id)}
  else if(k==='reports'&&p.split('/').length===2){if(!txIds.has(b.id))d.tx.push(clone(b))}
  // imported history (WhatsApp) is kept as read-only bundles, one per patient per month
  else if(k==='notesarch')(b.list||[]).forEach(n=>d.notes.push({...clone(n),arch:true}));
 });
 const byDate=(a,b)=>(a.date||a.created||'').localeCompare(b.date||b.created||'');
 ['tx','notes','incidents','summaries','requests','shifts','payments'].forEach(k=>d[k].sort(byDate));
 return d;
}
const isMgrPath=p=>p.startsWith('mgr/');
// writes: one at a time per document, queued
function enqueue(path,fn){const prev=SH.q[path]||Promise.resolve();const next=prev.then(fn).catch(e=>onWriteErr(e));SH.q[path]=next;return next}
function onWriteErr(e){const c=e&&e.code;if(c==='invalid_argument')toast(_('אין לך הרשאה לשמור את השינוי הזה.','You do not have permission to save this change.'));else if(c==='quota_exceeded')toast(_('מאגר הנתונים מלא. פנו למנהל.','The data store is full. Contact the manager.'));else if(c==='revoked'){SH.err='revoked';render()}else toast(_('השמירה נכשלה. בדקו את החיבור ונסו שוב.','Saving failed. Check the connection and try again.'))}
function syncNow(){
 const docs=toDocs(D);const db=SH.db;
 Object.keys(SH.synced).forEach(p=>{const k=p.split('/')[0];if(MONTHLY.includes(k)&&p.split('/').length===2&&!(p in docs))docs[p]={e:{}}});
 Object.entries(docs).forEach(([p,b])=>{
  if(isMgrPath(p)&&!SH.admin)return;
  const k=p.split('/')[0];
  if(MONTHLY.includes(k)&&p.split('/').length===2){
   const had=SH.synced[p];// {e:{key:str}} entry-level
   if(!had){const body={e:clone(b.e)};SH.cache[p]=clone(body);SH.synced[p]={e:Object.fromEntries(Object.entries(b.e).map(([e,v])=>[e,stable(v)]))};enqueue(p,()=>createMonthly(p,body));return}
   const patch={};let n=0;
   Object.entries(b.e).forEach(([e,v])=>{const s=stable(v);if(had.e[e]!==s){patch[e]=v;had.e[e]=s;n++}});
   Object.keys(had.e).forEach(e=>{if(!(e in b.e)&&had.e[e]!=='null'){patch[e]=null;had.e[e]='null';n++}});
   if(n){const cb=SH.cache[p]||(SH.cache[p]={e:{}});cb.e={...(cb.e||{}),...clone(patch)}}
   if(n)enqueue(p,()=>db.doc(p).update({e:patch}).catch(err=>{if(err&&err.code==='invalid_argument')return db.doc(p).set({e:b.e});throw err}));
   return}
  const s=stable(b);if(SH.synced[p]!==s){SH.synced[p]=s;SH.cache[p]=clone(b);enqueue(p,()=>db.doc(p).set(clone(b)))}
 });
 Object.keys(SH.synced).forEach(p=>{const k=p.split('/')[0];if(p==='mgr/data/secure/cred'||k==='links'||k==='notesarch')return;if(MONTHLY.includes(k))return;if(isMgrPath(p)&&!SH.admin)return;
  if(!(p in docs)){delete SH.synced[p];delete SH.cache[p];enqueue(p,()=>db.doc(p).delete())}});
}
// first write to a month document: merge into it if someone already created it; if two people create it at
// the same moment, re-add whatever the other create overwrote
async function createMonthly(p,body){const ref=SH.db.doc(p);
 try{await ref.update({e:body.e});return}catch(e){if(!e||e.code!=='invalid_argument')throw e}
 await ref.set(body);
 const got=await ref.get();const have=(got.exists&&got.data().e)||{};const miss={};Object.entries(body.e).forEach(([k,v])=>{if(stable(have[k])!==stable(v))miss[k]=v});
 if(Object.keys(miss).length)await ref.update({e:miss});
}
function onColSnap(col,snap){
 const pre=col+'/';let changed=false;const seen=new Set();
 snap.docs.forEach(ds=>{const p=pre+ds.id;seen.add(p);const b=ds.data();if(!b)return;
  const k=p.split('/')[0];
  if(MONTHLY.includes(k)){const st={e:Object.fromEntries(Object.entries(b.e||{}).map(([e,v])=>[e,stable(v)]))};const prev=SH.synced[p];
   if(!prev||stable(prev)!==stable(st)){SH.synced[p]=st;changed=true}SH.cache[p]=b;return}
  const s=stable(b);if(SH.synced[p]!==s){SH.synced[p]=s;changed=true}SH.cache[p]=b});
 Object.keys(SH.cache).forEach(p=>{if(p.startsWith(pre)&&p.split('/').length===pre.split('/').length&&!seen.has(p)){delete SH.cache[p];delete SH.synced[p];changed=true}});
 if(col==='links'){SH.links={};Object.keys(SH.cache).filter(p=>p.startsWith('links/')).forEach(p=>{SH.links[p.slice(6)]=SH.cache[p].staff})}
 const first=!SH.loaded[col];SH.loaded[col]=true;
 if(!SH.ready){if([...COLS,...(SH.admin?MCOLS:[])].every(c=>SH.loaded[c])){SH.ready=true;D=fromDocs();render()}return}
 if(changed||first)applyRemote();
}
function busyEditing(){if(!$('#modal').hidden)return true;const a=document.activeElement;return !!(a&&$('#app').contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=='checkbox'&&a.type!=='range')}
function applyRemote(){if(busyEditing()){SH.pending=true;return}SH.pending=false;D=fromDocs();IC={};PS=null;render()}
function flushRemote(){if(SH.pending)setTimeout(()=>{if(!busyEditing())applyRemote()},0)}
async function startShared(){
 const c=window.claude;if(!c||typeof c.use!=='function')return false;
 const [db,user]=await Promise.all([c.use('db').catch(()=>null),c.use('user').catch(()=>null)]);
 if(!db)return false;
 SH.on=true;SH.db=db;SH.user=user;
 try{SH.uid=user?await user.id():null}catch(e){SH.uid=null}
 try{SH.admin=user?!!(await user.canEdit()):false;SH.owner=user?!!(await user.isOwner()):false}catch(e){}
 render();
 const sub=col=>{db.collection(col).onSnapshot(s=>onColSnap(col,s),e=>{if(e&&e.code==='revoked'){SH.err='revoked';render()}else{SH.loaded[col]=true;if(!SH.ready&&[...COLS,...(SH.admin?MCOLS:[])].every(c=>SH.loaded[c])){SH.ready=true;D=fromDocs();render()}}})};
 COLS.forEach(sub);if(SH.admin)MCOLS.forEach(sub);
 return true;
}
// who am I in the staff list
const myStaffId=()=>SH.uid?SH.links[SH.uid]:null;
function sharedRole(){const id=myStaffId();const s=id&&staffBy(id);return s?s.role:null}
function vLoading(){return`<div class="login"><section class="card"><div class="lg-who"><span class="logo-tile"><img src="${LOGO}" alt=""></span></div><h1>${_('טוען את נתוני התוכנית…','Loading the program data…')}</h1><p class="hint">${_('רגע אחד.','One moment.')}</p></section></div>`}
function vClaim(){
 const RS=window.RETORNO_SUPA;
 if(RS&&!RS.member)return`<div class="login"><section class="card"><span class="logo-tile"><img src="${LOGO}" alt=""></span><h1>${_('החשבון לא פעיל','This account is not active')}</h1><p class="hint">${_('המנהל עוד לא שייך את שם המשתמש','The manager has not assigned the username')} <b dir="ltr">${esc(RS.username)}</b> ${_('לאיש צוות. פנו למנהל.','to a staff member. Ask the manager.')}</p><button class="btn" data-a="logout">${_('יציאה','Sign out')}</button></section></div>`;
 if(RS&&RS.admin&&!D.staff.length)return vSetup();
 if(!SH.uid)return`<div class="login"><section class="card"><h1>${_('צריך להתחבר','Sign-in needed')}</h1><p class="hint">${_('כדי לעבוד במערכת צריך להיות מחובר לחשבון Claude שקיבל גישה לעמוד הזה.','To work in the system you need to be signed in to a Claude account that has access to this page.')}</p></section></div>`;
 const taken=new Set(Object.values(SH.links));
 const opts=D.staff.filter(s=>window.RETORNO_SUPA&&!SH.admin?s.id===window.RETORNO_SUPA.staffId:(s.role==='manager'?SH.admin:!taken.has(s.id)));
 return`<div class="login"><section class="card"><span class="logo-tile"><img src="${LOGO}" alt=""></span><h1>${_('מי את/ה?','Who are you?')}</h1>
 <p class="hint">${_('בחרו את השם שלכם פעם אחת. מכאן המערכת תזהה אתכם בכל מכשיר.','Pick your name once. From then on the system recognizes you on any device.')}</p>
 <div class="list">${opts.map(s=>`<button class="prow" data-a="claim" data-v="${s.id}"><div class="grow"><div class="t">${esc(nm(s.name))}</div><div class="s">${ROLES[s.role][S.lang]}</div></div></button>`).join('')||empty(_('המנהל עוד לא הוסיף אנשי צוות.','The manager has not added staff yet.'))}</div>
 <p class="hint">${_('השם שלכם לא ברשימה? בקשו מהמנהל להוסיף אתכם במסך הצוות.','Not on the list? Ask the manager to add you on the Staff screen.')}</p></section></div>`;
}
function vSetup(){return`<div class="login"><section class="card"><span class="logo-tile"><img src="${LOGO}" alt=""></span><h1>${_('ברוכים הבאים – הקמה ראשונה','Welcome – first-time setup')}</h1>
 <p class="hint">${_('נכנסת ראשון/ה ולכן הוגדרת כמנהל/ת. אפשר לייבא את הנתונים מהגרסה הקודמת, או להתחיל מאפס.','You signed in first, so you are the manager. Import the data from the previous version, or start from scratch.')}</p>
 <div class="f"><label for="impFile">${_('ייבוא קובץ נתונים (JSON)','Import a data file (JSON)')}</label><input id="impFile" type="file" accept=".json,application/json"></div><p class="hint" id="impStat"></p>
 <div class="f"><label for="mgrName">${_('או: השם שלך, כדי להתחיל מאפס','Or: your name, to start from scratch')}</label><input id="mgrName" dir="auto"></div><button class="btn" data-a="setupFresh">${_('התחלה מאפס','Start from scratch')}</button></section></div>`}
async function claimStaff(id){
 const s=staffBy(id);if(!s||!SH.uid)return;if(s.role==='manager'&&!SH.admin)return;
 try{await SH.db.doc('links/'+SH.uid).set({staff:id,at:new Date().toISOString()});SH.links[SH.uid]=id;S.view=PERM[s.role].views[0];render();toast(`${_('שלום','Hello')} ${nm(s.name)}`)}
 catch(e){toast(_('לא הצלחתי לשמור. ייתכן שאין לך הרשאת עריכה בעמוד – בקשו מהמנהל.','Could not save. You may not have edit access to this page – ask the manager.'))}
}
// demo data, loaded and removed only by the manager
function tagDemo(d){
 DARR.forEach(k=>d[k].forEach(x=>x.demo=true));
 Object.values(d.log).forEach(x=>x.demo=true);Object.values(d.roster).forEach(x=>x.demo=true);
 Object.values(d.template).forEach(l=>l.forEach(x=>x.demo=true));Object.values(d.overrides).forEach(o=>(o.add||[]).forEach(x=>x.demo=true));
 d.staff.forEach(s=>s.demo=true);d.settings.rules.forEach(r=>r.demo=true);
}
function loadDemo(){
 const cur=D;seed();const demo=D;D=cur;tagDemo(demo);
 const ids=new Set(D.staff.map(s=>s.id));const compSet=[];
 demo.staff.forEach(s=>{if(!ids.has(s.id))D.staff.push(s);else{const r=staffBy(s.id);if(r&&(!r.comp||!Object.keys(r.comp).length)&&s.comp&&Object.keys(s.comp).length){r.comp=s.comp;compSet.push(s.id)}}});
 DARR.forEach(k=>{const have=new Set(D[k].map(x=>x.id));demo[k].forEach(x=>{if(!x.id||!have.has(x.id))D[k].push(x)})});
 Object.assign(D.log,demo.log);Object.entries(demo.roster).forEach(([d,v])=>{if(!D.roster[d])D.roster[d]=v});
 Object.keys(demo.template).forEach(k=>{D.template[k]=(D.template[k]||[]).concat(demo.template[k])});
 D.settings.rules=(D.settings.rules||[]).concat(demo.settings.rules);D.settings.demoComp=compSet;
 save();
}
function clearDemo(){
 const demoStaff=new Set(D.staff.filter(s=>s.demo).map(s=>s.id));
 DARR.forEach(k=>{D[k]=D[k].filter(x=>!x.demo)});
 D.staff=D.staff.filter(s=>!s.demo);(D.settings.demoComp||[]).forEach(id=>{const s=staffBy(id);if(s)s.comp={}});D.settings.demoComp=[];
 const demoTpl=new Set();Object.keys(D.template).forEach(k=>{D.template[k].forEach(x=>{if(x.demo)demoTpl.add(x.id)});D.template[k]=D.template[k].filter(x=>!x.demo)});
 Object.keys(D.log).forEach(k=>{if(D.log[k].demo||demoTpl.has(k.split('|')[1]))delete D.log[k]});
 Object.keys(D.roster).forEach(k=>{const r=D.roster[k];if(r.demo){delete D.roster[k];return}['day','evening'].forEach(s=>{if(demoStaff.has(r[s]))r[s]=''})});
 Object.keys(D.overrides).forEach(k=>{const o=D.overrides[k];o.add=(o.add||[]).filter(x=>!x.demo);Object.keys(o.edit||{}).forEach(id=>{if(demoTpl.has(id))delete o.edit[id]})});
 D.settings.rules=(D.settings.rules||[]).filter(r=>!r.demo);
 Object.values(SH.links).forEach(()=>{});
 save();
}

/* ---------- shifts: morning 09:00–17:00, night 17:00–09:00 next day ---------- */
const SHIFTS={day:{he:'בוקר',en:'Morning',t:'09:00–17:00'},evening:{he:'לילה',en:'Night',t:'17:00–09:00'}};
const shiftLbl=k=>{const s=SHIFTS[k]||SHIFTS.day;return`${s[S.lang]} \u2066${s.t}\u2069`};
// the shift running at a given moment; before 09:00 it is still last night's shift
function shiftAt(date,time){if(time<'09:00')return{date:add(date,-1),kind:'evening'};if(time<'17:00')return{date,kind:'day'};return{date,kind:'evening'}}
const nextShift=s=>s.kind==='day'?{date:s.date,kind:'evening'}:{date:add(s.date,1),kind:'day'};
const prevShift=s=>s.kind==='evening'?{date:s.date,kind:'day'}:{date:add(s.date,-1),kind:'evening'};
const shiftKey=s=>s.date+'|'+s.kind;
const onShift=s=>(D.roster[s.date]||{})[s.kind]||'';
const shiftWhen=s=>`${shiftLbl(s.kind)} · ${fmtDate(s.date,{weekday:'short',day:'numeric',month:'short'})}`;
const counselors=()=>D.staff.filter(s=>s.role==='counselor');
// a person on night D and then morning D+1 (or morning D and night D) works 16+ hours straight
function rosterClash(date,kind){const who=onShift({date,kind});if(!who)return false;const n=nextShift({date,kind}),p=prevShift({date,kind});return onShift(n)===who||onShift(p)===who}
function myNextShifts(id,from,count){const out=[];let s=from;for(let i=0;i<40&&out.length<count;i++){if(onShift(s)===id)out.push(s);s=nextShift(s)}return out}

function vRoster(){
 const mgr=S.role==='manager';
 const ym=S.rMonth||TD.slice(0,7);
 const days=monthDays(ym);
 const now=shiftAt(TD,NOWT);
 const cs=counselors();
 const cell=(d,k)=>{const who=onShift({date:d,kind:k});const live=shiftKey(now)===d+'|'+k;const clash=rosterClash(d,k);const mineC=!mgr&&who===me();
  return`<td class="rc ${live?'live':''} ${mineC?'mine':''}">${mgr?`<select data-roster="${d}|${k}" aria-label="${shiftLbl(k)} ${fmtDate(d)}"><option value="">${_('— לא שובץ —','— Unassigned —')}</option>${cs.map(s=>`<option value="${s.id}" ${s.id===who?'selected':''}>${esc(nm(s.name))}</option>`).join('')}</select>`
   :`<span class="${who?'':'muted'}">${who?esc(staffName(who)):_('לא שובץ','Unassigned')}</span>`}
   ${live?`<span class="pill ok">${_('עכשיו','Now')}</span>`:''}${clash?`<span class="pill warn" title="${_('אותו מדריך בשתי משמרות רצופות','Same counselor on two shifts in a row')}">${_('רצף 16+ שעות','16+ h in a row')}</span>`:''}</td>`};
 const prev=S.lang==='he'?'›':'‹',next=S.lang==='he'?'‹':'›';
 const empties=days.reduce((n,d)=>n+['day','evening'].filter(k=>!onShift({date:d,kind:k})).length,0);
 const counts=cs.map(s=>({s,d:days.filter(d=>onShift({date:d,kind:'day'})===s.id).length,e:days.filter(d=>onShift({date:d,kind:'evening'})===s.id).length}));
 const mine=!mgr?myNextShifts(me(),now,4):[];
 const myMonth=!mgr?days.reduce((n,d)=>n+['day','evening'].filter(k=>onShift({date:d,kind:k})===me()).length,0):0;
 return`<div class="page-h"><div><p class="eyebrow">${shiftLbl('day')} · ${shiftLbl('evening')} ${_('למחרת','next day')}</p><h1>${_('לוח משמרות חודשי','Monthly shift roster')}</h1></div>
 ${mgr?`<div class="acts"><button class="btn" data-a="rFill">${_('מילוי החודש לפי השבוע הראשון','Fill the month from its first week')}</button><button class="btn ghost danger" data-a="rClear">${_('ניקוי החודש','Clear the month')}</button></div>`:''}</div>
 ${!mgr?`<section class="card"><div class="card-h"><h2>${_('המשמרות הבאות שלי','My next shifts')}</h2><span class="chip">${myMonth} ${_('משמרות ב','shifts in ')}${monthLbl(ym)}</span></div><div class="list">${mine.map(s=>{const n=nextShift(s),p=prevShift(s);return`<div class="row"><div class="grow"><div class="t">${shiftWhen(s)}</div><div class="s">${_('מחליף/ה אותך','Relieves you')}: <b>${esc(staffName(onShift(n))||_('לא שובץ','unassigned'))}</b> · ${_('את/ה מחליף/ה את','You relieve')}: ${esc(staffName(onShift(p))||_('לא שובץ','unassigned'))}</div></div>${shiftKey(s)===shiftKey(now)?`<span class="pill ok">${_('עכשיו','Now')}</span>`:''}</div>`}).join('')||empty(_('לא שובצת למשמרות בקרוב.','You have no shifts assigned soon.'))}</div></section>`:''}
 <div class="toolbar"><div class="mnav"><button class="arrow" data-a="rMonth" data-v="-1" aria-label="${_('חודש קודם','Previous month')}">${prev}</button><b>${monthLbl(ym)}</b><button class="arrow" data-a="rMonth" data-v="1" aria-label="${_('חודש הבא','Next month')}">${next}</button></div>
  ${ym!==TD.slice(0,7)?`<button class="btn sm ghost" data-a="rMonth" data-v="0">${_('החודש','This month')}</button>`:''}<span style="flex:1"></span>${mgr&&empties?`<span class="pill warn">${empties} ${_('משמרות לא משובצות','unassigned shifts')}</span>`:mgr?`<span class="pill ok">${_('כל המשמרות שובצו','Every shift is assigned')}</span>`:''}</div>
 <div class="grid2"><section class="card"><div class="tw"><table class="roster"><thead><tr><th>${_('יום','Day')}</th><th>${SHIFTS.day[S.lang]} <bdi dir="ltr" class="muted mono">09–17</bdi></th><th>${SHIFTS.evening[S.lang]} <bdi dir="ltr" class="muted mono">17–09</bdi></th></tr></thead><tbody>
 ${days.map(d=>`<tr class="${d===TD?'today':''} ${dowOf(d)===6?'sat':''}"><td class="rd"><b>${fmtDate(d,{weekday:'short',day:'numeric'})}</b></td>${cell(d,'day')}${cell(d,'evening')}</tr>`).join('')}</tbody></table></div>
 ${mgr?`<p class="hint" style="margin-top:8px">${_('השינויים נשמרים מיד. כל מדריך רואה את הלוח ואת מי שמחליף אותו.','Changes save right away. Every counselor sees the board and who relieves them.')}</p>`:''}</section>
 <section class="card"><div class="card-h"><h2>${_('חלוקת המשמרות בחודש','This month’s split')}</h2></div><div class="tw"><table><thead><tr><th>${_('מדריך','Counselor')}</th><th class="n">${SHIFTS.day[S.lang]}</th><th class="n">${SHIFTS.evening[S.lang]}</th><th class="n">${_('סה״כ','Total')}</th></tr></thead><tbody>${counts.map(c=>`<tr><td><b>${esc(nm(c.s.name))}</b></td><td class="n">${c.d}</td><td class="n">${c.e}</td><td class="n"><b>${c.d+c.e}</b></td></tr>`).join('')}</tbody></table></div></section></div>`;
}
function shiftCard(){
 const now=shiftAt(TD,NOWT);const cur=onShift(now);const nx=nextShift(now);const mineNext=myNextShifts(me(),now,1)[0];
 const iAmOn=cur===me();
 return`<section class="card"><div class="card-h"><h2>${_('משמרת','Shift')}</h2><button class="btn sm ghost" data-a="nav" data-v="roster">${_('ללוח המשמרות','Roster')}</button></div><div class="list">
  <div class="row"><div class="grow"><div class="s">${_('עכשיו','Now')} · ${shiftWhen(now)}</div><div class="t">${esc(staffName(cur)||_('לא שובץ','Unassigned'))}${iAmOn?` <span class="pill ok">${_('את/ה','You')}</span>`:''}</div></div></div>
  <div class="row"><div class="grow"><div class="s">${iAmOn?_('מחליף/ה אותך','Relieves you'):_('המשמרת הבאה','Next shift')} · ${shiftWhen(nx)}</div><div class="t">${esc(staffName(onShift(nx))||_('לא שובץ','Unassigned'))}</div></div></div>
  ${!iAmOn&&mineNext?`<div class="row"><div class="grow"><div class="s">${_('המשמרת הבאה שלך','Your next shift')}</div><div class="t">${shiftWhen(mineNext)}</div></div></div>`:''}</div></section>`;
}

/* ---------- shared task board: open tasks carry over to whoever is on the next shift ---------- */
function vTasks(){
 const now=shiftAt(TD,NOWT);
 const open=D.tasks.filter(t=>!t.done).sort((a,b)=>(b.urgent?1:0)-(a.urgent?1:0)||a.created.localeCompare(b.created));
 const done=D.tasks.filter(t=>t.done).sort((a,b)=>b.doneAt.localeCompare(a.doneAt));
 const carried=open.filter(t=>t.shift!==shiftKey(now)).length;
 const row=t=>{const from=t.shift!==shiftKey(now);const[sd,sk]=t.shift.split('|');
  return`<div class="task ${t.urgent?'urg':''}"><button class="tick" data-a="tDone" data-v="${t.id}" aria-label="${_('סימון כבוצע','Mark done')}"></button>
  <div class="grow"><div class="t" dir="auto">${esc(t.text)}</div><div class="s">${staffName(t.by)} · ${shiftWhen({date:sd,kind:sk})}${t.pid?` · <button class="link" data-a="openP" data-v="${t.pid}">${esc(pat(t.pid)?.name||'')}</button>`:''}</div>
  <div class="chips">${t.urgent?`<span class="pill bad">${_('דחוף','Urgent')}</span>`:''}${from?`<span class="pill warn">${_('עבר ממשמרת קודמת','Carried over')}</span>`:''}${t.due?`<span class="chip">${_('עד','By')} ${fmtDate(t.due)}</span>`:''}</div></div></div>`};
 return`<div class="page-h"><div><p class="eyebrow">${_('משמרת נוכחית','Current shift')}: ${shiftWhen(now)} · ${esc(staffName(onShift(now))||_('לא שובץ','unassigned'))}</p><h1>${_('משימות','Tasks')}</h1></div><div class="acts"><button class="btn primary" data-a="tAdd">+ ${_('משימה','Task')}</button></div></div>
 <div class="grid2"><section class="card"><div class="card-h"><h2>${_('פתוחות','Open')}</h2><span class="chip">${open.length}</span>${carried?`<span class="pill warn">${carried} ${_('עברו ממשמרות קודמות','carried over from earlier shifts')}</span>`:''}</div>
  <p class="hint">${_('משימה שלא בוצעה נשארת כאן למשמרת הבאה. מי שמבצע מסמן אותה, והיא עוברת לרשימת “בוצעו”.','A task that is not done stays here for the next shift. Whoever does it ticks it off and it moves to “Done”.')}</p>
  <div class="tasks">${open.map(row).join('')||empty(_('אין משימות פתוחות.','No open tasks.'))}</div></section>
 <section class="card"><div class="card-h"><h2>${_('בוצעו','Done')}</h2>${done.length?`<button class="btn sm ghost danger" data-a="tClear">${_('מחיקת כל מה שבוצע','Delete all done')}</button>`:''}</div>
  <div class="tasks">${done.slice(0,20).map(t=>`<div class="task done"><button class="tick on" data-a="tUndo" data-v="${t.id}" aria-label="${_('החזרה לפתוחות','Reopen')}">${ic('check')}</button><div class="grow"><div class="t" dir="auto">${esc(t.text)}</div><div class="s">${_('בוצע ע״י','Done by')} ${staffName(t.doneBy)} · ${fmtDate(t.doneAt.slice(0,10))} ${t.doneAt.slice(11,16)}${t.doneBy!==t.by?` · ${_('נפתח ע״י','Opened by')} ${staffName(t.by)}`:''}</div></div><button class="btn sm ghost danger" data-a="tDel" data-v="${t.id}">${_('מחיקה','Delete')}</button></div>`).join('')||empty(_('עוד לא בוצעו משימות.','Nothing done yet.'))}</div></section></div>`;
}
function tasksMini(){
 const open=D.tasks.filter(t=>!t.done);const now=shiftAt(TD,NOWT);const carried=open.filter(t=>t.shift!==shiftKey(now));
 return`<section class="card"><div class="card-h"><h2>${_('משימות פתוחות','Open tasks')}</h2><button class="btn sm ghost" data-a="nav" data-v="tasks">${_('לכל המשימות','All tasks')}</button></div>
 ${carried.length?`<p class="hint">${carried.length} ${_('משימות עברו אליך ממשמרות קודמות.','tasks were carried over to you from earlier shifts.')}</p>`:''}
 <div class="tasks">${open.slice(0,5).map(t=>`<div class="task ${t.urgent?'urg':''}"><button class="tick" data-a="tDone" data-v="${t.id}" aria-label="${_('סימון כבוצע','Mark done')}"></button><div class="grow"><div class="t" dir="auto">${esc(t.text)}</div><div class="s">${staffName(t.by)}${t.shift!==shiftKey(now)?` · <span class="neg">${_('עבר ממשמרת קודמת','carried over')}</span>`:''}</div></div></div>`).join('')||empty(_('אין משימות פתוחות.','No open tasks.'))}</div></section>`;
}

/* ---------- approvals: every money item a non-manager records waits here ---------- */
const pendPill=st=>st==='pending'?` <span class="pill warn">${_('ממתין לאישור מנהל','Awaiting manager approval')}</span>`:st==='rejected'?` <span class="pill bad">${_('נדחה','Rejected')}</span>`:'';
function pendingSessions(){const out=[];for(let i=60;i>=0;i--){instances(add(TD,-i)).forEach(x=>{if(x.log.costStatus==='pending')out.push(x)})}return out}
function pendingAll(){
 const sess=pendingSessions(),tx=D.tx.filter(x=>x.status==='pending'),sh=D.shifts.filter(s=>s.status==='pending'),rq=D.requests.filter(r=>r.status==='pending');
 return{sess,tx,sh,rq,n:sess.length+tx.length+sh.length+rq.length};
}
function vApprovals(){
 const p=pendingAll();
 const sessRows=p.sess.map(x=>{const lg=x.log;const pts=x.patients.length===1?esc(pat(x.patients[0])?.name||''):`${_('קבוצה','Group')} · ${x.patients.length}`;
  return`<tr><td class="mono">${fmtDate(x.date)} ${x.time}</td><td><b>${staffName(x.staff)}</b></td><td>${pts}</td><td>${esc(nm(x.title))} ${typeChip(x.type)}${lg.status==='cancelled'?` <span class="pill cancelled">${_('ביטול','Cancelled')} ${lg.pct}%</span>`:''}</td><td class="muted">${staffName(lg.reportedBy||lg.by)}</td>
  <td class="n"><input class="amt" id="ap_${x.key.replace('|','_')}" data-key="${x.key}" type="number" inputmode="decimal" step="0.01" value="${lg.suggest||rateCost(x)||''}" placeholder="₪" aria-label="${_('סכום','Amount')}"><div class="hint">${_('לפי תעריף','By rate')}: ${(lg.suggest||rateCost(x))?money(lg.suggest||rateCost(x)):_('אין תעריף','no rate')}</div></td>
  <td style="white-space:nowrap"><button class="btn sm primary" data-a="apSess" data-v="${x.key}">${_('אישור','Approve')}</button> <button class="btn sm ghost danger" data-a="rjSess" data-v="${x.key}">${_('דחייה','Reject')}</button></td></tr>`}).join('');
 const txCard=x=>{const g=groupMoves(x);const exp=x.kind==='exp';
  return`<div class="appr"><div class="grow"><div class="t">${x.report?_('דיווח הוצאה של מדריך','Counselor expense report'):kindLbl(x)} · <span dir="auto">${esc(nm(x.desc))}</span></div>${x.items&&x.items.length?`<ul class="items">${x.items.map(i=>`<li><span dir="auto">${esc(i.desc)}</span><b class="num">${money(i.amount)}</b></li>`).join('')}</ul>`:''}${x.forPids&&x.forPids.length?`<div class="s">${_('קשור ל','Related to')}: ${x.forPids.map(p=>esc(pat(p)?.name||'')).join(', ')}</div>`:''}${x.note?`<div class="s" dir="auto">${esc(x.note)}</div>`:''}
   <div class="s">${fmtDate(x.date)} · ${methodLbl(x.method)} · ${_('נרשם ע״י','Recorded by')} ${staffName(x.by)}${exp?` · ${nm(CATS[x.cat||'other'])}${x.receipt?'':` · <span class="neg">${_('בלי קבלה','no receipt')}</span>`}`:''}</div>
   <div class="chips">${g.map(m=>`<span class="chip">${esc(poolName(m.p))} ${m.d>0?'+':''}${money(m.d)}</span>`).join('')}</div></div>
   <b class="num">${money(x.amount)}</b><div class="la">${exp?`<button class="btn sm primary" data-a="classify" data-v="${x.id}">${_('סיווג ואישור','Classify & approve')}</button>`:`<button class="btn sm primary" data-a="apTx" data-v="${x.id}">${_('אישור','Approve')}</button>`}<button class="btn sm ghost danger" data-a="rjTx" data-v="${x.id}">${_('דחייה','Reject')}</button></div></div>`};
 return`<div class="page-h"><div><p class="eyebrow">${_('שום סכום לא נכנס לקופות ולדוחות לפני אישורך','No amount reaches the books or reports before you approve it')}</p><h1>${_('אישורים','Approvals')}</h1></div><span class="chip">${p.n} ${_('ממתינים','waiting')}</span></div>
 <section class="card"><div class="card-h"><h2>${_('פגישות עם מטפלים','Sessions with therapists')}</h2><span class="hint">${_('המדריכים מדווחים שהפגישה התקיימה. אתה מזין את הסכום ומאשר – רק אז העלות נרשמת.','Counselors report that a session took place. You enter the amount and approve; only then is the cost recorded.')}</span></div>
  ${p.sess.length?`<div class="tw"><table><thead><tr><th>${_('מתי','When')}</th><th>${_('מטפל/ת','Therapist')}</th><th>${_('מטופל','Patient')}</th><th>${_('פגישה','Session')}</th><th>${_('דיווח','Reported by')}</th><th class="n">${_('סכום לאישור','Amount to approve')}</th><th></th></tr></thead><tbody>${sessRows}</tbody></table></div>
  <div class="toolbar" style="margin-top:10px"><button class="btn" data-a="apAllSess">${_('אישור כל הפגישות לפי הסכומים בשדות','Approve all sessions at the amounts entered')}</button></div>`:empty(_('אין פגישות שממתינות לאישור.','No sessions waiting.'))}</section>
 <section class="card"><div class="card-h"><h2>${_('תנועות כספיות','Money entries')}</h2><span class="hint">${_('בסיווג אפשר לתקן קטגוריה, אמצעי תשלום ועל חשבון מי ההוצאה.','When classifying you can fix the category, payment method and who bears the cost.')}</span></div>
  ${p.tx.length?p.tx.map(txCard).join(''):empty(_('אין תנועות שממתינות לאישור.','No money entries waiting.'))}</section>
 <div class="grid2 even"><section class="card"><div class="card-h"><h2>${_('משמרות','Shifts')}</h2></div>
  ${p.sh.length?p.sh.map(s=>`<div class="appr"><div class="grow"><div class="t">${staffName(s.staff)}</div><div class="s">${fmtDate(s.date,{weekday:'short',day:'numeric',month:'short'})} · ${SHIFTS[s.kind]?SHIFTS[s.kind][S.lang]:s.kind}</div></div><input class="amt" id="sh_${s.id}" type="number" inputmode="decimal" value="${s.rate||staffBy(s.staff)?.comp?.shift||''}" aria-label="${_('סכום','Amount')}"><div class="la"><button class="btn sm primary" data-a="apShift" data-v="${s.id}">${_('אישור','Approve')}</button><button class="btn sm ghost danger" data-a="rjShift" data-v="${s.id}">${_('דחייה','Reject')}</button></div></div>`).join(''):empty(_('אין משמרות שממתינות.','No shifts waiting.'))}</section>
 <section class="card"><div class="card-h"><h2>${_('נסיעות והחזרים','Trips & reimbursements')}</h2></div>
  ${p.rq.length?p.rq.map(r=>`<div class="appr"><div class="grow"><div class="t">${staffName(r.staff)} · <span dir="auto">${esc(nm(r.desc))}</span></div><div class="s">${fmtDate(r.date)}${r.kind==='trip'?` · ${r.km} ${_('ק״מ','km')}`:''}</div></div><b class="num">${money(reqAmount(r))}</b><div class="la"><button class="btn sm primary" data-a="approve" data-v="${r.id}">${_('אישור','Approve')}</button><button class="btn sm ghost danger" data-a="reject" data-v="${r.id}">${_('דחייה','Reject')}</button></div></div>`).join(''):empty(_('אין בקשות שממתינות.','No requests waiting.'))}</section></div>`;
}

/* ---------- manager sign-in (prototype: checked in this browser; the full version checks it on the server) ---------- */
const CKEY='retorno-admin-cred',SKEY='retorno-admin-session';
function adminCred(){if(SH.on)return SH.cache['mgr/data/secure/cred']||null;try{return JSON.parse(localStorage.getItem(CKEY)||'null')}catch(e){return S._cred||null}}
function setCred(c){S._cred=c;if(SH.on){SH.cache['mgr/data/secure/cred']=c;SH.synced['mgr/data/secure/cred']=stable(c);enqueue('mgr/data/secure/cred',()=>SH.db.doc('mgr/data/secure/cred').set(c));return}try{localStorage.setItem(CKEY,JSON.stringify(c))}catch(e){}}
function adminIn(){if(window.RETORNO_SUPA)return true;try{return sessionStorage.getItem(SKEY)==='1'||!!S._adminIn}catch(e){return !!S._adminIn}}
function setAdminIn(v){S._adminIn=v;try{v?sessionStorage.setItem(SKEY,'1'):sessionStorage.removeItem(SKEY)}catch(e){}}
async function hashPw(pw,salt){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+':'+pw));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=0;const s=salt+':'+pw;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return'f'+h}}
function vLogin(){
 const c=adminCred();
 return`<div class="login"><section class="card"><div class="lg-who"><img class="lg-photo" src="${MGR_PHOTO}" alt=""><div><div class="t">${staffName('ariel')}</div><div class="s">${_('מנהל התוכנית','Program manager')}</div></div></div>
 <h1>${c?_('כניסת מנהל','Manager sign-in'):_('הגדרת כניסת מנהל','Set up manager sign-in')}</h1>
 <p class="hint">${c?_('הכספים, האישורים והתעריפים זמינים רק אחרי כניסה.','Finance, approvals and rates are available only after signing in.'):_('בחרו מייל וסיסמה לכניסת המנהל. תתבקשו להזין אותם בכל כניסה.','Choose an email and password for the manager. You will be asked for them each time.')}</p>
 <form class="form" id="lgForm" novalidate>
  ${fld('lgE',_('מייל','Email'),`<input id="lgE" type="email" autocomplete="username" dir="ltr" value="${esc(c?c.email:'')}">`)}
  ${fld('lgP',_('סיסמה','Password'),`<input id="lgP" type="password" autocomplete="${c?'current-password':'new-password'}" dir="ltr">`)}
  ${c?'':fld('lgP2',_('אימות סיסמה','Confirm password'),`<input id="lgP2" type="password" autocomplete="new-password" dir="ltr">`)+`<p class="hint">${_('לפחות 8 תווים.','At least 8 characters.')}</p>`}
  <p class="err" id="lgErr" role="alert"></p>
  <button class="btn primary" type="submit">${c?_('כניסה','Sign in'):_('שמירה וכניסה','Save and sign in')}</button>
  ${c?`<p class="hint">${_('שכחת סיסמה? בגרסה המלאה יישלח קישור איפוס למייל. באב־טיפוס אפשר לאפס הכל דרך “על הגרסה הזו”.','Forgot the password? In the full version a reset link is emailed. In this prototype you can reset everything from “About this version”.')}</p>`:''}
 </form></section></div>`;
}
async function submitLogin(){
 const c=adminCred(),e=val('lgE').toLowerCase(),p=$('#lgP').value,err=$('#lgErr');
 if(!/^\S+@\S+\.\S+$/.test(e)){err.textContent=_('המייל לא תקין.','That email is not valid.');return}
 if(!c){if(p.length<8){err.textContent=_('הסיסמה צריכה להכיל לפחות 8 תווים.','The password needs at least 8 characters.');return}
  if(p!==$('#lgP2').value){err.textContent=_('הסיסמאות לא זהות.','The passwords do not match.');return}
  const salt=uid()+uid();setCred({email:e,salt,hash:await hashPw(p,salt)});setAdminIn(true);render();toast(_('כניסת המנהל הוגדרה','Manager sign-in set up'));return}
 if(e!==c.email||await hashPw(p,c.salt)!==c.hash){err.textContent=_('המייל או הסיסמה שגויים.','Wrong email or password.');$('#lgP').value='';return}
 setAdminIn(true);render();
}

/* ---------- messages from the manager ---------- */
const MSGT={important:{he:'חשובה',en:'Important',cls:'bad',hint:{he:'לכל המדריכים',en:'To every counselor'}},special:{he:'מיוחדת',en:'Special',cls:'warn',hint:{he:'למדריכים שבוחרים',en:'To the counselors you pick'}},general:{he:'כללית',en:'General',cls:'ok',hint:{he:'לכל הצוות',en:'To the whole team'}}};
const defaultTo=t=>t==='important'?D.staff.filter(s=>s.role==='counselor').map(s=>s.id):t==='general'?D.staff.filter(s=>s.role!=='manager').map(s=>s.id):[];
const readMap=()=>((D.reads||[]).find(r=>r.id===me())||{m:{}}).m;
const myMsgs=()=>(D.messages||[]).filter(m=>(m.to||[]).includes(me())).sort((a,b)=>b.at.localeCompare(a.at));
const unreadN=()=>{const r=readMap();return myMsgs().filter(m=>!r[m.id]).length};
function markRead(ids){if(!ids.length)return;let r=(D.reads||(D.reads=[])).find(x=>x.id===me());if(!r){r={id:me(),m:{}};D.reads.push(r)}let ch=false;ids.forEach(id=>{if(!r.m[id]){r.m[id]=new Date().toISOString();ch=true}});if(ch){save();if(!busyEditingSafe())render()}}
const busyEditingSafe=()=>{try{return busyEditing()}catch(e){return false}};
function msgCard(m,mine){const t=MSGT[m.type]||MSGT.general;const reads=(D.reads||[]).filter(r=>r.m&&r.m[m.id]).map(r=>r.id);
 return`<div class="msg ${m.type}"><div class="msg-h"><span class="pill ${t.cls}">${_('הודעה','Message')} ${t[S.lang]}</span><b dir="auto">${esc(m.title)}</b><span class="muted">${fmtDate(m.at.slice(0,10))} ${m.at.slice(11,16)} · ${staffName(m.from)}</span></div>
 <div class="note-b" dir="auto">${esc(m.body)}</div>
 ${mine?`<div class="s">${_('נשלחה ל','Sent to')}: ${(m.to||[]).map(id=>`<span class="chip ${reads.includes(id)?'on':''}" title="${reads.includes(id)?_('קרא/ה','Read'):_('טרם קרא/ה','Not read yet')}">${esc(staffName(id))}${reads.includes(id)?' ✓':''}</span>`).join(' ')}</div>`:''}</div>`}
function vMessages(){
 const mgr=S.role==='manager';
 if(!mgr){const list=myMsgs();const r=readMap();const html=`<div class="page-h"><div><p class="eyebrow">${_('הודעות מהמנהל','Messages from the manager')}</p><h1>${_('הודעות','Messages')}</h1></div>${notifBtn()}</div>
  <section class="card"><div class="list msgs">${list.map(m=>`<div class="${r[m.id]?'':'unread'}">${msgCard(m,false)}</div>`).join('')||empty(_('אין הודעות עדיין.','No messages yet.'))}</div></section>`;
  setTimeout(()=>markRead(list.filter(m=>!r[m.id]).map(m=>m.id)),1200);return html}
 const sent=(D.messages||[]).slice().sort((a,b)=>b.at.localeCompare(a.at));
 return`<div class="page-h"><div><p class="eyebrow">${_('ההודעה מגיעה כהתראה לטלפון של מי שנבחר','The message arrives as a phone notification for whoever you pick')}</p><h1>${_('הודעות לצוות','Messages to the team')}</h1></div>${notifBtn()}</div>
 <div class="grid2"><section class="card"><div class="card-h"><h2>${_('הודעה חדשה','New message')}</h2></div><div class="form">
  <div class="f"><span class="lab">${_('סוג ההודעה','Message type')}</span><div class="seg2" role="radiogroup">${Object.keys(MSGT).map(k=>`<input type="radio" name="mty" id="mty_${k}" value="${k}" ${k==='important'?'checked':''}><label for="mty_${k}">${MSGT[k][S.lang]}</label>`).join('')}</div><span class="hint" id="mtyh">${nm(MSGT.important.hint)}</span></div>
  ${txt('mti',_('כותרת','Title'))}
  <div class="f"><label for="mbo">${_('תוכן ההודעה','Message')}</label><textarea id="mbo" dir="auto" style="min-height:120px"></textarea></div>
  <div class="f"><span class="lab">${_('למי לשלוח','Send to')}</span><div class="toolbar"><button type="button" class="chip" data-mset="counselor">${_('כל המדריכים','All counselors')}</button><button type="button" class="chip" data-mset="team">${_('כל הצוות','Whole team')}</button><button type="button" class="chip" data-mset="none">${_('ניקוי','Clear')}</button></div>
   <div class="checks" id="mtoBox">${D.staff.filter(s=>s.id!==me()).map(s=>`<label><input type="checkbox" class="mto" value="${s.id}" data-role="${s.role}" ${defaultTo('important').includes(s.id)?'checked':''}>${esc(nm(s.name))} <span class="muted">· ${ROLES[s.role][S.lang]}</span></label>`).join('')}</div></div>
  <button class="btn primary" data-a="msgSend">${_('שליחה','Send')}</button></div></section>
 <section class="card"><div class="card-h"><h2>${_('הודעות שנשלחו','Sent messages')}</h2><span class="chip">${sent.length}</span></div><div class="list msgs">${sent.map(m=>msgCard(m,true)).join('')||empty(_('עוד לא נשלחו הודעות.','No messages sent yet.'))}</div></section></div>`;
}
function unreadBanner(){const r=readMap();const u=myMsgs().filter(m=>!r[m.id]);if(!u.length)return'';const imp=u.find(m=>m.type==='important');
 return`<button class="banner ${imp?'warnb':''} msgban" data-a="nav" data-v="messages"><b>${u.length} ${_('הודעות חדשות מהמנהל','new messages from the manager')}</b>${imp?` · <span dir="auto">${esc(imp.title)}</span>`:''}<span style="flex:1"></span>${_('לקריאה','Read')}</button>`}
// push notifications: only when the app runs on its own server (see the supabase provider); elsewhere these are no-ops
function notify(p){try{if(window.RETORNO_NOTIFY)window.RETORNO_NOTIFY(p)}catch(e){}}
function notifyMgr(title,body){notify({audience:'managers',title,body,url:'#approvals'})}
function notifBtn(){return window.RETORNO_PUSH?`<div class="acts">${window.RETORNO_PUSH.state()==='on'?`<span class="chip on">${_('התראות פעילות בטלפון הזה','Notifications are on for this device')}</span>`:`<button class="btn" data-a="pushOn">${_('הפעלת התראות בטלפון הזה','Turn on notifications here')}</button>`}</div>`:''}

/* ---------- shell ---------- */
const LOGO='data:image/png;base64,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';
const MGR_PHOTO='icons/logo.png';
function brand(){return`<span class="logo-tile"><img src="${LOGO}" alt="${_('רטורנו – טיפול בהתמכרויות העצמה ומניעה','Retorno – addiction treatment, empowerment and prevention')}"></span><span class="sub">${_('תוכנית דוברי אנגלית','English-speaking program')}</span>`}
function render(){
 IC={};PS=null;
 if(SH.on){const root=document.documentElement;root.lang=S.lang;root.dir=S.lang==='he'?'rtl':'ltr';
  const shell=b=>{$('#app').innerHTML=`<main class="content solo"><div class="top-solo"><button class="btn sm ghost" data-a="lang">${S.lang==='he'?'English':'עברית'}</button></div>${b}</main>`};
  if(SH.err==='revoked'){shell(`<div class="login"><section class="card"><h1>${_('הגישה לעמוד השתנתה','Access to this page changed')}</h1><p class="hint">${_('רעננו את העמוד.','Reload the page.')}</p></section></div>`);return}
  if(!SH.ready){shell(vLoading());return}
  const RS=window.RETORNO_SUPA;if(RS&&!sharedRole()&&RS.staffId&&staffBy(RS.staffId)&&!S._autoClaim){S._autoClaim=1;claimStaff(RS.staffId)}
  const r=sharedRole();if(!r){shell(vClaim());return}
  S.role=(r==='manager'&&S.viewAs&&adminIn())?S.viewAs:r;if(r!=='manager')S.viewAs=null;
 }
 const root=document.documentElement;root.lang=S.lang;root.dir=S.lang==='he'?'rtl':'ltr';
 if(!P().views.includes(S.view))S.view=P().views[0];
 const locked=S.role==='manager'&&!adminIn();const pc=S.role==='manager'&&!locked?pendingAll().n:0;
 const nav=locked?'':P().views.map(v=>`<button class="nav-i ${S.view===v?'on':''}" data-a="nav" data-v="${v}" ${S.view===v?'aria-current="page"':''}>${ic(VIEWS[v].i)}<span>${VIEWS[v][S.lang]}</span>${v==='approvals'&&pc?`<i class="badge">${pc}</i>`:''}${v==='messages'&&!locked&&unreadN()?`<i class="badge">${unreadN()}</i>`:''}</button>`).join('');
 const body=locked?vLogin():{dashboard:vDash,messages:vMessages,approvals:vApprovals,tasks:vTasks,roster:vRoster,schedule:vSched,patients:vPatients,summary:vSummary,finance:vFin,staff:vStaff,leads:vLeads,reports:vReports}[S.view]();
 const role=SH.on?(sharedRole()==='manager'&&adminIn()?`<label class="role"><span class="sr">${_('תצוגה בתור','Preview as')}</span><select id="roleSel" data-c="role">${['manager','counselor','therapist','admissions'].map(r=>`<option value="${r}" ${S.role===r?'selected':''}>${r==='manager'?staffName(myStaffId()):_('תצוגה כ','Preview as ')+ROLES[r][S.lang]} · ${ROLES[r][S.lang]}</option>`).join('')}</select></label>`:`<span class="chip whoami">${esc(staffName(myStaffId()))} · ${ROLES[sharedRole()][S.lang]}</span>`)
  :`<label class="role"><span class="sr">${_('צפייה בתור','View as')}</span><select id="roleSel" data-c="role">${Object.keys(AS).map(r=>`<option value="${r}" ${S.role===r?'selected':''}>${staffName(AS[r])} · ${ROLES[r][S.lang]}</option>`).join('')}</select></label>`;
 $('#app').innerHTML=`<div class="app"><aside class="side"><div class="brand">${brand()}</div><nav class="side-nav" aria-label="${_('ניווט','Navigation')}">${nav}</nav>
 <div class="side-foot"><span>${SH.on?_('נתונים משותפים לכל הצוות','Data shared with the whole team'):_('אב־טיפוס · נתוני דוגמה','Prototype · demo data')}</span><button class="btn sm ghost" data-a="about">${_('על הגרסה הזו','About this version')}</button></div></aside>
 <div class="main"><header class="top"><div class="top-in"><div class="brand m-only">${brand()}</div><div class="ctrls">${role}<button class="btn sm ghost" data-a="lang" lang="${S.lang==='he'?'en':'he'}">${S.lang==='he'?'English':'עברית'}</button>${(S.role==='manager'&&!locked)||window.RETORNO_SUPA?`<button class="btn sm ghost" data-a="logout">${_('יציאה','Sign out')}</button>`:''}<button class="btn sm ghost m-only" data-a="about" aria-label="${_('על הגרסה','About')}">?</button></div></div></header>
 <main class="content">${body}</main></div></div><nav class="tabbar" aria-label="${_('ניווט','Navigation')}">${nav}</nav>`;
 savePrefs();
}
function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2600)}
function modal(title,body,onSave,saveLabel,extraBtn){
 const m=$('#modal');
 m.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="${_('סגירה','Close')}">×</button></header><div class="sheet-body">${body}</div>${onSave?`<footer>${extraBtn||''}<span style="flex:1"></span><button class="btn ghost" data-close>${_('סגירה','Close')}</button><button class="btn primary" id="msave">${saveLabel||_('שמירה','Save')}</button></footer>`:''}</div>`;
 m.hidden=false;
 m.onclick=e=>{if(e.target===m||e.target.closest('[data-close]'))closeModal()};
 if(onSave)$('#msave').onclick=()=>{const r=onSave();if(r===false||r==='stay')return;closeModal();save();render();if(typeof r==='string')toast(r)};
 const f=m.querySelector('input:not([type=checkbox]):not([type=radio]),select,textarea');if(f)f.focus();
}
const closeModal=()=>{$('#modal').hidden=true;$('#modal').innerHTML='';flushRemote()};
const val=id=>{const e=document.getElementById(id);return e?e.value.trim():''};
const fld=(id,label,input)=>`<div class="f"><label for="${id}">${label}</label>${input}</div>`;
const num=(id,label,v='')=>fld(id,label,`<input id="${id}" type="number" inputmode="decimal" step="0.01" value="${v}">`);
const txt=(id,label,v='')=>fld(id,label,`<input id="${id}" dir="auto" value="${esc(v)}">`);
const area=(id,label,v='')=>fld(id,label,`<textarea id="${id}" dir="auto">${esc(v)}</textarea>`);
const sel=(id,label,opts,v)=>fld(id,label,`<select id="${id}">${opts.map(([k,l])=>`<option value="${k}" ${k===v?'selected':''}>${esc(l)}</option>`).join('')}</select>`);
const need=(ok,msg)=>{if(!ok){toast(msg);return false}return true};
const patOpts=()=>activeP().map(p=>[p.id,p.name]);
const staffOpts=()=>D.staff.filter(s=>s.role!=='admissions').map(s=>[s.id,nm(s.name)]);
const sampleErr=c=>({not_granted:_('לא ניתן אישור להשתמש ב־Claude בעמוד הזה.','Claude was not allowed on this page.'),rate_limited:_('יותר מדי בקשות כרגע. נסו שוב בעוד כמה דקות.','Too many requests right now. Try again in a few minutes.'),refused:_('הבקשה לא עובדה. אפשר להמשיך בלי AI.','The request was not processed. You can continue without AI.'),invalid_json:_('התשובה לא התקבלה בפורמט הנכון. נסו שוב.','The answer came back in the wrong format. Try again.')}[c]||_('משהו השתבש בחיבור. נסו שוב או המשיכו בלי AI.','Something went wrong with the connection. Try again or continue without AI.'));

/* ---------- expense flow: form → preview → save ---------- */
function expenseFlow(pre){
 const st=pre||{date:TD,method:'cash',amount:'',desc:'',rows:[{to:'',amount:''}],pats:[],cat:'other',receipt:true};
 const poolOpts=[['',_('בחרו על חשבון מי','Choose who bears it')],['retorno',_('רטורנו','Retorno')],...activeP().map(p=>[PK(p.id),p.name]),['program',_('קרן התוכנית','Program fund')]];
 const methods=[['cash',_('מזומן מהקופה','Cash from the box')],['card',_('אשראי','Credit')],['bank',_('העברה בנקאית','Bank transfer')],...D.staff.filter(s=>s.role!=='manager').map(s=>['staff:'+s.id,`${_('שילם/ה מכיסו','Paid out of pocket by')} ${nm(s.name)} (${_('יוחזר','to be repaid')})`])];
 if(!st.from)st.from=medium(st.method)==='cash'?'cash':'bank';
 const body=`<div class="form"><div class="fr">${num('xa',_('סכום ההוצאה ₪','Expense amount ₪'),st.amount)}${fld('xd',_('תאריך','Date'),`<input id="xd" type="date" value="${st.date}">`)}</div>
  ${st.items&&st.items.length?`<div class="banner"><div><b>${_('דיווח של','Reported by')} ${staffName(st.by)}</b>${st.note?` · <span dir="auto">${esc(st.note)}</span>`:''}<ul class="items">${st.items.map(i=>`<li><span dir="auto">${esc(i.desc)}</span><b class="num">${money(i.amount)}</b></li>`).join('')}</ul></div></div>`:''}
  ${txt('xs',_('על מה','What for'),st.desc)}<div class="fr">${sel('xm',_('איך שילמתי','How I paid'),methods,st.method)}${sel('xc',_('קטגוריה','Category'),Object.keys(CATS).map(k=>[k,nm(CATS[k])]),st.cat||'other')}</div>
  <label class="toggle"><input type="checkbox" id="xr" ${st.receipt!==false?'checked':''}>${_('יש קבלה','Receipt in hand')}</label>
  <div class="f"><span class="lab">${_('על חשבון מי ההוצאה','Who bears the cost')}</span>
   <div class="rulebar">${D.settings.rules.map(r=>`<button class="chip" data-rule="${r.id}" title="${esc(ruleText(r))}">${esc(nm(r.name))}</button>`).join('')}</div>
   <div class="checks" id="xpats" ${D.settings.rules.some(r=>r.patients)?'':'hidden'}><span class="hint" style="width:100%">${_('מטופלים לחלוקה לפי כלל:','Patients for a rule split:')}</span>${activeP().map(p=>`<label><input type="checkbox" class="xp" value="${p.id}" ${st.pats.includes(p.id)?'checked':''}>${esc(p.name)}</label>`).join('')}</div>
   <div id="xrows" class="xrows"></div>
   <button class="btn sm ghost" id="xadd" type="button">+ ${_('שורה','Line')}</button>
   <div class="okline" id="xsum"></div></div></div>`;
 modal(st.approveId?_('סיווג ואישור הוצאה','Classify and approve expense'):_('רישום הוצאה','Record expense'),body,()=>{
  readForm();const a=+st.amount;
  if(!need(a>0&&st.desc,_('הזינו סכום ופירוט','Enter amount and details')))return'stay';
  const rows=st.rows.filter(r=>r.to||+r.amount);
  if(!need(rows.length&&rows.every(r=>r.to&&+r.amount>0),_('בכל שורה צריך לבחור על חשבון מי ולהזין סכום','Each line needs who bears it and an amount')))return'stay';
  const keys=rows.map(r=>r.to);if(!need(new Set(keys).size===keys.length,_('אותו גורם מופיע פעמיים. אחדו את השורות.','The same party appears twice. Merge the lines.')))return'stay';
  const sum=r2(rows.reduce((s,r)=>s+(+r.amount),0));
  if(!need(Math.abs(sum-a)<.005,`${_('סכום החלקים','Parts total')} ${money(sum)} ${_('לא שווה לסכום ההוצאה','does not equal the expense')} ${money(a)}`))return'stay';
  preview({...st,rows});return'stay';
 },_('המשך לאישור','Continue to review'));
 const rowsEl=$('#xrows');
 const defFrom=()=>medium(st.method)==='cash'?'cash':'bank';
 const draw=()=>{rowsEl.innerHTML=st.rows.map((r,i)=>{const isP=(r.to||'').startsWith('patient:');if(isP&&!r.from)r.from=defFrom();return`<div class="xrow ${isP?'withfrom':''}"><select data-i="${i}" class="xto" aria-label="${_('על חשבון','Charged to')}">${poolOpts.map(([k,l])=>`<option value="${k}" ${k===r.to?'selected':''}>${esc(l)}</option>`).join('')}</select><input data-i="${i}" class="xam" type="number" inputmode="decimal" step="0.01" placeholder="₪" value="${r.amount}" aria-label="${_('סכום','Amount')}"><button type="button" class="icon-btn" data-rm="${i}" aria-label="${_('הסרה','Remove')}">×</button>${isP?`<div class="seg2 xfb" role="radiogroup" aria-label="${_('יורד מ','Comes off')}"><input type="radio" name="xf${i}" id="xf${i}c" data-i="${i}" value="cash" ${r.from==='cash'?'checked':''}><label for="xf${i}c">${_('מזומן','Cash')}</label><input type="radio" name="xf${i}" id="xf${i}b" data-i="${i}" value="bank" ${r.from==='bank'?'checked':''}><label for="xf${i}b">${_('אשראי','Credit')}</label></div>`:''}</div>`}).join('');sumLine()};
 const sumLine=()=>{readForm();const a=+st.amount||0;const s=r2(st.rows.reduce((t,r)=>t+(+r.amount||0),0));const ok=a>0&&Math.abs(s-a)<.005;const el=$('#xsum');el.className='okline '+(ok?'ok':'bad');el.textContent=`${_('חולק','Split')}: ${money(s)} ${_('מתוך','of')} ${money(a)}${ok?' ✓':` · ${_('נותר','remaining')} ${money(a-s)}`}`};
 function readForm(){st.cat=val('xc');st.receipt=!!($('#xr')&&$('#xr').checked);st.amount=val('xa');st.date=val('xd')||TD;st.desc=val('xs');st.method=val('xm');st.pats=[...document.querySelectorAll('.xp:checked')].map(i=>i.value);
  document.querySelectorAll('.xto').forEach(s=>{st.rows[+s.dataset.i].to=s.value});document.querySelectorAll('.xam').forEach(s=>{st.rows[+s.dataset.i].amount=s.value});document.querySelectorAll('.xfb input:checked').forEach(r=>{st.rows[+r.dataset.i].from=r.value})}
 // picking a patient on a line adds its own cash / credit choice
 rowsEl.oninput=sumLine;rowsEl.onchange=e=>{if(e.target.classList.contains('xto')){readForm();draw()}else sumLine()};$('#xa').oninput=sumLine;
 rowsEl.onclick=e=>{const b=e.target.closest('[data-rm]');if(!b)return;readForm();st.rows.splice(+b.dataset.rm,1);if(!st.rows.length)st.rows.push({to:'',amount:''});draw()};
 $('#xadd').onclick=()=>{readForm();st.rows.push({to:'',amount:''});draw()};
 document.querySelectorAll('[data-rule]').forEach(b=>b.onclick=()=>{readForm();const r=D.settings.rules.find(x=>x.id===b.dataset.rule);const a=+st.amount;
  if(!a){toast(_('הזינו קודם את סכום ההוצאה','Enter the expense amount first'));return}
  if(r.patients&&!st.pats.length){toast(_('סמנו את המטופלים שהשתתפו','Tick the patients who took part'));return}
  const rows=[];if(r.retorno)rows.push({to:'retorno',amount:r2(a*r.retorno/100)});if(r.program)rows.push({to:'program',amount:r2(a*r.program/100)});
  if(r.patients){const tot=r2(a*r.patients/100);const each=Math.floor(tot/st.pats.length*100)/100;st.pats.forEach((p,i)=>rows.push({to:PK(p),amount:i===st.pats.length-1?r2(tot-each*(st.pats.length-1)):each}))}
  const diffv=r2(a-rows.reduce((s,x)=>s+x.amount,0));if(diffv&&rows.length)rows[0].amount=r2(rows[0].amount+diffv);
  st.rows=rows.map(x=>({to:x.to,amount:String(x.amount)}));draw();toast(_('הוצעה חלוקה לפי הכלל – בדקו לפני המשך','Split suggested by the rule – check it before continuing'))});
 draw();
}
function preview(st){
 const a=+st.amount, m=medium(st.method);const ps=poolStats();
 // which money actually leaves: each patient line uses its own cash / credit choice, the rest follows how it was paid
 let cashD=0,bankD=0;st.rows.forEach(r=>{const md=r.to.startsWith('patient:')?(r.from||'cash'):m;if(md==='cash')cashD+=+r.amount;else if(md==='bank')bankD+=+r.amount});cashD=r2(cashD);bankD=r2(bankD);
 const dup=D.tx.find(x=>x.id!==st.approveId&&x.kind==='exp'&&x.date===st.date&&Math.abs(x.amount-a)<.005&&nm(x.desc).trim().toLowerCase()===st.desc.toLowerCase());
 const rows=st.rows.map(r=>{const o=pool(r.to);const isP=r.to.startsWith('patient:');const bk=isP?(r.from||'cash'):'';return`<tr><td>${esc(poolName(r.to))}${isP?` <span class="chip">${bk==='cash'?_('ממזומן','from cash'):_('מאשראי','from credit')}</span>`:''}</td><td class="n">${money(o.t)}</td><td class="n neg">−${money(+r.amount)}</td><td class="n"><b>${money(o.t-(+r.amount))}</b></td></tr>`}).join('');
 modal(_('אישור לפני שמירה','Confirm before saving'),`<div class="form"><p><b dir="auto">${esc(st.desc)}</b> · ${money(a)} · ${methodLbl(st.method)} · ${fmtDate(st.date)}</p>
  <div class="tw"><table><thead><tr><th>${_('על חשבון','Charged to')}</th><th class="n">${_('לפני','Before')}</th><th class="n">${_('חיוב','Charge')}</th><th class="n">${_('אחרי','After')}</th></tr></thead><tbody>${rows}
  ${cashD?`<tr class="trh"><td><b>${_('מזומן בקופה','Cash in hand')}</b></td><td class="n">${money(ps.cash)}</td><td class="n neg">−${money(cashD)}</td><td class="n"><b>${money(ps.cash-cashD)}</b></td></tr>`:''}
  ${bankD?`<tr class="trh"><td><b>${_('אשראי ובנק','Credit and bank')}</b></td><td class="n">${money(ps.bank)}</td><td class="n neg">−${money(bankD)}</td><td class="n"><b>${money(ps.bank-bankD)}</b></td></tr>`:''}</tbody></table></div>
  ${m==='other'?`<p class="hint">${st.approveId?_('איש הצוות שילם מכיסו. עם האישור נרשם לו החזר שאושר.','The staff member paid out of pocket. Approving records an approved refund for them.'):_('המזומן בקופה לא משתנה. תיפתח בקשת החזר לאיש הצוות.','Cash in hand does not change. A refund request opens for the staff member.')}</p>`:''}
  ${dup?`<div class="banner warnb"><div><b>${_('ייתכן שזו כפילות','Possible duplicate')}:</b> ${_('כבר נרשמה הוצאה זהה באותו תאריך.','an identical expense was already recorded on this date.')}<label class="toggle" style="margin-top:6px"><input type="checkbox" id="dupok">${_('זו הוצאה נפרדת – לרשום בכל זאת','This is a separate expense – record it anyway')}</label></div></div>`:''}</div>`,
  ()=>{if(dup&&!$('#dupok').checked&&!st.approveId){toast(_('סמנו שזו הוצאה נפרדת, או חזרו','Confirm it is a separate expense, or go back'));return'stay'}
   const t=txExp(st.date,st.method,a,st.desc,st.rows.map(r=>({to:r.to,amount:+r.amount,m:r.to.startsWith('patient:')?(r.from||'cash'):null})),{cat:st.cat||'other',receipt:st.receipt!==false});
   if(st.items){t.items=st.items;t.report=true;t.forPids=st.forPids||[];if(st.note)t.note=st.note}
   if(st.method.startsWith('staff:')&&!(st.approveId&&D.tx.find(z=>z.id===st.approveId)?.reqId)){const rq={id:uid(),staff:st.method.slice(6),kind:'reimb',date:st.date,desc:st.desc,amount:a,status:st.approveId&&S.role==='manager'?'approved':'pending',txId:t.id};D.requests.push(rq);t.reqId=rq.id}
   if(st.approveId){const o=D.tx.find(z=>z.id===st.approveId);t.id=o.id;t.by=o.by;t.status='approved';t.approvedBy=me();if(o.reqId&&!t.reqId){t.reqId=o.reqId}D.tx[D.tx.indexOf(o)]=t;return _('סווג ואושר','Classified and approved')}
   D.tx.push(stampTx(t));return S.role==='manager'?_('ההוצאה נרשמה','Expense recorded'):_('ההוצאה נשלחה לאישור מנהל','Expense sent for manager approval')},st.approveId?_('סיווג ואישור','Classify and approve'):_('אישור ושמירה','Confirm and save'),`<button class="btn ghost" id="mback">${S.lang==='he'?'→':'←'} ${_('חזרה','Back')}</button>`);
 $('#mback').onclick=()=>expenseFlow(st);
}

/* ---------- export ---------- */
function loadScript(src){return new Promise((res,rej)=>{const ex=document.querySelector(`script[src="${src}"]`);if(ex&&ex.dataset.ok){res();return}const s=document.createElement('script');s.src=src;s.onload=()=>{s.dataset.ok=1;res()};s.onerror=()=>rej(new Error('load'));document.head.appendChild(s)})}
const dlErr=c=>c==='declined'?_('השמירה בוטלה.','Save cancelled.'):_('לא ניתן לשמור קבצים מהתצוגה הזו.','Files cannot be saved from this view.');
async function exportExcel(){
 if(!DL){toast(_('שמירת קבצים זמינה כשהעמוד פתוח בתוך Claude.','Saving files works when the page is opened inside Claude.'));return}
 const R=S._rep||monthReport(S.month);
 try{await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')}catch(e){toast(_('לא הצלחתי לטעון את רכיב האקסל.','Could not load the Excel component.'));return}
 const X=window.XLSX;const wb=X.utils.book_new();
 const sum=[[_('דוח חודשי','Monthly report'),monthLbl(R.ym)],[],[_('הכנסות מטיפול','Treatment income'),R.incomeT],[_('מפגשים ופעילויות','Sessions & activities'),R.workT],[_('משמרות, משכורות, נסיעות ובונוסים','Shifts, salaries, trips & bonuses'),r2(R.staffT-R.workT)],[_('הוצאות תוכנית','Program spending'),R.progT],...Object.entries(R.prog).map(([c,v])=>['  '+nm(CATS[c]||CATS.other),r2(v)]),[_('סך עלויות','Total costs'),R.totalCost],[R.net>=0?_('רווח','Profit'):_('הפסד','Loss'),R.net],[],[_('עלות למטופל בחודש','Cost per patient-month'),R.costPerPatient],[_('ימי מטופל','Patient-days'),R.pd],[_('מפגשים פרטניים','Individual sessions'),R.sessions],[_('ביטולים','Cancellations'),R.cancels],[_('נוכחות %','Attendance %'),R.attRate]];
 const pts=[[_('מטופל','Patient'),_('ימים','Days'),_('ישיר','Direct'),_('משותף','Shared'),_('עלות','Cost'),_('הכנסה','Income'),_('נטו','Net')],...R.pts.map(r=>[pat(r.id)?.name||'',r.days,r.direct,r.share,r.cost,r.income,r.net])];
 const stf=[[_('איש צוות','Staff'),_('מפגשים','Sessions'),_('משמרות','Shifts'),_('משכורת','Salary'),_('נסיעות ובונוסים','Trips & bonuses'),_('עלות בחודש','Cost this month'),_('טרם שולם','Still owed')],...D.staff.filter(s=>R.sc[s.id]).map(s=>{const v=R.sc[s.id];return[nm(s.name),r2(v.sessions+v.cancel),v.shifts,v.monthly,v.requests,v.cost,staffOwed(s.id)]})];
 const wk=[[_('תאריך','Date'),_('פעילות','Activity'),_('צוות','Staff'),_('מצב','Status'),_('משתתפים','Participants'),_('עלות','Cost')],...monthWork(R.ym).filter(r=>r.kind==='accrued'||r.kind==='cancel').map(r=>[r.d,nm(r.x.title),staffName(r.staff),r.kind==='cancel'?_('ביטול','Cancelled'):_('אושר','Confirmed'),r.pts.length,r.cost])];
 [[sum,_('סיכום','Summary')],[pts,_('מטופלים','Patients')],[stf,_('צוות','Staff')],[wk,_('עבודה מתועדת','Documented work')]].forEach(([a,n])=>{const ws=X.utils.aoa_to_sheet(a);ws['!cols']=a[0].map((_x,i)=>({wch:i===0?28:14}));X.utils.book_append_sheet(wb,ws,n)});
 if(S.lang==='he')wb.Workbook={Views:[{RTL:true}]};
 const buf=X.write(wb,{type:'array',bookType:'xlsx'});
 try{await DL.save({filename:`retorno-report-${R.ym}.xlsx`,data:buf});toast(_('הקובץ נשמר','File saved'))}catch(e){toast(dlErr(e&&e.code))}
}
async function exportPdf(b){
 if(!DL){toast(_('שמירת קבצים זמינה כשהעמוד פתוח בתוך Claude.','Saving files works when the page is opened inside Claude.'));return}
 const el=$('#rep');if(!el)return;if(b){b.disabled=true}
 try{await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')}catch(e){toast(_('לא הצלחתי לטעון את רכיב ה־PDF.','Could not load the PDF component.'));if(b)b.disabled=false;return}
 try{
  el.classList.add('printing');
  const canvas=await window.html2canvas(el,{scale:2,backgroundColor:getComputedStyle(document.body).backgroundColor,useCORS:true});
  el.classList.remove('printing');
  const pdf=new window.jspdf.jsPDF({unit:'pt',format:'a4'});const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight(),m=24;
  const iw=pw-m*2;const scale=iw/canvas.width;const pageH=Math.floor((ph-m*2)/scale);
  for(let y=0,first=true;y<canvas.height;y+=pageH,first=false){const c=document.createElement('canvas');c.width=canvas.width;c.height=Math.min(pageH,canvas.height-y);c.getContext('2d').drawImage(canvas,0,y,canvas.width,c.height,0,0,canvas.width,c.height);if(!first)pdf.addPage();pdf.addImage(c.toDataURL('image/jpeg',.92),'JPEG',m,m,iw,c.height*scale)}
  await DL.save({filename:`retorno-report-${S.month}.pdf`,data:pdf.output('arraybuffer')});toast(_('הקובץ נשמר','File saved'));
 }catch(e){el.classList.remove('printing');toast(e&&e.code?dlErr(e.code):_('יצירת ה־PDF נכשלה.','Creating the PDF failed.'))}
 if(b)b.disabled=false;
}

/* ---------- actions ---------- */
const A={
 nav:v=>{S.view=v;S.pid=null;if(v==='summary')S.sumId=null},
 lang:()=>{S.lang=S.lang==='he'?'en':'he'},
 day:v=>{S.date=v},
 week:v=>{S.date=add(S.date,+v*7)},
 arch:v=>{S.arch=v==='1'},
 openP:v=>{S.view='patients';S.pid=v;S.ptab='timeline';S.tlf='all'},
 openAcc:v=>{S.view='patients';S.pid=v;S.ptab=S.role==='manager'?'account':'overview'},
 backP:()=>{S.pid=null},
 ptab:v=>{S.ptab=v},
 tlf:v=>{S.tlf=v},
 tr:v=>{S.showTr[v]=!S.showTr[v]},
 translate:(v,b)=>{const[k,id]=v.split(':');const o=k==='note'?D.notes.find(n=>n.id===id):D.incidents.find(n=>n.id===id);if(!o||!SAMPLE)return'keep';
  const target=S.lang==='he'?'Hebrew':'English';b.disabled=true;b.textContent=_('מתרגם…','Translating…');
  const src=k==='note'?o.text:JSON.stringify({what:o.what,response:o.response});
  const p=k==='note'?SAMPLE(`Translate the following staff note from a treatment program into ${target}. Keep the meaning, tone and severity exactly. Do not add or remove anything. Reply with the translation only.\n\n${src}`,{modelTier:'quick'}).then(r=>r.text.trim())
   :SAMPLE.json(`Translate the two fields of this incident report from a treatment program into ${target}. Keep meaning, tone and severity exactly; add or remove nothing. Reply with only a JSON object {"what": string, "response": string}.\n\n${src}`,{modelTier:'quick'});
  p.then(tr=>{o.tr=tr;S.showTr[v]=true;save();render()}).catch(e=>{toast(sampleErr(e.code));render()});return'keep'},
 resolve:v=>{const[k,id]=v.split(':');const o=k==='inc'?D.incidents.find(n=>n.id===id):D.notes.find(n=>n.id===id);if(o)o.resolved=true;save();toast(_('סומן כטופל','Marked as handled'))},
 restore:v=>{delete D.log[v];save()},
 about:()=>{const mgr=SH.on&&sharedRole()==='manager'&&adminIn();const hasDemo=D.patients.some(p=>p.demo)||D.staff.some(s=>s.demo);
  modal(_('על המערכת','About the system'),`<div class="form"><p>${_('כל אזור מחובר לאחרים: נוכחות, חריגות וסיכומים נכנסים לתיק המטופל, וכל תנועה כספית מעדכנת את הקופה ואת היתרות.','Every area is connected: attendance, incidents and summaries flow into the patient file, and every money entry updates the cash box and balances.')}</p>
  ${SH.on?`<p>${_('הנתונים משותפים לכל הצוות ומתעדכנים בזמן אמת בכל מכשיר. כל אחד רואה את המסכים של התפקיד שלו, ונתוני הכספים של המנהל מוסתרים משאר הצוות.','The data is shared with the whole team and updates live on every device. Everyone sees the screens for their own role, and the manager’s finance data is hidden from the rest of the team.')}</p>
   <p class="hint">${_('זהו שלב ניסיון: לפני שמזינים פרטים מזהים של מטופלים אמיתיים, כדאי לבדוק עם הנהלת רטורנו את הדרישות לשמירת מידע רפואי.','This is a trial stage: before entering identifying details of real patients, check the requirements for storing medical information with Retorno’s management.')}</p>
   ${mgr?`<div class="toolbar"><button class="btn" id="dmL">${_('טעינת נתוני דוגמה','Load sample data')}</button>${hasDemo?`<button class="btn danger" id="dmC">${_('מחיקת נתוני הדוגמה','Delete sample data')}</button>`:''}</div>`:''}`
  :`<p>${_('כל הנתונים הם נתוני דוגמה. מה שמזינים נשמר רק בדפדפן הזה.','All data is sample data. What you enter is kept only in this browser.')}</p><button class="btn danger" id="rst">${_('איפוס נתוני הדוגמה','Reset demo data')}</button>`}</div>`);
  if($('#rst'))$('#rst').onclick=()=>{seed();save();setAdminIn(false);S._cred=null;try{localStorage.removeItem(CKEY)}catch(e){}closeModal();render();toast(_('הנתונים אופסו','Demo data reset'))};
  if($('#dmL'))$('#dmL').onclick=()=>A.demoLoad();if($('#dmC'))$('#dmC').onclick=()=>A.demoClear();return'keep'},
 att:v=>{const x=findInst(v);if(!x)return'keep';const lg=x.log;const att={};x.patients.forEach(id=>att[id]=(lg.att&&lg.att[id])||'p');
  const ind=x.type==='individual', clin=P().clinical;
  const linked=D.notes.find(n=>n.session===x.key);
  const rows=x.patients.map(id=>`<div class="att-row"><b>${esc(pat(id).name)}</b><div class="seg" role="radiogroup" aria-label="${esc(pat(id).name)}">${[['p',_('נוכח','Present')],['l',_('איחר','Late')],['a',_('נעדר','Absent')]].map(([k,l])=>`<input type="radio" name="at_${id}" id="at_${id}_${k}" value="${k}" ${att[id]===k?'checked':''}><label for="at_${id}_${k}">${l}</label>`).join('')}</div></div>`).join('');
  const rate=rateCost(x);
  modal(`${nm(x.title)} · ${x.time}`,`<div class="form"><div class="toolbar"><button class="btn sm" id="allp" type="button">${_('כולם נוכחים','Everyone present')}</button><span class="hint">${_('סמנו את כולם ואז שנו רק את החריגים.','Mark everyone, then change only the exceptions.')}</span></div>
   <div>${rows||empty(_('אין מטופלים משויכים.','No patients assigned.'))}</div>
   ${ind&&clin?fld('sum',_('סיכום המפגש – יתווסף לתיק המטופל','Session summary – added to the patient record'),`<textarea id="sum" dir="auto">${esc(linked?.text||'')}</textarea>`):''}
   ${ind&&!clin?lockBox(_('סיכום המפגש נרשם ע״י המטפל/ת.','The session summary is written by the therapist.')):''}
   ${S.role==='manager'&&(lg.cost??rate)?`<p class="hint">${_('עלות לפי התעריף של','Cost at the rate of')} ${staffName(x.staff)}: <b>${money(lg.cost??rate)}</b> · ${esc(basisText(x,lg.basis&&typeof lg.basis==='object'?lg.basis:undefined))}. ${_('נרשמת פעם אחת, באישור הביצוע.','Recorded once, when the work is confirmed.')}</p>`:''}</div>`,
   ()=>{const out={};x.patients.forEach(id=>{const c=document.querySelector(`input[name="at_${id}"]:checked`);out[id]=c?c.value:'p'});
    const rec={...lg,status:'done',att:out,by:me(),at:new Date().toISOString()};
    if(lg.status==='done'&&lg.costStatus==='approved'){rec.cost=lg.cost}else{rec.cost=rate;rec.basis=basisSnap(x);
     if(S.role!=='manager'&&(rate>0||staffBy(x.staff)?.role==='therapist')){rec.costStatus='pending';rec.suggest=rate;rec.cost=0;rec.reportedBy=me()}else rec.costStatus='approved'}
    D.log[x.key]=rec;
    const s=val('sum');
    if(ind&&s){if(linked){linked.text=s;linked.lang=isHe(s)?'he':'en';linked.tr=null}else D.notes.push({id:uid(),pid:x.patients[0],date:x.date,time:x.end,author:me(),kind:'therapy',lang:isHe(s)?'he':'en',text:s,tr:null,followup:false,resolved:false,session:x.key})}
    return _('נשמר וסומן כבוצע','Saved and marked done')},_('שמירה וסימון כבוצע','Save and mark done'));
  $('#allp')&&($('#allp').onclick=()=>document.querySelectorAll('.seg input[value=p]').forEach(i=>i.checked=true));return'keep'},
 cancel:v=>{const x=findInst(v);const rs=[_('המטפל/ת לא זמין/ה','Therapist unavailable'),_('מטופל/ת לא זמין/ה','Patient unavailable'),_('מזג אוויר','Weather'),_('יציאה לתור רפואי','Medical appointment')];
  modal(_('ביטול פעילות','Cancel activity'),`<div class="form"><p><b>${esc(nm(x.title))}</b> · ${x.time} · ${fmtDate(x.date,{weekday:'long',day:'numeric',month:'short'})}</p>
   ${sel('cr',_('סיבה','Reason'),rs.map(r=>[r,r]).concat([['other',_('אחר','Other')]]),rs[0])}${txt('co',_('פירוט (לא חובה)','Details (optional)'))}
   ${sel('cb',_('מי ביטל','Cancelled by'),[['staff',_('איש הצוות / התוכנית','Staff member / program')],['patient',_('המטופל','The patient')],['other',_('אחר – מזג אוויר, חירום','Other – weather, emergency')]],'staff')}
   ${rateCost(x)?`<p class="hint">${_('לפי כלל הביטול ישולם','By the cancellation rule, pay is')}: ${_('ביטול ע״י מטופל','patient cancels')} ${D.settings.cancel.patient}% · ${_('צוות','staff')} ${D.settings.cancel.staff}% · ${_('אחר','other')} ${D.settings.cancel.other}% ${_('מתוך','of')} ${money(rateCost(x))}</p>`:''}
   <p class="hint">${_('הביטול חל על היום הזה בלבד.','This cancels this day only.')}</p></div>`,
   ()=>{const r=val('cr')==='other'?val('co'):(val('co')?val('cr')+' – '+val('co'):val('cr'));if(!need(r,_('כתבו סיבה','Add a reason')))return'stay';const by=val('cb');const pct=D.settings.cancel[by]||0;
    const cc=r2(rateCost(x)*pct/100);D.log[x.key]=S.role!=='manager'&&cc>0?{status:'cancelled',reason:r,cancelBy:by,by:me(),pct,cost:0,suggest:cc,costStatus:'pending',reportedBy:me()}:{status:'cancelled',reason:r,cancelBy:by,by:me(),pct,cost:cc,costStatus:'approved'};return _('הפעילות בוטלה','Activity cancelled')},_('ביטול הפעילות','Cancel activity'));return'keep'},
 move:v=>{const x=findInst(v);
  modal(_('הזזת פעילות','Move activity'),`<div class="form"><p><b>${esc(nm(x.title))}</b> · ${fmtDate(x.date,{weekday:'long',day:'numeric',month:'short'})}</p><div class="fr">${fld('mt',_('שעה חדשה','New time'),`<input id="mt" type="time" value="${x.time}">`)}${txt('mr',_('סיבה','Reason'))}</div><p class="hint">${_('השינוי חל על היום הזה בלבד. הלו״ז השבועי לא משתנה.','This changes this day only. The weekly schedule stays as it is.')}</p></div>`,
   ()=>{const t=val('mt');if(!need(t,_('בחרו שעה','Pick a time')))return'stay';const dur=toMin(x.end)-toMin(x.time);const ov=D.overrides[x.date]=D.overrides[x.date]||{};
    if(x.src==='day'){const it=ov.add.find(a=>a.id===x.id);it.time=t;it.end=fromMin(toMin(t)+dur)}else{ov.edit=ov.edit||{};ov.edit[x.id]={time:t,end:fromMin(toMin(t)+dur),moveReason:val('mr')}}
    return _('הפעילות הוזזה','Activity moved')});return'keep'},
 addAct:()=>{const mgr=S.role==='manager';const act=activeOn(S.date);
  modal(_('פעילות חדשה','New activity'),`<div class="form">${txt('at',_('שם הפעילות','Activity name'))}
   <div class="fr">${sel('ay',_('סוג','Type'),Object.keys(TYPES).map(k=>[k,TYPES[k][S.lang]]),'group')}${sel('as',_('איש צוות אחראי','Staff in charge'),staffOpts(),me())}</div>
   <div class="fr">${fld('a1',_('התחלה','Start'),'<input id="a1" type="time" value="15:00">')}${fld('a2',_('סיום','End'),'<input id="a2" type="time" value="16:00">')}</div>
   ${txt('al',_('מיקום','Location'))}${txt('ax',_('הסעה (לא חובה)','Transport (optional)'))}
   <div class="f"><span class="lab">${_('משתתפים','Participants')}</span><div class="checks"><label><input type="checkbox" id="aall" checked>${_('כל המטופלים','All patients')}</label>${act.map(p=>`<label><input type="checkbox" class="ap" value="${p.id}">${esc(p.name)}</label>`).join('')}</div><span class="hint">${_('מטופל שיש לו פעילות פרטנית באותה שעה יוצא אוטומטית מהקבוצה.','A patient with an individual activity at the same time is left out of the group automatically.')}</span></div>
   ${mgr?`<label class="toggle"><input type="checkbox" id="arep">${_('חוזר כל שבוע ביום','Repeats weekly on')} ${fmtDate(S.date,{weekday:'long'})}</label>`:''}</div>`,
   ()=>{const t=val('at');if(!need(t,_('כתבו שם לפעילות','Name the activity')))return'stay';
    const picked=[...document.querySelectorAll('.ap:checked')].map(i=>i.value);const all=$('#aall').checked&&!picked.length;
    if(!need(all||picked.length,_('בחרו משתתפים','Choose participants')))return'stay';
    const a1=val('a1'),a2=val('a2');if(!need(a1&&a2&&a2>a1,_('שעת הסיום צריכה להיות אחרי ההתחלה','End time must be after the start')))return'stay';
    const it={id:uid(),time:a1,end:a2,type:val('ay'),title:{he:t,en:t},loc:{he:val('al'),en:val('al')},staff:val('as'),pts:all?'all':picked};
    const dup=instances(S.date).find(o=>o.staff===it.staff&&o.type===it.type&&o.log.status!=='cancelled'&&(it.pts==='all'?o.pts==='all':o.patients.some(p=>picked.includes(p))));
    if(dup&&!($('#adup')&&$('#adup').checked)){if(!$('#adup'))$('.sheet .form').insertAdjacentHTML('beforeend',`<div class="banner warnb"><div><b>${_('כבר קיימת פעילות דומה ביום הזה','A similar activity already exists on this day')}:</b> ${esc(nm(dup.title))} · ${dup.time} · ${staffName(dup.staff)}. ${_('אם זו אותה פעילות, אשרו אותה בלו״ז במקום להוסיף – כך העלות לא תירשם פעמיים.','If it is the same one, confirm it in the schedule instead – that way its cost is not recorded twice.')}<label class="toggle" style="margin-top:6px"><input type="checkbox" id="adup">${_('זו פעילות נפרדת – להוסיף בכל זאת','This is a separate activity – add it anyway')}</label></div></div>`);return'stay'}
    if(val('ax'))it.transport={he:val('ax'),en:val('ax')};
    if($('#arep')&&$('#arep').checked){(D.template[dowOf(S.date)]=D.template[dowOf(S.date)]||[]).push(it);return _('נוסף ללו״ז השבועי','Added to the weekly schedule')}
    const ov=D.overrides[S.date]=D.overrides[S.date]||{};(ov.add=ov.add||[]).push(it);return _('נוסף ליום הזה','Added to this day')});
  document.querySelectorAll('.ap').forEach(c=>c.onchange=()=>{$('#aall').checked=!document.querySelector('.ap:checked')});return'keep'},
 incident:v=>{
  modal(_('דיווח חריגה','Report an incident'),`<div class="form">${sel('ip',_('מטופל','Patient'),patOpts(),v||'')}
   <div class="fr">${fld('idt',_('תאריך','Date'),`<input id="idt" type="date" value="${TD}">`)}${fld('itm',_('שעה','Time'),`<input id="itm" type="time" value="${NOWT}">`)}</div>
   ${area('iw',_('מה קרה','What happened'))}${area('ir',_('איזו תגובה או השלכה ניתנה','What response or consequence was given'))}
   ${sel('ib',_('מי החליט על התגובה','Who decided on the response'),staffOpts(),me()==='dvora'?'ariel':me())}
   <label class="toggle"><input type="checkbox" id="if" checked>${_('נדרש מעקב','Needs follow-up')}</label>
   <p class="hint">${_('הדיווח נכנס לתיק המטופל ויוצג למטפל/ת ולמנהל לפי ההרשאות.','The report goes into the patient file and is visible to the therapist and the manager, by access level.')}</p></div>`,
   ()=>{const w=val('iw');if(!need(w&&val('ip'),_('תארו מה קרה','Describe what happened')))return'stay';
    D.incidents.push({id:uid(),pid:val('ip'),date:val('idt')||TD,time:val('itm'),author:me(),lang:isHe(w)?'he':'en',what:w,response:val('ir'),decidedBy:val('ib'),followup:$('#if').checked,resolved:false,tr:null});
    return _('החריגה דווחה ונכנסה לתיק','Incident reported and added to the file')},_('שליחת דיווח','Submit report'));return'keep'},
 note:v=>{const kinds=S.role==='manager'?[['daily',_('תיעוד יומי','Daily note')],['therapy',_('סיכום טיפולי','Therapy summary')]]:S.role==='therapist'?[['therapy',_('סיכום טיפולי','Therapy summary')],['daily',_('תיעוד יומי','Daily note')]]:[['daily',_('תיעוד יומי','Daily note')]];
  modal(`${_('תיעוד','Note')} · ${pat(v).name}`,`<div class="form">${sel('nk',_('סוג','Type'),kinds,kinds[0][0])}${area('nt',_('תוכן – בעברית או באנגלית','Text – Hebrew or English'))}<label class="toggle"><input type="checkbox" id="nf">${_('דורש מעקב','Needs follow-up')}</label></div>`,
   ()=>{const t=val('nt');if(!need(t,_('כתבו תוכן','Write the note first')))return'stay';D.notes.push({id:uid(),pid:v,date:TD,time:NOWT,author:me(),kind:val('nk'),lang:isHe(t)?'he':'en',text:t,tr:null,followup:$('#nf').checked,resolved:false});return _('התיעוד נשמר','Note saved')});return'keep'},
 stage:v=>{const p=pat(v);modal(_('שינוי שלב','Change stage'),`<div class="form">${sel('ns',_('שלב חדש','New stage'),STAGES.map(s=>[s.id,s[S.lang]]),p.stage)}${txt('nn',_('הערה (לא חובה)','Note (optional)'))}</div>`,
  ()=>{const s=val('ns');if(s===p.stage){toast(_('זה השלב הנוכחי','That is the current stage'));return'stay'}p.stage=s;p.history.push({stage:s,date:TD,by:me(),note:val('nn')});return _('השלב עודכן','Stage updated')});return'keep'},
 inRetorno:()=>{modal(_('קבלת מזומן מרטורנו','Cash received from Retorno'),`<div class="form">${num('ya','₪')}${txt('yd',_('פירוט','Details'),_('מזומן מרטורנו','Cash from Retorno'))}<p class="hint">${_('מתווסף למזומן בקופה ולכספי רטורנו.','Adds to cash in hand and to Retorno funds.')}</p></div>`,
  ()=>{const a=+val('ya');if(!need(a>0,_('הזינו סכום','Enter an amount')))return'stay';D.tx.push(stampTx(txIn(TD,'retorno','cash',r2(a),val('yd'))));return S.role==='manager'?_('נרשם','Recorded'):_('נשלח לאישור מנהל','Sent for manager approval')});return'keep'},
 inPatient:v=>{modal(_('מזומן ממטופל או ממשפחה','Cash from patient or family'),`<div class="form">${sel('yp',_('מטופל','Patient'),patOpts(),v||'')}${num('ya','₪')}${txt('yd',_('פירוט','Details'),_('מזומן מהמשפחה','Cash from family'))}<p class="hint">${_('מתווסף למזומן בקופה וליתרה של המטופל.','Adds to cash in hand and to the patient’s balance.')}</p></div>`,
  ()=>{const a=+val('ya');if(!need(a>0,_('הזינו סכום','Enter an amount')))return'stay';D.tx.push(stampTx(txIn(TD,PK(val('yp')),'cash',r2(a),val('yd'))));return S.role==='manager'?_('נרשם','Recorded'):_('נשלח לאישור מנהל','Sent for manager approval')});return'keep'},
 inBank:v=>{modal(_('קבלת העברה בנקאית','Bank transfer received'),`<div class="form">${sel('yp',_('עבור','For'),[...activeP().map(p=>[PK(p.id),p.name]),['retorno',_('רטורנו','Retorno')],['program',_('קרן התוכנית','Program fund')]],v?PK(v):'')}${num('ya','₪')}${txt('yd',_('פירוט','Details'),_('העברה מהמשפחה','Family transfer'))}<p class="hint">${_('מעדכן את החשבון הרלוונטי. המזומן בקופה לא משתנה.','Updates the relevant account. Cash in hand does not change.')}</p></div>`,
  ()=>{const a=+val('ya');if(!need(a>0,_('הזינו סכום','Enter an amount')))return'stay';D.tx.push(stampTx(txIn(TD,val('yp'),'bank',r2(a),val('yd'))));return S.role==='manager'?_('נרשם','Recorded'):_('נשלח לאישור מנהל','Sent for manager approval')});return'keep'},
 expense:v=>{expenseFlow(v?{date:TD,method:'cash',from:'cash',amount:'',desc:'',rows:[{to:PK(v),amount:''}],pats:[],cat:'personal',receipt:true}:null);return'keep'},
 addRule:()=>{modal(_('כלל חלוקה חדש','New split rule'),`<div class="form">${txt('rn',_('שם הכלל','Rule name'))}<div class="fr">${num('rr',_('רטורנו %','Retorno %'),0)}${num('rp',_('מטופלים נבחרים %','Selected patients %'),0)}</div>${num('rg',_('קרן התוכנית %','Program fund %'),0)}<p class="hint">${_('החלק של המטופלים מתחלק שווה בשווה בין המטופלים שתסמנו בכל הוצאה.','The patients’ share is split equally between the patients you tick on each expense.')}</p></div>`,
  ()=>{const r={id:uid(),name:val('rn'),retorno:+val('rr')||0,patients:+val('rp')||0,program:+val('rg')||0};if(!need(r.name&&r.retorno+r.patients+r.program===100,_('האחוזים צריכים להסתכם ב־100','Percentages must add up to 100')))return'stay';D.settings.rules.push(r);return _('הכלל נשמר','Rule saved')});return'keep'},
 delRule:v=>{D.settings.rules=D.settings.rules.filter(r=>r.id!==v);save()},
 cig:v=>{A.cigPick(v);return'keep'},
 settle:()=>{const n=cigN(),a=cigAmt();cigOpen().forEach(x=>x.settled=true);D.cigSettlements.push({date:TD,packs:n,amount:a});save();toast(`${n} ${_('חפיסות סומנו כהותחשבנו','packs marked settled')}`)},
 fee:v=>{const ym=TD.slice(0,7);modal(_('תשלום על טיפול','Treatment payment'),`<div class="form">${sel('fp',_('מטופל','Patient'),D.patients.filter(p=>!p.archived).map(p=>[p.id,p.name]),v||'')}<div class="fr">${sel('fc',_('מטבע','Currency'),[['USD','USD $'],['ILS','₪']],'USD')}${num('fu',_('סכום','Amount'))}</div>
  <div class="fr">${num('fx',_('שער דולר ששימש','Exchange rate used'),D.settings.fx)}${fld('fm',_('מיוחס לחודש','For month'),`<input id="fm" type="month" value="${ym}">`)}</div>${txt('fn',_('פירוט','Details'),_('חודש טיפול','Treatment month'))}
  <p class="hint">${_('תשלום על הטיפול נרשם כהכנסה של התוכנית. הוא לא נכנס לקופה האישית של המטופל.','A treatment payment is program income. It never goes into the patient’s personal fund.')}</p></div>`,
  ()=>{const u=+val('fu'),fx=+val('fx'),cur=val('fc');if(!need(u>0&&(cur==='ILS'||fx>0),_('הזינו סכום ושער','Enter amount and rate')))return'stay';D.settings.fx=cur==='USD'?fx:D.settings.fx;pat(val('fp')).fees.push({id:uid(),date:TD,month:val('fm')||ym,cur,amt:u,fx:cur==='USD'?fx:1,note:val('fn')});return _('התשלום נרשם','Payment recorded')});return'keep'},
 discharge:v=>{const p=pat(v),o=pool(PK(v)),b=r2(o.t),c=cigN(v),ca=cigAmt(v);
  modal(`${_('שחרור','Discharge')} · ${p.name}`,`<div class="form"><dl class="kv"><dt>${_('יתרה בחשבון','Account balance')}</dt><dd class="num ${b<0?'neg':''}">${money(b)} <span class="muted">(${_('מזומן','cash')} ${money(o.cash)})</span></dd><dt>${_('ימים בטיפול','Days in treatment')}</dt><dd>${dayN(p)}</dd></dl>
   ${c?`<div class="banner warnb"><div><b>${_('לפני השחרור','Before discharge')}:</b> ${c} ${_('חפיסות סיגריות לא הותחשבו מול רטורנו. הן יסומנו כהותחשבנו בשחרור.','cigarette packs are not settled with Retorno. They will be marked settled on discharge.')}</div></div>`:''}
   ${b>0?num('rr',_('סכום שהוחזר למטופל במזומן ₪','Cash returned to patient ₪'),Math.min(b,Math.max(0,r2(o.cash)))):`<p class="hint">${b<0?_('היתרה שלילית. החוב יישאר רשום בתיק בארכיון.','The balance is negative. The debt stays recorded in the archived file.'):''}</p>`}
   ${b>0?`<p class="hint">${_('מה שלא יוחזר יעבור לקרן התוכנית.','Whatever is not returned moves to the program fund.')}</p>`:''}<p class="hint">${_('הרשומות נשארות זמינות בארכיון למורשים.','Records stay available in the archive to authorized staff.')}</p></div>`,
   ()=>{const r=b>0?r2(Math.min(Math.max(+val('rr')||0,0),b)):0;
    cigOpen(v).forEach(x=>x.settled=true);if(c)D.cigSettlements.push({date:TD,packs:c,amount:ca});
    if(r){D.tx.push(txExp(TD,'cash',r,_('הוחזר בשחרור','Returned at discharge'),[{to:PK(v),amount:r}],{kind:'refund',dischargeOf:v}));PS=null}
    const rest=r2(b-r);if(rest>0)D.tx.push(txMoveBetween(TD,PK(v),'program',rest,_('יתרה לקרן התוכנית','Balance to program fund'),'transfer',{dischargeOf:v}));
    p.archived=true;p.discharged=TD;S.pid=null;return _('המטופל/ת שוחרר/ה והועבר/ה לארכיון','Patient discharged and archived')},_('אישור שחרור','Confirm discharge'));return'keep'},
 req:v=>{const t={trip:_('דיווח נסיעה ברכב פרטי','Private-car trip'),reimb:_('בקשת החזר הוצאה','Reimbursement request'),bonus:_('רישום בונוס שהובטח','Record a promised bonus')}[v];
  modal(t,`<div class="form">${S.role==='manager'?sel('rs',_('איש צוות','Staff member'),D.staff.filter(s=>s.role!=='manager').map(s=>[s.id,nm(s.name)]),'omer'):''}
   ${v==='trip'?num('rk',_('קילומטרים','Kilometres'))+`<p class="hint">${_('תעריף','Rate')}: ${money(D.settings.kmRate)} ${_('לק״מ','per km')}</p>`:num('ra','₪')}${txt('rd',_('פירוט','Details'))}</div>`,
   ()=>{const km=+val('rk'),a=+val('ra');if(!need(v==='trip'?km>0:a>0,_('הזינו סכום','Enter an amount')))return'stay';
    D.requests.push({id:uid(),staff:S.role==='manager'?val('rs'):me(),kind:v,date:TD,desc:val('rd')||t,km:v==='trip'?km:0,amount:v==='trip'?0:a,status:v==='bonus'?'approved':'pending'});if(v!=='bonus'&&S.role!=='manager')notifyMgr(_('בקשה ממתינה לאישור','A request needs approval'),`${staffName(me())}: ${val('rd')||t} · ${money(v==='trip'?Math.round(km*D.settings.kmRate):a)}`);return _('נשלח לאישור','Sent for approval')});return'keep'},
 approve:v=>{D.requests.find(r=>r.id===v).status='approved';save();toast(_('אושר','Approved'))},
 reject:v=>{D.requests.find(r=>r.id===v).status='rejected';save()},
 lmove:v=>{const[id,dir]=v.split('|');const l=D.leads.find(l=>l.id===id);const i=LEADST.findIndex(s=>s.id===l.status);l.status=LEADST[Math.max(0,Math.min(LEADST.length-1,i+ +dir))].id;save()},
 admit:v=>{const l=D.leads.find(l=>l.id===v);
  modal(`${_('קליטה','Admit')} · ${l.name}`,`<div class="form"><p class="hint">${_('הפרטים מהפנייה עוברים לפרופיל החדש.','Details from the lead carry over to the new profile.')}</p><div class="fr">${fld('ad',_('תאריך הגעה','Arrival date'),`<input id="ad" type="date" value="${l.arrival||TD}">`)}${sel('ac',_('מדריך','Counselor'),D.staff.filter(s=>s.role==='counselor').map(s=>[s.id,nm(s.name)]),'omer')}</div>${sel('at2',_('מטפל/ת','Therapist'),D.staff.filter(s=>s.role==='therapist').map(s=>[s.id,nm(s.name)]),'orit')}</div>`,
   ()=>{const d=val('ad');const id='p'+uid();D.patients.push({id,name:l.name,country:l.country,arrival:d,stage:'gozal',history:[{stage:'gozal',date:d,by:me(),note:_('נקלט מפנייה','Admitted from lead')}],counselor:val('ac'),therapist:val('at2'),archived:false,fees:[],fromLead:l.id});
    l.status='admitted';l.next='';return _('נוצר פרופיל מטופל','Patient profile created')},_('יצירת פרופיל','Create profile'));return'keep'},
 addLead:()=>{modal(_('פנייה חדשה','New lead'),`<div class="form">${txt('ln',_('שם','Name'))}<div class="fr">${txt('lc',_('מדינה','Country'))}${txt('ls',_('מקור הפנייה','Source'))}</div><div class="fr">${fld('lx',_('מעקב הבא','Next follow-up'),`<input id="lx" type="date" value="${add(TD,1)}">`)}${txt('lt',_('מה צריך לעשות','What needs doing'))}</div></div>`,
  ()=>{if(!need(val('ln'),_('כתבו שם','Enter a name')))return'stay';D.leads.push({id:uid(),name:val('ln'),country:val('lc'),source:val('ls'),status:'new',next:val('lx'),todo:val('lt')});return _('הפנייה נוספה','Lead added')});return'keep'},
 csv:()=>{const t=S._csv;const fb=()=>{modal(_('העתקה ידנית','Copy manually'),`<div class="f"><label for="csvt">${_('סמנו והעתיקו','Select and copy')}</label><textarea id="csvt" style="min-height:220px;direction:ltr" readonly>${esc(t)}</textarea></div>`);setTimeout(()=>$('#csvt')?.select(),50)};
  try{navigator.clipboard.writeText(t).then(()=>toast(_('הועתק – הדביקו באקסל','Copied – paste into Excel')),fb)}catch(e){fb()}return'keep'},
 ftab:v=>{S.ftab=v},
 rtab:v=>{S.rtab=v},
 month:v=>{const m=addMonth(S.month,+v);if(m<=TD.slice(0,7))S.month=m},
 calcReset:()=>{S.calc=null},
 receipt:v=>{const x=D.tx.find(t=>t.id===v);x.receipt=!x.receipt;save()},
 purchase:()=>{expenseFlow({date:TD,method:'cash',from:'cash',amount:'',desc:'',rows:[{to:'',amount:''}],pats:[],cat:'personal',receipt:true});return'keep'},
 cigPick:v=>{if(S.role!=='manager')return'keep';const p=v?pat(v):null;const o=p?pool(PK(p.id)):null;
  modal(_('סיגריות','Cigarettes'),`<div class="form">${sel('cp',_('מטופל','Patient'),patOpts(),v||'')}
   <div class="fr">${num('cn',_('מספר חפיסות','Number of packs'),1)}${num('cu',_('מחיר לחפיסה ₪','Price per pack ₪'),D.settings.cigPrice)}</div>
   <div class="f"><span class="lab">${_('יורד מ','Comes off')}</span><div class="seg2" role="radiogroup"><input type="radio" name="cgb" id="cg_c" value="cash" ${!o||o.cash>=o.bank?'checked':''}><label for="cg_c">${_('מזומן','Cash')}</label><input type="radio" name="cgb" id="cg_b" value="bank" ${o&&o.bank>o.cash?'checked':''}><label for="cg_b">${_('אשראי','Credit')}</label></div></div>
   <p class="hint" id="cgt"></p><p class="hint">${_('הסכום יורד מהקופה האישית ונרשם להתחשבנות מול רטורנו. כל חפיסה נספרת פעם אחת.','The amount comes off the personal fund and is logged for the Retorno settlement. Each pack is counted once.')}</p></div>`,
  ()=>{const n=Math.round(+val('cn')),u=+val('cu'),pid=val('cp');if(!need(pid&&n>0&&u>0,_('בדקו מטופל, כמות ומחיר','Check patient, quantity and price')))return'stay';
   D.tx.push(stampTx(cigTx(TD,pid,n,r2(u),document.querySelector('input[name=cgb]:checked').value)));
   const tot=cigN()+n;return tot>=10?_('נרשם. הגיע הזמן להתחשבן עם רטורנו','Recorded. Time to settle with Retorno'):_('נרשם','Recorded')});
  const upd=()=>{const t=$('#cgt');if(t)t.textContent=`${_('סה״כ','Total')}: ${money(r2((+val('cn')||0)*(+val('cu')||0)))}`};$('#cn').oninput=upd;$('#cu').oninput=upd;upd();return'keep'},
 cigEdit:v=>{const x=D.tx.find(t=>t.id===v);if(!x||S.role!=='manager')return'keep';const n=x.packs||1,u=x.unit||r2(x.amount/n),b=(x.moves[0]&&x.moves[0].m)||'cash';
  modal(_('עריכת סיגריות','Edit cigarettes'),`<div class="form"><p><b>${esc(pat(x.pid)?.name||'')}</b> · ${fmtDate(x.date)}</p>
   <div class="fr">${num('cn',_('מספר חפיסות','Number of packs'),n)}${num('cu',_('מחיר לחפיסה ₪','Price per pack ₪'),u)}</div>
   <div class="f"><span class="lab">${_('יורד מ','Comes off')}</span><div class="seg2" role="radiogroup"><input type="radio" name="cgb" id="cg_c" value="cash" ${b==='cash'?'checked':''}><label for="cg_c">${_('מזומן','Cash')}</label><input type="radio" name="cgb" id="cg_b" value="bank" ${b==='bank'?'checked':''}><label for="cg_b">${_('אשראי','Credit')}</label></div></div>
   ${x.settled?`<p class="hint">${_('הרשומה כבר הותחשבנה מול רטורנו. שינוי הסכום לא משנה את ההתחשבנות שנרשמה.','This entry was already settled with Retorno. Changing it does not change the recorded settlement.')}</p>`:''}
   <label class="toggle"><input type="checkbox" id="cdel">${_('מחיקת הרשומה','Delete this entry')}</label></div>`,
  ()=>{if($('#cdel').checked){D.tx=D.tx.filter(t=>t.id!==x.id);return _('נמחק','Deleted')}const nn=Math.round(+val('cn')),uu=+val('cu');if(!need(nn>0&&uu>0,_('בדקו כמות ומחיר','Check quantity and price')))return'stay';
   const t=cigTx(x.date,x.pid,nn,r2(uu),document.querySelector('input[name=cgb]:checked').value,x.id);t.settled=x.settled;t.status=x.status;t.by=x.by;D.tx[D.tx.indexOf(x)]=t;return _('עודכן','Updated')});return'keep'},
 shift:()=>{const st=staffBy(me());const rate=(st.comp&&st.comp.shift)||0;
  modal(_('דיווח משמרת','Report a shift'),`<div class="form"><div class="fr">${fld('sdt',_('תאריך','Date'),`<input id="sdt" type="date" value="${TD}">`)}${sel('skd',_('משמרת','Shift'),[['day',shiftLbl('day')],['evening',shiftLbl('evening')]],shiftAt(TD,NOWT).kind)}</div><p class="hint">${_('תעריף משמרת','Shift rate')}: ${money(rate)}. ${_('העלות נרשמת לחודש מיד עם הדיווח.','The cost is added to the month as soon as you report.')}</p></div>`,
  ()=>{const dt=val('sdt'),k=val('skd');if(D.shifts.some(s=>s.staff===me()&&s.date===dt&&s.kind===k)){toast(_('המשמרת הזו כבר דווחה','This shift was already reported'));return'stay'}D.shifts.push({id:uid(),staff:me(),date:dt,kind:k,rate,status:S.role==='manager'?'approved':'pending'});if(S.role!=='manager')notifyMgr(_('משמרת ממתינה לאישור','A shift needs approval'),`${staffName(me())} · ${shiftLbl(k)} · ${fmtDate(dt)}`);return S.role==='manager'?_('המשמרת נרשמה','Shift recorded'):_('המשמרת נשלחה לאישור מנהל','Shift sent for manager approval')},_('דיווח','Report'));return'keep'},
 comp:v=>{const s=staffBy(v);const c=s.comp||{};const row=(k,l)=>`<div class="fr">${num('c_'+k,l+' ₪',c[k]?c[k].amt:'')}${sel('p_'+k,_('לפי','Per'),[['session',nm(PER.session)],['hour',nm(PER.hour)]],c[k]?c[k].per:'session')}</div>`;
  modal(`${_('תעריפים','Rates')} · ${nm(s.name)}`,`<div class="form">${row('individual',_('טיפול פרטני','Individual'))}${row('group',_('קבוצה','Group'))}${row('activity',_('פעילות','Activity'))}<div class="fr">${num('c_shift',_('משמרת ₪','Shift ₪'),c.shift||'')}${num('c_monthly',_('סכום חודשי קבוע ₪','Fixed monthly ₪'),c.monthly||'')}</div><p class="hint">${_('השאירו ריק כשאין תשלום מהסוג הזה.','Leave empty where that kind of pay does not apply.')}</p></div>`,
  ()=>{const n={};['individual','group','activity'].forEach(k=>{const a=+val('c_'+k);if(a>0)n[k]={amt:a,per:val('p_'+k)}});if(+val('c_shift')>0)n.shift=+val('c_shift');if(+val('c_monthly')>0)n.monthly=+val('c_monthly');s.comp=n;return _('התעריפים עודכנו','Rates updated')});return'keep'},
 pay:v=>{const s=staffBy(v);const ow=staffOwed(v);
  modal(`${_('תשלום ל','Payment to ')}${nm(s.name)}`,`<div class="form"><p>${_('חוב פתוח','Owed now')}: <b>${money(ow)}</b></p><div class="fr">${num('pa','₪',ow)}${sel('pm',_('איך שולם','How paid'),[['org',_('העברה מהארגון','Transfer from the organization')],['cash',_('מזומן מקופת רטורנו','Cash from the Retorno box')]],'org')}</div>${txt('pn',_('פירוט','Details'),_('תשלום חודשי','Monthly payment'))}<p class="hint">${_('התשלום מקטין את החוב. העלות כבר נרשמה כשהעבודה אושרה, ולכן התשלום לא נספר שוב כהוצאה.','The payment reduces what is owed. The cost was recorded when the work was confirmed, so the payment is not counted again as an expense.')}</p></div>`,
  ()=>{const a=+val('pa');if(!need(a>0,_('הזינו סכום','Enter an amount')))return'stay';const pm=val('pm');const p={id:uid(),staff:v,date:TD,amount:r2(a),method:pm,note:val('pn')};D.payments.push(p);
   if(pm==='cash')D.tx.push({id:uid(),date:TD,kind:'staffpay',method:'cash',amount:r2(a),desc:`${_('תשלום ל','Payment to ')}${nm(s.name)}`,moves:[{p:'retorno',d:-r2(a),m:'cash'}],payId:p.id});
   return _('התשלום נרשם','Payment recorded')});return'keep'},
 cancelRule:()=>{const c=D.settings.cancel;modal(_('כלל תשלום בביטול','Cancellation pay rule'),`<div class="form"><p class="hint">${_('איזה אחוז מהתעריף משולם לאיש הצוות כשפעילות מבוטלת:','What share of the rate the staff member is paid when an activity is cancelled:')}</p><div class="fr">${num('cp1',_('המטופל ביטל %','Patient cancelled %'),c.patient)}${num('cp2',_('איש הצוות / התוכנית ביטלו %','Staff / program cancelled %'),c.staff)}</div>${num('cp3',_('אחר – מזג אוויר, חירום %','Other – weather, emergency %'),c.other)}<p class="hint">${_('הכלל חל על ביטולים מעכשיו. ביטולים קודמים שומרים את העלות שנרשמה.','Applies to cancellations from now on. Earlier ones keep their recorded cost.')}</p></div>`,
  ()=>{const v=[+val('cp1'),+val('cp2'),+val('cp3')];if(!need(v.every(x=>x>=0&&x<=100),_('אחוזים בין 0 ל־100','Percentages between 0 and 100')))return'stay';D.settings.cancel={patient:v[0],staff:v[1],other:v[2]};return _('הכלל נשמר','Rule saved')});return'keep'},
 exportX:()=>{exportExcel();return'keep'},
 exportP:(v,b)=>{exportPdf(b);return'keep'},
 logout:()=>{if(window.RETORNO_SUPA){window.RETORNO_SUPA.signOut();return'keep'}setAdminIn(false);S.viewAs=null;S.view='dashboard';toast(_('יצאת מחשבון המנהל','Signed out of the manager account'))},
 apSess:v=>{const x=findInst(v);const inp=document.querySelector(`.amt[data-key="${v}"]`);const a=inp?+inp.value:NaN;if(!(a>=0)||inp.value===''){toast(_('הזינו סכום לפני האישור','Enter an amount before approving'));return'keep'}
  Object.assign(D.log[x.key],{cost:r2(a),costStatus:'approved',approvedBy:me()});save();toast(_('הפגישה אושרה והעלות נרשמה','Session approved and cost recorded'))},
 rjSess:v=>{const x=findInst(v);Object.assign(D.log[x.key],{cost:0,costStatus:'rejected',approvedBy:me()});save();toast(_('נדחה – לא תירשם עלות','Rejected – no cost recorded'))},
 apAllSess:()=>{let n=0,skip=0;document.querySelectorAll('.amt[data-key]').forEach(inp=>{const a=+inp.value;if(inp.value===''||!(a>=0)){skip++;return}const x=findInst(inp.dataset.key);Object.assign(D.log[x.key],{cost:r2(a),costStatus:'approved',approvedBy:me()});n++});save();toast(`${n} ${_('פגישות אושרו','sessions approved')}${skip?` · ${skip} ${_('בלי סכום – נשארו להמתנה','without an amount – still waiting')}`:''}`)},
 classify:v=>{const x=D.tx.find(t=>t.id===v);let rows=groupMoves(x).map(g=>({to:g.p,amount:String(-g.d),from:(x.moves.find(m=>m.p===g.p)||{}).m==='bank'?'bank':'cash'}));
  if(!rows.length){const ps=(x.forPids||[]).filter(p=>pat(p));if(ps.length){const each=Math.floor(x.amount/ps.length*100)/100;rows=ps.map((p,i)=>({to:PK(p),amount:String(i===ps.length-1?r2(x.amount-each*(ps.length-1)):each)}))}else rows=[{to:'',amount:''}]}
  expenseFlow({date:x.date,method:x.method,from:x.from||(medium(x.method)==='cash'?'cash':'bank'),amount:String(x.amount),desc:nm(x.desc),rows,pats:[],cat:x.cat||((x.forPids||[]).length?'personal':'other'),receipt:x.receipt!==false,approveId:x.id,items:x.items,by:x.by,note:x.note,forPids:x.forPids});return'keep'},
 apTx:v=>{const x=D.tx.find(t=>t.id===v);x.status='approved';x.approvedBy=me();save();toast(_('אושר ונכנס לקופה','Approved and added to the books'))},
 rjTx:v=>{const x=D.tx.find(t=>t.id===v);x.status='rejected';x.approvedBy=me();const r=x.reqId&&D.requests.find(q=>q.id===x.reqId);if(r&&r.status==='pending')r.status='rejected';save();toast(_('נדחה – לא נכנס לקופה','Rejected – not added to the books'))},
 apShift:v=>{const s=D.shifts.find(z=>z.id===v);const a=+val('sh_'+v);if(!(a>=0)){toast(_('הזינו סכום','Enter an amount'));return'keep'}s.rate=r2(a);s.status='approved';save();toast(_('המשמרת אושרה','Shift approved'))},
 rjShift:v=>{D.shifts.find(z=>z.id===v).status='rejected';save()},
 reportSession:()=>{const th=D.staff.filter(s=>s.role==='therapist');
  modal(_('דיווח פגישה עם מטפל','Report a therapist session'),`<div class="form"><div class="fr">${sel('rsT',_('מטפל/ת','Therapist'),th.map(s=>[s.id,nm(s.name)]),th[0].id)}${sel('rsP',_('מטופל','Patient'),[['all',_('קבוצה – כל המטופלים','Group – all patients')],...patOpts()],'')}</div>
   <div class="fr">${sel('rsK',_('סוג','Type'),[['individual',TYPES.individual[S.lang]],['group',TYPES.group[S.lang]],['activity',TYPES.activity[S.lang]]],'individual')}${fld('rsD',_('תאריך','Date'),`<input id="rsD" type="date" value="${TD}">`)}</div>
   <div class="fr">${fld('rs1',_('התחלה','Start'),`<input id="rs1" type="time" value="${NOWT<'23:00'?fromMin(Math.max(0,toMin(NOWT)-60)):'15:00'}">`)}${fld('rs2',_('סיום','End'),`<input id="rs2" type="time" value="${NOWT}">`)}</div>
   <p class="hint">${_('הפגישה תסומן כבוצעה. הסכום ייקבע ויאושר על ידי המנהל לפני שהעלות נרשמת.','The session is marked as done. The manager sets and approves the amount before any cost is recorded.')}</p></div>`,
  ()=>{const st=val('rsT'),pid=val('rsP'),k=val('rsK'),dt=val('rsD'),t1=val('rs1'),t2=val('rs2');if(!need(dt&&t1&&t2&&t2>t1,_('בדקו תאריך ושעות','Check the date and times')))return'stay';
   // a scheduled session for the same therapist and patient that day is confirmed instead of creating a second one
   const ex=instances(dt).find(x=>x.staff===st&&x.type===k&&x.log.status==='planned'&&(pid==='all'?x.pts==='all':x.patients.includes(pid)));
   const mk=x=>{const rate=rateCost(x);const att={};(pid==='all'?x.patients:[pid]).forEach(p=>att[p]='p');D.log[x.key]={status:'done',att,by:me(),reportedBy:me(),basis:basisSnap(x),cost:S.role==='manager'?rate:0,suggest:rate,costStatus:S.role==='manager'?'approved':'pending'};if(S.role!=='manager')notifyMgr(_('פגישה ממתינה לאישור סכום','A session needs an amount approved'),`${staffName(st)} · ${pid==='all'?_('קבוצה','group'):(pat(pid)?.name||'')} · ${fmtDate(dt)}`)};
   if(ex){mk(ex);return _('נמצאה הפגישה בלו״ז וסומנה כבוצעה – נשלחה לאישור','Found the session in the schedule and marked it done – sent for approval')}
   const it={id:uid(),time:t1,end:t2,type:k,title:{he:TYPES[k].he==='פרטני'?'טיפול פרטני':TYPES[k].he,en:k==='individual'?'Individual therapy':TYPES[k].en},loc:{he:'',en:''},staff:st,pts:pid==='all'?'all':[pid],reported:true};
   const ov=D.overrides[dt]=D.overrides[dt]||{};(ov.add=ov.add||[]).push(it);IC={};const x=instances(dt).find(z=>z.id===it.id);mk(x);
   return S.role==='manager'?_('הפגישה נרשמה','Session recorded'):_('הפגישה דווחה ונשלחה לאישור המנהל','Session reported and sent for manager approval')},_('דיווח','Report'));return'keep'},
 tAdd:()=>{const now=shiftAt(TD,NOWT);modal(_('משימה חדשה','New task'),`<div class="form">${area('tt',_('מה צריך לעשות','What needs doing'))}<div class="fr">${sel('tp',_('קשור למטופל (לא חובה)','Related patient (optional)'),[['',_('ללא','None')],...patOpts()],'')}${fld('td',_('עד תאריך (לא חובה)','Due by (optional)'),'<input id="td" type="date">')}</div><label class="toggle"><input type="checkbox" id="tu">${_('דחוף','Urgent')}</label><p class="hint">${_('המשימה נרשמת למשמרת','Logged to the shift')} ${shiftWhen(now)}. ${_('אם לא תבוצע, היא תופיע למשמרת הבאה.','If it is not done, it shows for the next shift.')}</p></div>`,
  ()=>{const t=val('tt');if(!need(t,_('כתבו את המשימה','Write the task')))return'stay';D.tasks.push({id:uid(),text:t,by:me(),shift:shiftKey(now),created:TD+'T'+NOWT,urgent:$('#tu').checked,pid:val('tp')||'',due:val('td')||'',done:false});return _('המשימה נוספה','Task added')},_('הוספה','Add'));return'keep'},
 tDone:v=>{const t=D.tasks.find(x=>x.id===v);t.done=true;t.doneBy=me();const n=new Date();t.doneAt=iso(n)+'T'+pad(n.getHours())+':'+pad(n.getMinutes());save();toast(_('המשימה סומנה כבוצעה','Task marked done'))},
 tUndo:v=>{const t=D.tasks.find(x=>x.id===v);t.done=false;delete t.doneBy;delete t.doneAt;save()},
 tDel:v=>{D.tasks=D.tasks.filter(x=>x.id!==v);save();toast(_('המשימה נמחקה','Task deleted'))},
 tClear:()=>{const n=D.tasks.filter(t=>t.done).length;modal(_('מחיקת המשימות שבוצעו','Delete done tasks'),`<p>${n} ${_('משימות שבוצעו יימחקו לצמיתות.','done tasks will be deleted for good.')}</p>`,()=>{D.tasks=D.tasks.filter(t=>!t.done);return _('נמחקו','Deleted')},_('מחיקה','Delete'));return'keep'},
 rMonth:v=>{const cur=S.rMonth||TD.slice(0,7);S.rMonth=+v===0?TD.slice(0,7):addMonth(cur,+v)},
 rFill:()=>{const ym=S.rMonth||TD.slice(0,7);const days=monthDays(ym);let n=0;
  // repeat the first full week of the month across the rest of it, filling only empty slots
  days.slice(7).forEach(d=>{const src=D.roster[add(d,-7*Math.floor(diff(days[0],d)/7))]||{};const r=D.roster[d]||(D.roster[d]={});delete r.demo;['day','evening'].forEach(k=>{if(!r[k]&&src[k]){r[k]=src[k];n++}})});
  save();toast(n?`${n} ${_('משמרות שובצו לפי השבוע הראשון','shifts filled from the first week')}`:_('אין משבצות ריקות למלא','No empty slots to fill'))},
 rClear:()=>{const ym=S.rMonth||TD.slice(0,7);modal(_('ניקוי שיבוצי החודש','Clear this month'),`<p>${_('כל השיבוצים של','All assignments for')} ${monthLbl(ym)} ${_('יימחקו.','will be cleared.')}</p>`,()=>{monthDays(ym).forEach(d=>{delete D.roster[d]});return _('השיבוצים נוקו','Assignments cleared')},_('ניקוי','Clear'));return'keep'},
 claim:v=>{claimStaff(v);return'keep'},
 unlink:v=>{if(!SH.on)return'keep';modal(_('ניתוק חשבון','Unlink account'),`<p>${_('החשבון ינותק מאיש הצוות. בכניסה הבאה הוא יתבקש לבחור שם מחדש.','The account will be unlinked from the staff member. Next time they will be asked to pick a name again.')}</p>`,()=>{SH.db.doc('links/'+v).delete().catch(onWriteErr);delete SH.links[v];return _('החשבון נותק','Account unlinked')},_('ניתוק','Unlink'));return'keep'},
 staffEdit:v=>{const s=v?staffBy(v):null;const linked=s&&Object.values(SH.links).includes(s.id);
  modal(s?`${_('פרטי איש צוות','Staff details')} · ${nm(s.name)}`:_('איש צוות חדש','New staff member'),`<div class="form"><div class="fr">${txt('sn_he',_('שם בעברית','Name in Hebrew'),s?s.name.he:'')}${txt('sn_en',_('שם באנגלית','Name in English'),s?s.name.en:'')}</div>
   <div class="fr">${sel('sr',_('תפקיד','Role'),Object.keys(ROLES).filter(r=>r!=='instructor').map(r=>[r,ROLES[r][S.lang]]),s?s.role:'counselor')}${txt('sph',_('טלפון','Phone'),s?s.phone||'':'')}</div>
   ${window.RETORNO_SUPA?`<div class="fr">${fld('sun',_('שם משתמש לכניסה','Sign-in username'),`<input id="sun" dir="ltr" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="off" value="${esc(s&&s.username||'')}" placeholder="${_('למשל','e.g.')} dana">`)}${fld('spw',s&&s.username?_('סיסמה חדשה (ריק = ללא שינוי)','New password (empty = keep)'):_('סיסמה','Password'),`<input id="spw" dir="ltr" autocomplete="new-password" autocapitalize="none" autocorrect="off" spellcheck="false">`)}</div><p class="hint">${_('אותיות באנגלית, מספרים, נקודה או מקף. סיסמה – לפחות 6 תווים. מסרו לאיש הצוות את שם המשתמש והסיסמה. מה שהוא רואה נקבע לפי התפקיד: מנהל רואה הכל, מטפל ומדריך רואים רק את מה ששייך להם.','English letters, numbers, dot or dash. Password – at least 6 characters. Give the staff member the username and password. What they see follows the role: a manager sees everything, therapists and counselors see only what is theirs.')}</p>`:''}
   ${s&&s.id!==myStaffId()?`<label class="toggle"><input type="checkbox" id="sdel">${_('הסרת איש הצוות מהמערכת','Remove this staff member')}</label>${linked?`<p class="hint">${_('החשבון המחובר ינותק.','The linked account will be unlinked.')}</p>`:''}`:''}
   ${window.RETORNO_SUPA?'':`<p class="hint">${_('אחרי ההוספה, איש הצוות פותח את הקישור לעמוד ובוחר את השם שלו.','After adding, the staff member opens the page link and picks their name.')}</p>`}</div>`,
  ()=>{const he=val('sn_he'),en=val('sn_en')||he;if(!need(he||en,_('כתבו שם','Enter a name')))return'stay';
   const RS=window.RETORNO_SUPA,un=RS?val('sun').toLowerCase():'',pw=RS?($('#spw')?$('#spw').value:''):'';
   if(RS&&un&&!/^[a-z0-9._-]{3,30}$/.test(un)&&!/^\S+@\S+\.\S+$/.test(un)){toast(_('שם משתמש: 3–30 תווים, אותיות באנגלית, מספרים, נקודה או מקף','Username: 3–30 characters – English letters, numbers, dot or dash'));return'stay'}
   if(RS&&pw&&pw.length<6){toast(_('הסיסמה צריכה לפחות 6 תווים','The password needs at least 6 characters'));return'stay'}
   if(RS&&un&&!(s&&s.username)&&!pw){toast(_('לחשבון חדש צריך גם סיסמה','A new account also needs a password'));return'stay'}
   if(RS&&un&&D.staff.some(x=>x.username===un&&(!s||x.id!==s.id))){toast(_('שם המשתמש תפוס','That username is taken'));return'stay'}
   const acct=(sid,role,old)=>{if(!RS)return;if(!un){if(old)RS.removeAccount(sid).then(()=>toast(_('החשבון הוסר','Account removed'))).catch(e=>toast(String(e.message||e)));return}
    if(un===old&&!pw&&!(s&&s.role!==role))return;
    const self=sid===myStaffId()&&un!==old;const run=()=>RS.setAccount(sid,un,pw,role==='manager').then(()=>{toast(_('החשבון עודכן – שם משתמש: ','Account saved – username: ')+un);if(sid===myStaffId()&&un!==old){toast(_('שם המשתמש שלך השתנה – יש להיכנס מחדש','Your username changed – please sign in again'));setTimeout(()=>RS.signOut(),1500)}})
     .catch(e=>{const m=String(e.message||e);toast(/taken/.test(m)?_('שם המשתמש תפוס','That username is taken'):_('שמירת החשבון נכשלה: ','Saving the account failed: ')+m);const x=staffBy(sid);if(x){x.username=old||'';save()}});if(self){toast(_('שומר…','Saving…'));setTimeout(run,2500)}else run()};
   if(s&&$('#sdel')&&$('#sdel').checked){if(RS&&s.username)RS.removeAccount(s.id).catch(()=>{});D.staff=D.staff.filter(x=>x.id!==s.id);Object.entries(SH.links).forEach(([u,id])=>{if(id===s.id&&SH.on){SH.db.doc('links/'+u).delete().catch(onWriteErr);delete SH.links[u]}});return _('איש הצוות הוסר','Staff member removed')}
   if(s){const old=s.username||'',prevRole=s.role;s.name={he:he||en,en};s.role=val('sr');s.phone=val('sph');if(RS){s.username=un;if(un===old&&!pw&&prevRole===s.role){}else acct(s.id,s.role,old)}return _('הפרטים נשמרו','Details saved')}
   const nid='s'+uid();D.staff.push({id:nid,name:{he:he||en,en},role:val('sr'),phone:val('sph'),comp:{},...(RS?{username:un}:{})});if(RS&&un)acct(nid,val('sr'),'');return _('איש הצוות נוסף','Staff member added')});return'keep'},
 addPatient:()=>{const cs=D.staff.filter(s=>s.role==='counselor'),th=D.staff.filter(s=>s.role==='therapist');
  modal(_('מטופל חדש','New patient'),`<div class="form"><div class="fr">${txt('npn',_('שם','Name'))}${txt('npc',_('מדינה','Country'))}</div>
   <div class="fr">${fld('npa',_('תאריך הגעה','Arrival date'),`<input id="npa" type="date" value="${TD}">`)}${sel('nps',_('שלב','Stage'),STAGES.map(s=>[s.id,s[S.lang]]),'gozal')}</div>
   <div class="fr">${sel('npco',_('מדריך','Counselor'),[['',_('—','—')],...cs.map(s=>[s.id,nm(s.name)])],'')}${sel('npt',_('מטפל/ת','Therapist'),[['',_('—','—')],...th.map(s=>[s.id,nm(s.name)])],'')}</div></div>`,
  ()=>{const n=val('npn');if(!need(n,_('כתבו שם','Enter a name')))return'stay';const d=val('npa')||TD;D.patients.push({id:'p'+uid(),name:n,country:val('npc'),arrival:d,stage:val('nps'),history:[{stage:val('nps'),date:d,by:me()}],counselor:val('npco'),therapist:val('npt'),archived:false,fees:[]});return _('המטופל נוסף','Patient added')},_('הוספה','Add'));return'keep'},
 settings:()=>{const s=D.settings;modal(_('הגדרות','Settings'),`<div class="form"><div class="fr">${num('st1',_('מחיר חפיסת סיגריות ₪','Cigarette pack price ₪'),s.cigPrice)}${num('st2',_('החזר נסיעה לק״מ ₪','Mileage per km ₪'),s.kmRate)}</div>${num('st3',_('שער דולר ברירת מחדל','Default USD rate'),s.fx)}</div>`,
  ()=>{const a=+val('st1'),b=+val('st2'),c=+val('st3');if(!need(a>=0&&b>=0&&c>0,_('בדקו את הערכים','Check the values')))return'stay';s.cigPrice=a;s.kmRate=b;s.fx=c;return _('ההגדרות נשמרו','Settings saved')});return'keep'},
 demoLoad:()=>{modal(_('טעינת נתוני דוגמה','Load sample data'),`<p>${_('יתווספו מטופלים, פעילויות וכספים לדוגמה, וכל הצוות יראה אותם. הם מסומנים כדוגמה ואפשר למחוק את כולם בלחיצה אחת.','Sample patients, activities and money entries will be added, and the whole team will see them. They are marked as samples and can all be deleted in one click.')}</p>`,()=>{loadDemo();return _('נתוני הדוגמה נטענו','Sample data loaded')},_('טעינה','Load'));return'keep'},
 demoClear:()=>{modal(_('מחיקת נתוני הדוגמה','Delete sample data'),`<p>${_('כל הנתונים שסומנו כדוגמה יימחקו לצמיתות. נתונים שהוזנו ידנית יישארו.','Everything marked as sample data will be deleted for good. Data entered by hand stays.')}</p>`,()=>{clearDemo();return _('נתוני הדוגמה נמחקו','Sample data deleted')},_('מחיקה','Delete'));return'keep'},
 reportExp:v=>{const it=[{desc:'',amount:''}];
  modal(_('דיווח הוצאה','Report an expense'),`<div class="form"><div class="fr">${fld('rxd',_('תאריך','Date'),`<input id="rxd" type="date" value="${TD}">`)}${sel('rxm',_('איך שילמת','How you paid'),[['cash',_('מזומן מהקופה','Cash from the box')],['card',_('אשראי','Credit')],['staff:'+me(),_('מכיסי – צריך החזר','Out of my pocket – needs a refund')]],'cash')}</div>
   <div class="f"><span class="lab">${_('על מה הוצאת – כל פריט בשורה','What you spent on – one item per line')}</span><div id="rxi" class="xrows"></div><button class="btn sm ghost" id="rxadd" type="button">+ ${_('פריט','Item')}</button><div class="okline ok" id="rxt"></div></div>
   <div class="f"><span class="lab">${_('בשביל איזה מטופל (לא חובה)','For which patient (optional)')}</span><div class="checks">${activeP().map(p=>`<label><input type="checkbox" class="rxp" value="${p.id}" ${p.id===v?'checked':''}>${esc(p.name)}</label>`).join('')}</div></div>
   ${txt('rxn',_('הערה למנהל (לא חובה)','Note for the manager (optional)'))}
   <label class="toggle"><input type="checkbox" id="rxr" checked>${_('יש קבלה','I have a receipt')}</label>
   <p class="hint">${_('ההוצאה נשלחת למנהל. הוא מסווג על חשבון מי היא ומאשר. עד אז היא לא נכנסת לקופות.','The expense goes to the manager, who decides who bears it and approves it. Until then it does not touch any fund.')}</p></div>`,
  ()=>{read();const items=it.filter(i=>i.desc.trim()||+i.amount).map(i=>({desc:i.desc.trim(),amount:r2(+i.amount)}));
   if(!need(items.length&&items.every(i=>i.desc&&i.amount>0),_('בכל שורה כתבו על מה ואת הסכום','Each line needs what it was for and the amount')))return'stay';
   const total=r2(items.reduce((s,i)=>s+i.amount,0));const m=val('rxm');
   D.tx.push({id:uid(),date:val('rxd')||TD,kind:'exp',method:m,amount:total,desc:items.map(i=>i.desc).join(', '),items,forPids:[...document.querySelectorAll('.rxp:checked')].map(i=>i.value),note:val('rxn'),receipt:$('#rxr').checked,cat:'other',moves:[],report:true,by:me(),status:'pending'});notifyMgr(_('הוצאה ממתינה לסיווג','An expense needs classifying'),`${staffName(me())} · ${money(total)} · ${items.map(i=>i.desc).join(', ')}`);
   return _('ההוצאה נשלחה למנהל לסיווג ואישור','Expense sent to the manager to classify and approve')},_('שליחה למנהל','Send to the manager'));
  const box=$('#rxi');const read=()=>{box.querySelectorAll('[data-i]').forEach(e=>{it[+e.dataset.i][e.dataset.f]=e.value})};
  const tot=()=>{read();$('#rxt').textContent=`${_('סה״כ','Total')}: ${money(r2(it.reduce((s,i)=>s+(+i.amount||0),0)))}`};
  const draw=()=>{box.innerHTML=it.map((i,n)=>`<div class="xrow"><input data-i="${n}" data-f="desc" dir="auto" placeholder="${_('למשל: שווארמה לדניאל','e.g. shawarma for Daniel')}" value="${esc(i.desc)}" aria-label="${_('פריט','Item')}"><input data-i="${n}" data-f="amount" type="number" inputmode="decimal" step="0.01" placeholder="₪" value="${i.amount}" aria-label="${_('סכום','Amount')}"><button type="button" class="icon-btn" data-rm="${n}" aria-label="${_('הסרה','Remove')}">×</button></div>`).join('');tot()};
  box.oninput=tot;box.onclick=e=>{const b=e.target.closest('[data-rm]');if(!b)return;read();it.splice(+b.dataset.rm,1);if(!it.length)it.push({desc:'',amount:''});draw()};
  $('#rxadd').onclick=()=>{read();it.push({desc:'',amount:''});draw();const l=box.querySelectorAll('[data-f=desc]');l[l.length-1].focus()};draw();return'keep'},
 editPatient:v=>{const p=pat(v);const cs=D.staff.filter(s=>s.role==='counselor'),th=D.staff.filter(s=>s.role==='therapist');
  modal(`${_('עריכת פרטים','Edit details')} · ${p.name}`,`<div class="form"><div class="fr">${txt('epn',_('שם','Name'),p.name)}${txt('epc',_('מדינה','Country'),p.country||'')}</div>
   <div class="fr">${fld('epa',_('תאריך הגעה','Arrival date'),`<input id="epa" type="date" value="${p.arrival}">`)}${sel('epco',_('מדריך','Counselor'),[['',_('—','—')],...cs.map(s=>[s.id,nm(s.name)])],p.counselor||'')}</div>
   ${sel('ept',_('מטפל/ת','Therapist'),[['',_('—','—')],...th.map(s=>[s.id,nm(s.name)])],p.therapist||'')}<p class="hint">${_('לשינוי שלב משתמשים בכפתור “שינוי שלב” בלשונית הסקירה, כדי שההיסטוריה תישמר.','To change the stage use “Change stage” on the Overview tab, so the history is kept.')}</p></div>`,
  ()=>{const n=val('epn');if(!need(n,_('כתבו שם','Enter a name')))return'stay';p.name=n;p.country=val('epc');p.arrival=val('epa')||p.arrival;p.counselor=val('epco');p.therapist=val('ept');return _('הפרטים נשמרו','Details saved')});return'keep'},
 unarchive:v=>{const p=pat(v);const linked=D.tx.filter(x=>x.dischargeOf===v||(x.kind==='refund'&&x.date===p.discharged&&x.moves.some(m=>m.p===PK(v))));
  modal(`${_('ביטול השחרור','Undo discharge')} · ${p.name}`,`<div class="form"><p>${_('המטופל יחזור לרשימת הפעילים.','The patient returns to the active list.')}</p>${linked.length?`<p>${_('יבוטלו גם הרישומים שנעשו בשחרור:','The entries made at discharge are also undone:')}</p><ul class="items">${linked.map(x=>`<li><span>${esc(nm(x.desc))}</span><b class="num">${money(x.amount)}</b></li>`).join('')}</ul>`:''}</div>`,
  ()=>{const ids=new Set(linked.map(x=>x.id));D.tx=D.tx.filter(x=>!ids.has(x.id));p.archived=false;delete p.discharged;S.arch=false;return _('המטופל הוחזר לפעילים','Patient is active again')},_('ביטול השחרור','Undo discharge'));return'keep'},
 edit:v=>{const x=findInst(v);if(!x||!canEditSched())return'keep';const mgr=S.role==='manager';const tplItem=x.src==='tpl'?(D.template[dowOf(x.date)]||[]).find(i=>i.id===x.id):null;
  const act=activeOn(x.date);const picked=x.pts==='all'?[]:x.pts;
  const leadV=x.staff||(x.leader?'ext':x.byShift?'shift':'');
  modal(_('עריכת פעילות','Edit activity'),`<div class="form"><p class="hint">${fmtDate(x.date,{weekday:'long',day:'numeric',month:'long'})}</p>
   <div class="fr">${txt('et_he',_('שם בעברית','Name in Hebrew'),x.title.he||'')}${txt('et_en',_('שם באנגלית','Name in English'),x.title.en||'')}</div>
   <div class="fr">${sel('ety',_('סוג','Type'),Object.keys(TYPES).map(k=>[k,TYPES[k][S.lang]]),x.type)}${txt('elo',_('מיקום','Location'),nm(x.loc)||'')}</div>
   <div class="fr">${fld('e1',_('התחלה','Start'),`<input id="e1" type="time" value="${x.time}">`)}${fld('e2',_('סיום','End'),`<input id="e2" type="time" value="${x.end}">`)}</div>
   <div class="fr">${sel('ele',_('מי מוביל','Led by'),[['',_('אף אחד – שגרה','Nobody – routine')],['shift',_('המדריך שבמשמרת','The counselor on shift')],...D.staff.filter(s=>s.role!=='admissions').map(s=>[s.id,nm(s.name)]),['ext',_('מנחה חיצוני','External leader')]],leadV)}${txt('elx',_('שם המנחה החיצוני','External leader’s name'),x.leader?nm(x.leader):'')}</div>
   <div class="f"><span class="lab">${_('משתתפים','Participants')}</span><div class="checks"><label><input type="checkbox" id="eall" ${x.pts==='all'?'checked':''}>${_('כל המטופלים','All patients')}</label>${act.map(p=>`<label><input type="checkbox" class="ep" value="${p.id}" ${picked.includes(p.id)?'checked':''}>${esc(p.name)}</label>`).join('')}</div></div>
   ${txt('ern',_('סיבת השינוי (לא חובה)','Reason for the change (optional)'),x.moveReason?nm(x.moveReason):'')}
   ${tplItem&&mgr?`<div class="f"><span class="lab">${_('על מה השינוי חל','Apply the change to')}</span><div class="seg2" role="radiogroup"><input type="radio" name="esc" id="es_d" value="day" checked><label for="es_d">${_('רק ביום הזה','This day only')}</label><input type="radio" name="esc" id="es_w" value="week"><label for="es_w">${_('כל שבוע, בלו״ז הקבוע','Every week, in the base schedule')}</label></div></div>`:tplItem?`<p class="hint">${_('השינוי חל על היום הזה בלבד. שינוי קבוע בלו״ז נעשה ע״י המנהל.','This changes this day only. Permanent schedule changes are made by the manager.')}</p>`:''}
   <label class="toggle"><input type="checkbox" id="edel">${_('הסרת הפעילות','Remove this activity')}</label></div>`,
  ()=>{const he=val('et_he'),en=val('et_en');if(!need(he||en,_('כתבו שם לפעילות','Name the activity')))return'stay';
   const t1=val('e1'),t2=val('e2');if(!need(t1&&t2&&t2>t1,_('שעת הסיום צריכה להיות אחרי ההתחלה','End time must be after the start')))return'stay';
   const pk=[...document.querySelectorAll('.ep:checked')].map(i=>i.value);const all=$('#eall').checked||!pk.length;
   const ld=val('ele');const f={title:{he:he||en,en:en||he},type:val('ety'),loc:{he:val('elo'),en:val('elo')},time:t1,end:t2,pts:all?'all':pk,
    staff:['','shift','ext'].includes(ld)?'':ld,byShift:ld==='shift'||ld==='ext',inShift:ld==='shift'||ld==='ext',leader:ld==='ext'&&val('elx')?{he:val('elx'),en:val('elx')}:null};
   if(f.type==='routine'){f.byShift=false;f.inShift=false}
   const scope=(document.querySelector('input[name=esc]:checked')||{}).value||'day';const del=$('#edel').checked;
   const ov=D.overrides[x.date]=D.overrides[x.date]||{};
   if(x.src==='day'){if(del){ov.add=(ov.add||[]).filter(a=>a.id!==x.id);return _('הפעילות הוסרה מהיום הזה','Removed from this day')}const it=ov.add.find(a=>a.id===x.id);Object.assign(it,f);if(!f.leader)delete it.leader;return _('השינוי נשמר','Change saved')}
   if(scope==='week'&&mgr&&tplItem){const l=D.template[dowOf(x.date)];if(del){D.template[dowOf(x.date)]=l.filter(i=>i.id!==x.id);return _('הפעילות הוסרה מהלו״ז הקבוע','Removed from the base schedule')}
    Object.assign(tplItem,f);if(!f.leader)delete tplItem.leader;if(ov.edit)delete ov.edit[x.id];return _('הלו״ז הקבוע עודכן לכל השבועות','Base schedule updated for every week')}
   ov.edit=ov.edit||{};if(del){ov.edit[x.id]={hidden:true};return _('הפעילות הוסרה מהיום הזה','Removed from this day')}
   const d={...f};if(!d.leader)d.leader=null;if(val('ern'))d.moveReason=val('ern');ov.edit[x.id]=d;return _('השינוי נשמר ליום הזה','Change saved for this day')},_('שמירה','Save'));
  document.querySelectorAll('.ep').forEach(c=>c.onchange=()=>{$('#eall').checked=!document.querySelector('.ep:checked')});return'keep'},
 msgSend:()=>{const ty=(document.querySelector('input[name=mty]:checked')||{}).value||'general';const ti=val('mti'),bo=$('#mbo').value.trim();const to=[...document.querySelectorAll('.mto:checked')].map(i=>i.value);
  if(!ti&&!bo){toast(_('כתבו כותרת או תוכן','Write a title or a message'));return'keep'}if(!to.length){toast(_('בחרו למי לשלוח','Choose who receives it'));return'keep'}
  const m={id:uid(),from:me(),type:ty,to,title:ti||bo.slice(0,60),body:bo,at:new Date().toISOString()};(D.messages||(D.messages=[])).push(m);save();
  notify({audience:{staff:to},title:`${MSGT[ty].he==='חשובה'?'❗ ':''}${m.title}`,body:bo.slice(0,180),url:'#messages',urgent:ty==='important',tag:'msg-'+m.id});
  toast(`${_('ההודעה נשלחה ל','Sent to ')}${to.length} ${_('אנשי צוות','staff')}`)},
 pushOn:()=>{if(window.RETORNO_PUSH)window.RETORNO_PUSH.enable().then(ok=>{toast(ok?_('ההתראות הופעלו','Notifications turned on'):_('לא ניתן היה להפעיל התראות. באייפון צריך קודם להוסיף את האפליקציה למסך הבית.','Could not turn on notifications. On iPhone, add the app to the home screen first.'));render()});return'keep'},
 setupFresh:()=>{const n=val('mgrName');if(!n){toast(_('כתבו את שמך','Enter your name'));return'keep'}const id='s'+uid();D.staff.push({id,name:{he:n,en:n},role:'manager',phone:'',comp:{},username:(window.RETORNO_SUPA.username||'')});save();setTimeout(()=>claimStaff(id),600);return'keep'},
 /* daily summary */




 newSum:()=>{S.sumId=null},
 openSum:v=>{S.sumId=v},
 manualSum:v=>{const s=sumFromForm(v);if(!s)return'keep';s.aiUsed=false;s.general=s.general||s.original;s.parts=s.parts&&s.parts.length?s.parts:s.tags.map(pid=>({pid,text:''}));s.unclear=[];s.stage='review';save()},
 aiSum:(v,b)=>{const s=sumFromForm(v);if(!s||!SAMPLE)return'keep';save();
  const act=activeP();b.disabled=true;$('#aiStat').textContent=_('ה־AI מארגן את הסיכום… זה יכול לקחת עד דקה.','The AI is organizing the summary… this can take up to a minute.');
  const prompt=`You help a counselor at an addiction treatment program turn a raw end-of-day note into an organized summary for the care team.
Strict rules:
- Keep every fact, its meaning and its severity. Do not soften or escalate anything.
- Keep the distinction between what was observed, what a patient said, and what the counselor assessed (e.g. "said that…", "seemed…").
- Do not add details, diagnoses, interpretations or conclusions that are not in the note. Do not drop material information.
- Improve wording and order only. Write in the SAME language as the note.
- If something is unclear (who is meant, a time, a word), do not guess: list it under "unclear".
- Put information about a specific patient in that patient's section. Use only these patients (id: name): ${act.map(p=>p.id+': '+p.name).join('; ')}.${s.tags.length?` The counselor marked these as mentioned: ${s.tags.join(', ')}.`:''}
- Everything about the day in general (schedule, group mood, logistics) goes in "general".
Reply with only JSON: {"general": string, "patients": [{"id": string, "text": string}], "unclear": [string]}

The note:
"""${s.original}"""`;
  SAMPLE.json(prompt,{modelTier:'default'}).then(r=>{
   const ids=new Set(act.map(p=>p.id));
   s.general=String(r&&r.general||'');s.parts=(Array.isArray(r&&r.patients)?r.patients:[]).filter(x=>x&&ids.has(String(x.id))).map(x=>({pid:String(x.id),text:String(x.text||'')}));
   s.unclear=(Array.isArray(r&&r.unclear)?r.unclear:[]).map(String).filter(Boolean);s.aiUsed=true;s.stage='review';save();render();
  }).catch(e=>{b.disabled=false;const el=$('#aiStat');if(el)el.textContent=sampleErr(e.code)});return'keep'},
 rmPart:v=>{const s=D.summaries.find(x=>x.id===S.sumId);readReview(s);s.parts.splice(+v,1);save()},
 draftSum:v=>{const s=D.summaries.find(x=>x.id===v);readReview(s);save();toast(_('הטיוטה נשמרה','Draft saved'))},
 backSum:v=>{const s=D.summaries.find(x=>x.id===v);readReview(s);s.stage='compose';save()},
 pubSum:v=>{const s=D.summaries.find(x=>x.id===v);readReview(s);
  if(s.unclear&&s.unclear.length&&!($('#chk')&&$('#chk').checked)){toast(_('סמנו שבדקתם את הנקודות שסומנו','Confirm you checked the flagged points'));return'keep'}
  if(!s.general.trim()&&!s.parts.some(p=>p.text.trim())){toast(_('הסיכום ריק','The summary is empty'));return'keep'}
  s.parts=s.parts.filter(p=>p.text.trim());s.status='published';s.stage='done';s.publishedAt=new Date().toISOString();save();toast(_('הסיכום פורסם וחלקי המטופלים נכנסו לתיקים','Published; patient sections were added to their files'))}
};
function sumFromForm(id){
 const o=val('so');if(!o){toast(_('כתבו קודם את הסיכום','Write the summary first'));return null}
 let s=id&&D.summaries.find(x=>x.id===id);
 if(!s){s={id:uid(),author:me(),status:'draft',source:'text',parts:[],general:'',unclear:[]};D.summaries.push(s)}
 s.date=val('sd')||TD;s.original=o;s.lang=isHe(o)?'he':'en';s.tags=[...document.querySelectorAll('.stg:checked')].map(i=>i.value);S.sumId=s.id;
 return s;
}
function readReview(s){
 if(!$('#sg'))return;s.general=$('#sg').value;document.querySelectorAll('.ppart textarea').forEach((t,i)=>{if(s.parts[i])s.parts[i].text=t.value});
 const ap=val('addPid');if(ap&&!s.parts.some(p=>p.pid===ap))s.parts.push({pid:ap,text:''});
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||!b.isConnected)return;const f=A[b.dataset.a];if(!f)return;e.preventDefault();const r=f(b.dataset.v,b);if(r!=='keep')render()});
document.addEventListener('change',e=>{const t=e.target;const c=t.dataset&&t.dataset.c;
 if(c==='role'){if(SH.on)S.viewAs=t.value==='manager'?null:t.value;else S.role=t.value;S.mine=null;S.pid=null;S.sumId=null;render()}else if(c==='mine'){S.mine=t.checked;render()}
 else if(t.dataset&&t.dataset.calc){S.calc[t.dataset.calc]=+t.value;const id=t.id;render();const el=document.getElementById(id);if(el)el.focus()}
 else if(t.dataset&&t.dataset.roster&&S.role==='manager'){const[d,k]=t.dataset.roster.split('|');D.roster[d]=D.roster[d]||{};delete D.roster[d].demo;D.roster[d][k]=t.value;save();render();toast(_('השיבוץ נשמר','Roster saved'))}
 else if(t.id==='addPid'&&t.value){const s=D.summaries.find(x=>x.id===S.sumId);readReview(s);save();render()}});
document.addEventListener('submit',e=>{if(e.target.id==='lgForm'){e.preventDefault();submitLogin()}});
document.addEventListener('focusout',()=>flushRemote());
// importing the data file exported from the previous version
document.addEventListener('change',async e=>{if(e.target.id!=='impFile'||!e.target.files[0])return;const st=$('#impStat');try{const j=JSON.parse(await e.target.files[0].text());const docs=j.docs||j;st.textContent=_('מייבא…','Importing…');
 const n=await window.RETORNO_SUPA.importDocs(docs,(a,b)=>{st.textContent=`${_('מייבא','Importing')} ${a}/${b}`});st.textContent=`${n} ${_('רשומות יובאו. טוען מחדש…','records imported. Reloading…')}`;setTimeout(()=>location.reload(),1200)}catch(x){st.textContent=_('הקובץ לא תקין או שהייבוא נכשל: ','The file is not valid or the import failed: ')+(x.message||x)}});
// links from notifications open the right screen
function viewFromHash(){const h=(location.hash||'').slice(1);if(VIEWS[h]&&D&&SH.ready&&P().views.includes(h)){S.view=h;S.pid=null;render()}}
window.addEventListener('hashchange',viewFromHash);setTimeout(viewFromHash,1500);
document.addEventListener('change',e=>{const t=e.target;if(t.name==='mty'){const ids=defaultTo(t.value);document.querySelectorAll('.mto').forEach(c=>c.checked=ids.includes(c.value));const h=$('#mtyh');if(h)h.textContent=nm(MSGT[t.value].hint)}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-mset]');if(!b)return;const k=b.dataset.mset;document.querySelectorAll('.mto').forEach(c=>c.checked=k==='team'?true:k==='counselor'?c.dataset.role==='counselor':false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').hidden)closeModal()});
if(window.claude&&typeof window.claude.use==='function'){
 D=emptyD();$('#app').innerHTML=`<main class="content solo">${vLoading()}</main>`;
 startShared().then(ok=>{if(!ok&&!SH.on){load();render()}}).catch(()=>{if(!SH.on){load();render()}});
}else{load();render()}
if(window.claude&&typeof window.claude.use==='function'){window.claude.use('sample').then(s=>{if(s){SAMPLE=s;render()}}).catch(()=>{});window.claude.use('downloads').then(d=>{DL=d}).catch(()=>{})}
document.addEventListener('input',e=>{const t=e.target;if(t.type==='range'&&t.dataset.calc){S.calc[t.dataset.calc]=+t.value;render();const el=document.getElementById(t.id);if(el)el.focus()}});
})();
