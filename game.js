/* HELLWARD | Vanilla JS | GitHub Pages / file:// compatible.
   All game data is embedded locally; no dependencies, network requests or backend. */
(() => {
  'use strict';

  const FX_CONFIG = {
    encounter: {deathMs:180,bossDeathMs:300,introMs:1250,entryMs:260,entryPx:2,curtainMs:340,receiptMs:6500,titles:[['Guardião das cinzas','Soberano dos condenados'],['Predador do bosque','Terror das raízes profanadas'],['Oráculo das águas mortas','Rei da cripta afogada'],['Carrasco do ferro','Senhor da fortaleza maldita'],['Devorador das brasas','Soberano das fendas'],['Guardiã do eclipse','O último soberano']]},
    idle: {heroMs:2400,enemyMs:2600,minibossMs:2800,bossMs:2900,heroPx:1,enemyPx:2,minibossPx:1,bossPx:1,heroPhaseMs:700,phaseSpreadMs:1200},
    orb: {lowEnter:.30,lowExit:.33,criticalEnter:.15,criticalExit:.18,lowMs:1800,criticalMs:1200,pulseSteps:12,normalOpacity:.14,lowMin:.2,lowMax:.55,criticalMin:.3,criticalMax:.8,normalColor:'196 107 114',lowColor:'219 161 90',criticalColor:'250 92 88'},
    numbers: {durationMs:760, enemyLimit:8, heroLimit:5, normalRem:1.44, criticalRem:1.88, heroRem:1.38, jitterRem:.75, riseRem:2, pop:1.18},
    impact: {heroBackPx:3,heroForwardPx:10,heroMs:220,criticalHeroMs:250,enemyPx:3,criticalEnemyPx:5,enemyMs:180,criticalEnemyMs:240,contactMs:66,criticalContactMs:75,slashRem:4.5,criticalSlashRem:6,enemyAttackPx:8,heroHurtPx:5,enemyAttackMs:220,heroHurtMs:260,gapMs:110, criticalGapMs:700, holdMs:50, flashMs:80, finalFlashMs:160, finalMs:300, shakePx:3, shakeMs:140, sparkLimit:12, sparks:4, criticalSparks:7, finalSparks:12, sparkMs:300, sparkTravelRem:2.5},
    healthTrail: {
      enabled: true,
      delayMs: 500,
      durationMs: 420,
      easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)'
    }
  };

  const MONSTER_INK_BOUNDS = {"assets/monsters/condenado-errante.webp":[0.0599,0.02083,0.9401,0.97917],"assets/monsters/guerreiro-esqueletico.webp":[0.04297,0.02083,0.95573,0.97917],"assets/monsters/sentinela-caida.webp":[0.04688,0.02083,0.95182,0.97917],"assets/monsters/arqueiro-macabro.webp":[0.08203,0.02083,0.91536,0.97917],"assets/monsters/zumbi-errante.webp":[0.03776,0.02083,0.96094,0.97917],"assets/monsters/espadachim-corrompido.webp":[0.02051,0.04688,0.97852,0.97949],"assets/monsters/cavaleiro-decapitado.webp":[0.01097,0.01729,0.98903,0.98936],"assets/monsters/lobo-sombrio.webp":[0.0332,0.33008,0.96875,0.96875],"assets/monsters/ratazana-pestilenta.webp":[0.03516,0.49414,0.96875,0.96875],"assets/monsters/lobo-da-praga.webp":[0.02148,0.12109,0.97852,0.97852],"assets/monsters/entorpecido-de-musgo.webp":[0.02539,0.02051,0.97461,0.97852],"assets/monsters/goblin-selvagem.webp":[0.02148,0.02148,0.97656,0.97852],"assets/monsters/rei-das-ratazanas.webp":[0.02474,0.34245,0.97917,0.97917],"assets/monsters/hidra-profanada.webp":[0.01064,0.01822,0.98936,0.98178],"assets/monsters/espectro-da-cripta.webp":[0.02344,0.02083,0.97656,0.97917],"assets/monsters/alma-enregelada.webp":[0.02539,0.02148,0.97461,0.97852],"assets/monsters/lamento-submerso.webp":[0.02344,0.02083,0.97526,0.97917],"assets/monsters/afogado-sem-rosto.webp":[0.04297,0.02083,0.95573,0.97917],"assets/monsters/sacerdote-esquecido.webp":[0.07552,0.02083,0.92448,0.97917],"assets/monsters/bruxa-das-criptas.webp":[0.03809,0.02051,0.96191,0.97949],"assets/monsters/rei-lich.webp":[0.01122,0.01064,0.98878,0.98936],"assets/monsters/golem-ferrugem.webp":[0.02051,0.05273,0.97852,0.97949],"assets/monsters/carcereiro-runico.webp":[0.02441,0.02051,0.97559,0.97949],"assets/monsters/guardiao-de-basalto.webp":[0.03418,0.02051,0.96484,0.97949],"assets/monsters/orc-carniceiro.webp":[0.02539,0.02051,0.97461,0.97949],"assets/monsters/construto-enferrujado.webp":[0.02246,0.02051,0.97656,0.97949],"assets/monsters/ogro-do-ferro.webp":[0.02051,0.10742,0.97949,0.97949],"assets/monsters/cavaleiro-do-abismo.webp":[0.01064,0.0128,0.98936,0.9872],"assets/monsters/arauto-das-chamas.webp":[0.09375,0.02051,0.90527,0.97949],"assets/monsters/demonio-carmesim.webp":[0.02637,0.02051,0.97266,0.97949],"assets/monsters/flagelo-abissal.webp":[0.02148,0.02051,0.97852,0.97949],"assets/monsters/sucubo-das-cinzas.webp":[0.02344,0.02474,0.97526,0.97917],"assets/monsters/sombra-incandescente.webp":[0.02734,0.02051,0.97266,0.97949],"assets/monsters/devorador-morbido.webp":[0.02148,0.0791,0.97949,0.97949],"assets/monsters/dragao-das-fendas.webp":[0.01064,0.01584,0.98936,0.98416],"assets/monsters/lich-imortal.webp":[0.02441,0.02051,0.97461,0.97949],"assets/monsters/rei-das-sombras.webp":[0.02051,0.02637,0.97949,0.97949],"assets/monsters/devorador-de-estrelas.webp":[0.02344,0.02051,0.97656,0.97949],"assets/monsters/sacerdote-do-vazio.webp":[0.06445,0.02148,0.93457,0.97949],"assets/monsters/arauto-do-eclipse.webp":[0.03516,0.02148,0.96387,0.97949],"assets/monsters/medusa-do-eclipse.webp":[0.03223,0.02051,0.9668,0.97949],"assets/monsters/imperador-do-crepusculo.webp":[0.01065,0.00821,0.98935,0.99179]};

  const SAVE_VERSION = 3;
  // New campaign. V7 does not load old saves or old JSON backups.
  const RESET_MARKER = 'hellward_v7_fresh_start';
  const ENEMIES_PER_PHASE = 10;
  const PHASES_PER_ZONE = 10;
  const PROFILE_INDEX_KEY = 'hellward_profiles_v7';
  const SAVE_PREFIX = 'hellward_save_v7_';
  const MAX_NUMBER = 1e250;
  const MAX_LEVEL = 1500;
  const MAX_RANK = 800;
  const MAX_INVENTORY = 140;
  const MAX_OFFLINE_SECONDS = 12 * 60 * 60;
  const MAX_OFFLINE_KILLS = 30000;
  const RARE_DROP_LIMIT = 60;
  const SCRAP_DROP_CHANCE = .70;
  const POTION_DROP_CHANCE = .045;
  const SAVE_INTERVAL = 10000;
  const TABS = new Set(['upgrades', 'inventory', 'zones', 'ascension']);
  const SLOTS = ['weapon', 'helmet', 'armor', 'ring', 'necklace', 'relic'];
  const SLOT_NAMES = { weapon: 'Arma', helmet:'Capacete', armor: 'Armadura', ring: 'Anel', necklace:'Colar', relic: 'Relíquia' };
  const SLOT_SYMBOLS = { weapon: '⚔', helmet:'♙', armor: '♜', ring: '◉', necklace:'◇', relic: '✧' };
  const RARITIES = [
    {id:'sucata',label:'Sucata',multiplier:0.3},
    {id: 'comum', label: 'Comum', multiplier: 1},
    {id: 'incomum', label: 'Incomum', multiplier: 1.35},
    {id: 'raro', label: 'Raro', multiplier: 1.95},
    {id: 'epico', label: 'Épico', multiplier: 3},
    {id: 'lendario', label: 'Lendário', multiplier: 5}
  ];
  // 100 game-ready items embedded via item-catalog.js; avoids network requests on GitHub Pages.
  const ITEM_CATALOG = Array.isArray(window.HELLWARD_ITEMS) ? window.HELLWARD_ITEMS : [];
  const CATALOG_BY_ID = new Map(ITEM_CATALOG.map(x => [x.id,x]));
  const ITEM_ZONE_MAP = ['Campos de Cinza','Bosque Profanado','Criptas Afogadas','Fortaleza de Ferro','Fendas Infernais','Trono do Crepúsculo'];
  const CATALOG_SLOTS = {arma:'weapon',armadura:'armor',capacete:'helmet',anel:'ring',colar:'necklace','relíquia':'relic'};
  const CATALOG_RARITIES = {Sucata:'sucata',Comum:'comum',Incomum:'incomum',Raro:'raro','Épico':'epico',Lendário:'lendario'};
  const QUALITY_BASE = {comum:1,incomum:1.45,raro:2.1,epico:3,lendario:4.8};
  const QUALITY_STEP = {comum:.09,incomum:.13,raro:.2,epico:.25,lendario:.3};
  const QUALITY_WEIGHTS = [25,20,16,12,9,7,5,3,2,1];
  function qualityMultiplier(rarity,quality){return (QUALITY_BASE[rarity]||1)+(QUALITY_STEP[rarity]||0)*(quality-1);}
  function weightedPick(values,weights){let roll=Math.random()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<values.length;i++){roll-=weights[i];if(roll<0)return values[i];}return values[values.length-1];}
  function rollQuality(){return weightedPick([1,2,3,4,5,6,7,8,9,10],QUALITY_WEIGHTS);}
  const catalogZone = (def) => Math.max(0,ITEM_ZONE_MAP.indexOf(def.regiao));
  const ART = window.HELLWARD_ART;
  const DEFAULT_ITEM_ART = {weapon:'area-01-05-espada-enferrujada',helmet:'area-01-06-elmo-amassado',armor:'area-01-07-couraca-rachada',ring:'area-01-08-anel-de-cobre',necklace:'area-01-14-medalhao-do-cavaleiro-decapitado',relic:'area-02-16-olho-da-hidra'};
  const iconStyle = art => `background-image:url('${art.src}');background-size:${art.cols*100}% ${art.rows*100}%;background-position:${art.col*100/(art.cols-1)}% ${art.row*100/(art.rows-1)}%`;
  const iconMarkup = (art,classes='') => `<span class="painted-icon ${classes}" style="${iconStyle(art)}" aria-hidden="true"></span>`;
  const statusIcon = (key,classes='') => iconMarkup(ART.status[key],classes);
  function itemArt(item,emptySlot=null) {
    if(ART.items[item?.catalogId])return ART.items[item.catalogId];
    const named=ITEM_CATALOG.find(d=>d.nome.toLocaleLowerCase('pt-BR')===item?.name?.toLocaleLowerCase('pt-BR'));
    if(named)return ART.items[named.id];
    const slot=item?.slot || emptySlot;
    return ART.items[DEFAULT_ITEM_ART[slot]] || ART.status[item?.kind==='potion'?'recovery':'souls'];
  }
  function paintIcon(node,art) {
    const key=`${art.src}:${art.col}:${art.row}`;
    if(node.dataset.artKey===key)return;
    node.dataset.artKey=key;node.style.cssText=iconStyle(art);
  }
  const ZONES = [
    {name: 'Campos de Cinza', subtitle: 'Onde os primeiros condenados despertam.', names: ['Condenado Errante', 'Guerreiro Esquelético', 'Sentinela Caída', 'Arqueiro Macabro', 'Zumbi Errante'], miniboss:'Espadachim Corrompido', boss:'Cavaleiro Decapitado', level: 1, kills: 0, rune: 'I', art: 'skeleton'},
    {name: 'Bosque Profanado', subtitle: 'Raízes antigas escondem fome e maldição.', names: ['Lobo Sombrio', 'Ratazana Pestilenta', 'Lobo da Praga', 'Entorpecido de Musgo', 'Goblin Selvagem'], miniboss:'Rei das Ratazanas', boss:'Hidra Profanada', level: 5, kills: 20, rune: 'II', art: 'beast'},
    {name: 'Criptas Afogadas', subtitle: 'Os ecos dos esquecidos nunca se calam.', names: ['Espectro da Cripta', 'Alma Enregelada', 'Lamento Submerso', 'Afogado Sem Rosto', 'Sacerdote Esquecido'], miniboss:'Bruxa das Criptas', boss:'Rei Lich', level: 12, kills: 65, rune: 'III', art: 'wraith'},
    {name: 'Fortaleza de Ferro', subtitle: 'O aço morto ainda guarda seus segredos.', names: ['Golem Ferrugem', 'Carcereiro Rúnico', 'Guardião de Basalto', 'Orc Carniceiro', 'Construto Enferrujado'], miniboss:'Ogro do Ferro', boss:'Cavaleiro do Abismo', level: 23, kills: 150, rune: 'IV', art: 'golem'},
    {name: 'Fendas Infernais', subtitle: 'Onde os pactos são escritos em brasas.', names: ['Arauto das Chamas', 'Demônio Carmesim', 'Flagelo Abissal', 'Súcubo das Cinzas', 'Sombra Incandescente'], miniboss:'Devorador Mórbido', boss:'Dragão das Fendas', level: 38, kills: 300, rune: 'V', art: 'demon'},
    {name: 'Trono do Crepúsculo', subtitle: 'O fim de toda luz. O início de outra era.', names: ['Lich Imortal', 'Rei das Sombras', 'Devorador de Estrelas', 'Sacerdote do Vazio', 'Arauto do Eclipse'], miniboss:'Medusa do Eclipse', boss:'Imperador do Crepúsculo', level: 60, kills: 600, rune: 'VI', art: 'lich'}
  ];
  const ATTRIBUTES = [
    {id:'strength',name:'Força',effect:'+2 de dano por clique'},
    {id:'will',name:'Vontade',effect:'+1 de dano por segundo'},
    {id:'vitality',name:'Vitalidade',effect:'+15 de vida máxima'},
    {id:'guard',name:'Resistência',effect:'+1 de defesa'}
  ];
  const attributeBudget = s => Math.max(0, (s.level - 1) * 2);
  const attributePoints = s => Math.max(0, attributeBudget(s) - ATTRIBUTES.reduce((sum,a) => sum + (s.attributes?.[a.id] || 0), 0));
  const UPGRADES = [
    {id: 'strike', icon: '⚔', title: 'Lâmina Afiada', desc: 'Reforce os golpes para causar mais dano a cada clique.', base: 12, growth: 1.16, effect: '+2,4 dano por nível'},
    {id: 'ritual', icon: '✥', title: 'Ritual Arcano', desc: 'Invoca energia ancestral que fere inimigos automaticamente.', base: 22, growth: 1.175, effect: '+1,8 DPS por nível'},
    {id: 'banner', icon: '✦', title: 'Estandarte Dourado', desc: 'Cada vitória rende mais ouro às suas reservas.', base: 75, growth: 1.20, effect: '+7% de ouro por nível'},
    {id: 'focus', icon: '✧', title: 'Olhar do Predador', desc: 'Aprimora a precisão dos seus ataques críticos.', base: 110, growth: 1.23, effect: '+0,7% de crítico por nível'},
    {id: 'vitality', icon: '♥', title: 'Vigor do Errante', desc: 'Aumenta a vida máxima do herói.', base: 24, growth: 1.16, effect: '+35 pontos de vida por nível'},
    {id: 'guard', icon: '⛨', title: 'Postura Defensiva', desc: 'Reduz o dano sofrido de criaturas e chefões.', base: 35, growth: 1.19, effect: '+2,5 de defesa por nível'},
    {id: 'recovery', icon: '✚', title: 'Sangue Renovado', desc: 'Fortalece a recuperação natural. A presença de elites limita a cura passiva; poções mantêm sua força.', base: 55, growth: 1.21, effect: '+0,65 de regeneração natural/s por nível'}
  ];
  const SKILL_PATHS = [
    {id: 'warrior', name: 'Caminho do Guerreiro', subtitle: 'FORÇA • PRECISÃO • PODER', icon: '⚔'},
    {id: 'sage', name: 'Caminho do Sábio', subtitle: 'RITUAL • OURO • TEMPO', icon: '✥'},
    {id: 'raider', name: 'Caminho do Saqueador', subtitle: 'SORTE • TESOURO • ALMAS', icon: '✧'}
  ];
  const SKILLS = [
    {id: 'w1', path:'warrior', icon:'⚔', name:'Golpe Ancestral', desc:'+20% dano de clique/nível', max:10, cost:1, growth:1.7},
    {id: 'w2', path:'warrior', icon:'✣', name:'Sangue Frio', desc:'+2% chance crítica/nível', max:8, cost:2, growth:1.8, req:'w1', reqRank:1},
    {id: 'w3', path:'warrior', icon:'✦', name:'Fio do Destino', desc:'+22% dano crítico/nível', max:8, cost:3, growth:1.8, req:'w2', reqRank:2},
    {id: 'w4', path:'warrior', icon:'♜', name:'Caçador de Tesouros', desc:'+35% dano em eventos/nível', max:5, cost:6, growth:2, req:'w3', reqRank:2},
    {id: 's1', path:'sage', icon:'☽', name:'Ecos Arcanos', desc:'+25% de DPS/nível', max:10, cost:1, growth:1.7},
    {id: 's2', path:'sage', icon:'◈', name:'Tempo Retido', desc:'+12% de ganho offline/nível', max:8, cost:2, growth:1.8, req:'s1', reqRank:1},
    {id: 's3', path:'sage', icon:'✥', name:'Alquimia Solar', desc:'+10% de ouro/nível', max:8, cost:3, growth:1.85, req:'s2', reqRank:2},
    {id: 's4', path:'sage', icon:'✶', name:'Tempestade Etérea', desc:'+30% de DPS/nível', max:6, cost:6, growth:2, req:'s3', reqRank:2},
    {id: 'r1', path:'raider', icon:'◇', name:'Mãos Afortunadas', desc:'+6% de sorte/nível', max:10, cost:1, growth:1.7},
    {id: 'r2', path:'raider', icon:'✧', name:'Olhar do Abismo', desc:'Melhora raridades de itens', max:8, cost:2, growth:1.8, req:'r1', reqRank:1},
    {id: 'r3', path:'raider', icon:'♢', name:'Ímã de Relíquias', desc:'Eventos +frequentes e +3s', max:6, cost:3, growth:1.9, req:'r2', reqRank:2},
    {id: 'r4', path:'raider', icon:'◆', name:'Legado Eterno', desc:'+12% almas no renascer/nível', max:6, cost:6, growth:2, req:'r3', reqRank:2}
  ];
  const EQUIPMENT_WORDS = {
    weapon: ['Espada', 'Machado', 'Lâmina', 'Adaga', 'Gadanha'],
    armor: ['Armadura', 'Couraça', 'Manto', 'Peitoral', 'Veste'],
    ring: ['Anel', 'Sinete', 'Selo', 'Aliança', 'Aro'],
    relic: ['Amuleto', 'Talismã', 'Ídolo', 'Relicário', 'Orbe']
  };
  const PREFIXES = {comum:['Gasto','Rústico','Esquecido'], incomum:['Temperado','Velado','Vigilante'], raro:['Rúnico','Sombrio','Venerável'], epico:['Espectral','Imperial','Profanado'], lendario:['Eterno','do Ocaso','da Última Aurora']};

  // 42 unique transparent sprites, indexed exactly like the fixed combat roster.
  // V7 starts fresh with combat survival and a new save schema.
  const MONSTER_SPRITES = [
    ['condenado-errante.webp', 'guerreiro-esqueletico.webp', 'sentinela-caida.webp', 'arqueiro-macabro.webp', 'zumbi-errante.webp', 'espadachim-corrompido.webp', 'cavaleiro-decapitado.webp'],
    ['lobo-sombrio.webp', 'ratazana-pestilenta.webp', 'lobo-da-praga.webp', 'entorpecido-de-musgo.webp', 'goblin-selvagem.webp', 'rei-das-ratazanas.webp', 'hidra-profanada.webp'],
    ['espectro-da-cripta.webp', 'alma-enregelada.webp', 'lamento-submerso.webp', 'afogado-sem-rosto.webp', 'sacerdote-esquecido.webp', 'bruxa-das-criptas.webp', 'rei-lich.webp'],
    ['golem-ferrugem.webp', 'carcereiro-runico.webp', 'guardiao-de-basalto.webp', 'orc-carniceiro.webp', 'construto-enferrujado.webp', 'ogro-do-ferro.webp', 'cavaleiro-do-abismo.webp'],
    ['arauto-das-chamas.webp', 'demonio-carmesim.webp', 'flagelo-abissal.webp', 'sucubo-das-cinzas.webp', 'sombra-incandescente.webp', 'devorador-morbido.webp', 'dragao-das-fendas.webp'],
    ['lich-imortal.webp', 'rei-das-sombras.webp', 'devorador-de-estrelas.webp', 'sacerdote-do-vazio.webp', 'arauto-do-eclipse.webp', 'medusa-do-eclipse.webp', 'imperador-do-crepusculo.webp'],
  ];

  const monsterSrc = (zoneIndex, creatureIndex) =>
    ART.monsters[zoneIndex][creatureIndex].src || `assets/monsters/${MONSTER_SPRITES[zoneIndex][creatureIndex]}?v=8-boss`;

  // Shape-specific movement: skeletons, beasts, spirits, constructs, and cosmic beings move differently.
  const MONSTER_FAMILIES = [
    ['humanoid', 'humanoid', 'humanoid', 'humanoid', 'humanoid', 'humanoid', 'humanoid'], 
    ['quad', 'quad', 'quad', 'humanoid', 'humanoid', 'abomination', 'colossus'], 
    ['wraith', 'wraith', 'wraith', 'drowned', 'wraith', 'wraith', 'humanoid'], 
    ['colossus', 'humanoid', 'colossus', 'humanoid', 'colossus', 'colossus', 'humanoid'], 
    ['humanoid', 'humanoid', 'arthropod', 'humanoid', 'wraith', 'abomination', 'colossus'], 
    ['humanoid', 'humanoid', 'cosmic', 'wraith', 'cosmic', 'wraith', 'cosmic'], 
  ];

  const EVENT_ART = {
    goblin: 'assets/events/treasure-goblin.webp',
    chest: 'assets/events/cursed-chest.webp'
  };

  const $ = (id) => document.getElementById(id);
  // DOM writes are applied only when the displayed value actually changes.
  const text = (id,value) => {const el=$(id),v=String(value);if(el.textContent!==v)el.textContent=v;};
  const prop = (id,key,value) => {const el=$(id);if(el[key]!==value)el[key]=value;};
  const attr = (id,key,value) => {const el=$(id),v=String(value);if(el.getAttribute(key)!==v)el.setAttribute(key,v);};
  const fill = (id,percent,axis='X') => {const el=$(id),v=`scale${axis}(${Math.max(0,Math.min(100,percent))/100})`;if(el.style.transform!==v)el.style.transform=v;};
  const deadForPotion=(s,b)=>`${Boolean(s.deadUntil)}:${Math.ceil(b.maxHp-s.heroHp)}`;
  const now = () => Date.now();
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const number = (v, fallback = 0, min = 0, max = MAX_NUMBER) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  const integer = (v, fallback = 0, min = 0, max = MAX_NUMBER) => Math.floor(number(v, fallback, min, max));
  const add = (a, b) => Math.min(MAX_NUMBER, Math.max(0, a) + Math.max(0, b));
  const multiply = (a, b) => (a <= 0 || b <= 0) ? 0 : (a >= MAX_NUMBER / b ? MAX_NUMBER : a * b);
  const power = (b, e) => {
    if (b <= 0) return 0;
    const exponent = Math.log(b) * e;
    return exponent >= Math.log(MAX_NUMBER) ? MAX_NUMBER : Math.min(MAX_NUMBER, Math.exp(exponent));
  };
  const safeName = (v, max = 42) => String(v == null ? '' : v).replace(/[\x00-\x1f<>]/g, '').trim().slice(0, max);
  const esc = (v) => String(v).replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmt = (v, decimals = 0) => {
    const n = number(v);
    if (n < 1000) return n.toLocaleString('pt-BR', {maximumFractionDigits: decimals});
    const units = ['','k','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
    const group = Math.floor(Math.log10(n) / 3);
    if (group >= units.length) return n.toExponential(2).replace('e+', 'e');
    const scaled = n / (10 ** (group * 3));
    return `${scaled.toLocaleString('pt-BR',{maximumFractionDigits:scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2})}${units[group]}`;
  };
  const fmtPercent = (n) => `${(number(n) * 100).toLocaleString('pt-BR',{maximumFractionDigits:1})}%`;
  const uid = () => (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2,12)}`;
  const xpNeeded = (lv) => Math.floor(Math.min(MAX_NUMBER, 24 * power(1.21, Math.max(0, lv-1)) + lv * 7));
  const slotStats = () => ({click:0, dps:0, crit:0, gold:0, luck:0, health:0, defense:0});
  const emptyRanks = (table) => Object.fromEntries(table.map(x => [x.id, 0]));
  const timeLabel = () => new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
  const randEventDelay = () => rand(39000, 75000);
  const validZone = (z) => Math.min(ZONES.length-1, integer(z, 0, 0, ZONES.length-1));
  const heroEquipmentStats = (s) => {
    const total=slotStats();
    for(const slot of SLOTS){
      const item=s.inventory.find(x=>x.id===s.equipment[slot] && x.slot===slot && x.kind==='equipment');
      if(item)for(const key of Object.keys(total))total[key]+=number(item.stats?.[key]);
    }
    return total;
  };
  const heroMaxHp = (s) => Math.max(30,Math.floor(110+(s.level-1)*13+s.upgrades.vitality*35+(s.attributes?.vitality||0)*15+heroEquipmentStats(s).health));
  const freshProgress = () => ({stage:1,kills:0,minibossDefeated:false,bossDefeated:false,cleared:false});
  const progressAt = (s) => s.zoneProgress[s.zone];
  const combatStage = (s) => s.farmStage ?? progressAt(s).stage;
  // Bosses remain mandatory: no amount of farming, XP or offline DPS skips them.
  const unlockedZone = (s,z) => z === 0 || s.zoneProgress[z-1].cleared;
  const requiredBossKind = (progress) => progress.cleared ? null :
    (progress.stage === 5 && progress.kills >= ENEMIES_PER_PHASE && !progress.minibossDefeated ? 'miniboss' :
    (progress.stage === PHASES_PER_ZONE && progress.kills >= ENEMIES_PER_PHASE && !progress.bossDefeated ? 'boss' : null));
  const phaseMultiplier = (s) => power(1.36,combatStage(s)-1);
  const rewardGold = (s) => Math.max(1,Math.floor(multiply(12 * power(2.35,s.zone),multiply(phaseMultiplier(s),1+Math.min(10000,s.zoneKills[s.zone])*.0075))));
  const rewardXp = (s) => Math.max(1,Math.floor(multiply(9 * power(1.95,s.zone),multiply(phaseMultiplier(s),1+Math.min(10000,s.zoneKills[s.zone])*.005))));
  const maxMobHp = (s,kind='normal') => {
    const base=multiply(28*power(2.9,s.zone),phaseMultiplier(s));
    return Math.max(1,Math.floor(multiply(base,kind==='boss'?18:kind==='miniboss'?9:1)));
  };
  // Real-time attacks use absolute timestamps. Background/offline combat stays safe.
  const enemyAttackInterval = (mob) => mob.kind==='boss' ? 2000 : mob.kind==='miniboss' ? 2200 : 2400;
  const enemyBaseDamage = (s) => {
    const kind=s.mob.kind;
    const elite=kind==='boss'||kind==='miniboss';
    const base=5.4 * power(elite?1.64:1.46,s.zone) * power(1.135,combatStage(s)-1);
    return Math.max(1,Math.round(multiply(base,kind==='boss'?3.2:kind==='miniboss'?2.05:1)));
  };
  const enemyHitDamage = (s,defense) => {
    const kind=s.mob.kind,armorScale=kind==='boss'?60+s.zone*30:kind==='miniboss'?40+s.zone*20:25;
    // Defense remains useful, but cannot erase an elite's attack indefinitely.
    const minimum=kind==='boss'?.25:kind==='miniboss'?.15:0;
    return Math.max(1,Math.round(enemyBaseDamage(s)*Math.max(minimum,armorScale/(armorScale+Math.max(0,defense)))));
  };
  const combatRegeneration = (s,natural) => {
    if(s.mob.kind!=='boss' && s.mob.kind!=='miniboss')return natural;
    // Elite pressure has a fixed regional budget, independent of the player's gear.
    // Soft saturation keeps each recovery upgrade useful without passive immortality.
    const budget=enemyBaseDamage(s)*.075/(enemyAttackInterval(s.mob)/1000);
    return natural/(1+natural/budget);
  };
  const freshMob = (s,previousName='') => {
    const zone=ZONES[s.zone],progress=progressAt(s);
    const kind=s.farmStage!=null?'normal':requiredBossKind(progress)||'normal';
    const names=zone.names.filter(name=>name!==previousName);
    const maxHp=maxMobHp(s,kind);
    const name=kind==='boss'?zone.boss:kind==='miniboss'?zone.miniboss:pick(names.length?names:zone.names);
    return {name,kind,hp:maxHp,maxHp,level:1+s.zone*12+(combatStage(s)-1)*2+(kind==='normal'?0:kind==='boss'?4:2)};
  };
  const newState = (name) => {
    const s = {version:SAVE_VERSION,name:safeName(name,18) || 'Errante',heroHp:110,deadUntil:0,nextEnemyAttackAt:0,createdAt:now(),lastSeen:now(),level:1,xp:0,gold:0,souls:0,shards:0,zone:0,zoneKills:Array(ZONES.length).fill(0),zoneProgress:ZONES.map(freshProgress),attributes:emptyRanks(ATTRIBUTES),upgrades:emptyRanks(UPGRADES),skills:emptyRanks(SKILLS),inventory:[],equipment:Object.fromEntries(SLOTS.map(x=>[x,null])),mob:null,event:null,nextEventAt:now()+randEventDelay(),lastEventAt:0,runKills:0,runGold:0,lifetimeKills:0,rebirths:0,potionBuffUntil:0,potionBonus:0};
    s.mob = freshMob(s);
    s.farmStage=null;s.farmKills=0;s.lootDryStreak=ZONES.map(()=>0);
    s.nextEnemyAttackAt = now()+enemyAttackInterval(s.mob);
    return s;
  };
  function normalizeItem(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const kind=['equipment','material','potion'].includes(item.kind)?item.kind:'equipment';
    const catalogId=String(item.catalogId||'').replace(/[^a-z0-9-]/g,'').slice(0,95);
    const def=CATALOG_BY_ID.get(catalogId);
    if (kind==='equipment' && !SLOTS.includes(item.slot)) return null;
    if (kind!=='equipment' && !def) return null;
    if (!RARITIES.some(r=>r.id===item.rarity)) return null;
    const stats=slotStats();
    for (const key of Object.keys(stats)) stats[key]=number(item.stats?.[key],0,0,1e8);
    return {id:String(item.id??'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,100)||uid(),kind,
      catalogId:def?.id||'',slot:kind==='equipment'?item.slot:null,rarity:item.rarity,quality:kind==='equipment' && Number.isInteger(item.quality) && item.quality>=1 && item.quality<=10 ? item.quality : null,
      name:safeName(item.name,75)||def?.nome||'Item desconhecido',
      level:integer(item.level,1,1,MAX_LEVEL),qty:integer(item.qty,1,1,99999),stats,
      createdAt:integer(item.createdAt,now(),0,now()+100000)};
  }
  function normalizeSave(raw, fallbackName) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== SAVE_VERSION) throw Error('Versão de save incompatível.');
    const s = newState(fallbackName);
    s.name = safeName(raw.name,18) || safeName(fallbackName,18) || 'Errante';
    s.createdAt = integer(raw.createdAt,now(),0,now());
    s.lastSeen = integer(raw.lastSeen,now(),0,now());
    s.level = integer(raw.level,1,1,MAX_LEVEL);
    // Existing V7 saves gain the same two points per attained level. Bound imported
    // allocations to the earned budget, without trusting an imported points counter.
    let remainingAttributes = attributeBudget(s);
    for (const a of ATTRIBUTES) {
      s.attributes[a.id] = integer(raw.attributes?.[a.id],0,0,remainingAttributes);
      remainingAttributes -= s.attributes[a.id];
    }
    s.xp = number(raw.xp,0);
    s.gold = number(raw.gold);
    s.souls = integer(raw.souls);
    s.shards = integer(raw.shards,0,0,9);
    s.runKills = integer(raw.runKills,0,0,1e10);
    s.runGold = number(raw.runGold);
    s.lifetimeKills = integer(raw.lifetimeKills,0,0,1e12);
    s.rebirths = integer(raw.rebirths,0,0,1e8);
    s.heroHp=number(raw.heroHp,110,0,1e12);
    s.deadUntil=integer(raw.deadUntil,0,0,now()+8000);
    s.nextEnemyAttackAt=now()+2400;
    for (const x of UPGRADES) s.upgrades[x.id] = integer(raw.upgrades?.[x.id],0,0,MAX_RANK);
    for (const x of SKILLS) s.skills[x.id] = integer(raw.skills?.[x.id],0,0,x.max);
    if (Array.isArray(raw.zoneKills)) s.zoneKills = ZONES.map((_,i)=>integer(raw.zoneKills[i],0,0,1e10));
    if (Array.isArray(raw.zoneProgress) && raw.version === SAVE_VERSION) {
      s.zoneProgress=ZONES.map((_,i)=>{
        const r=raw.zoneProgress[i] || {};
        const p=freshProgress();
        p.stage=integer(r.stage,1,1,PHASES_PER_ZONE);
        p.kills=integer(r.kills,0,0,ENEMIES_PER_PHASE);
        p.minibossDefeated=Boolean(r.minibossDefeated);
        p.bossDefeated=Boolean(r.bossDefeated);
        p.cleared=Boolean(r.cleared);
        // Reject inconsistent stage/boss flags from malformed backups.
        if(p.stage>5)p.minibossDefeated=true;
        if(p.bossDefeated && p.stage===PHASES_PER_ZONE)p.cleared=true;
        if(p.cleared){p.stage=PHASES_PER_ZONE;p.kills=ENEMIES_PER_PHASE;p.minibossDefeated=true;p.bossDefeated=true;}
        else {
          p.bossDefeated=false;
          if(p.stage<5)p.minibossDefeated=false;
          if(p.stage===5 && p.minibossDefeated){p.stage=6;p.kills=0;}
          if(p.stage<PHASES_PER_ZONE && p.kills===ENEMIES_PER_PHASE && p.stage!==5){p.stage++;p.kills=0;}
        }
        return p;
      });
      // A zone can only be reached after finishing the preceding zone.
      for(let i=1;i<ZONES.length;i++)if(!s.zoneProgress[i-1].cleared)s.zoneProgress[i]=freshProgress();
    }else{
      // v1 migration: previously unlocked regions stay available; progress is
      // converted to phases, with the new boss checkpoints still required.
      let legacyReached=0;
      for(let i=1;i<ZONES.length;i++)if(s.level>=ZONES[i].level && s.runKills>=ZONES[i].kills)legacyReached=i;
      legacyReached=Math.max(legacyReached,validZone(raw.zone));
      for(let i=0;i<legacyReached;i++){
        s.zoneProgress[i]={stage:10,kills:10,minibossDefeated:true,bossDefeated:true,cleared:true};
      }
      const current=s.zoneProgress[legacyReached];
      const historicalKills=s.zoneKills[legacyReached];
      if(historicalKills>=40){
        current.stage=5;current.kills=10;current.minibossDefeated=false;
      }else{
        current.stage=1+Math.floor(historicalKills/ENEMIES_PER_PHASE);
        current.kills=historicalKills%ENEMIES_PER_PHASE;
      }
    }
    s.zone=validZone(raw.zone);
    if(!unlockedZone(s,s.zone))s.zone=ZONES.reduce((z,_,i)=>unlockedZone(s,i)?i:z,0);
    s.farmStage=raw.farmStage==null?null:integer(raw.farmStage,0,0,progressAt(s).stage)||null;
    s.farmKills=integer(raw.farmKills,0,0,9);
    s.lootDryStreak=ZONES.map((_,i)=>integer(raw.lootDryStreak?.[i],0,0,RARE_DROP_LIMIT-1));
    const seen = new Set();
    if (Array.isArray(raw.inventory)) for (const entry of raw.inventory.slice(0,MAX_INVENTORY)) {
      const item = normalizeItem(entry);
      if (item && !seen.has(item.id)) {s.inventory.push(item);seen.add(item.id);}
    }
    for (const slot of SLOTS) {
      const id = safeName(raw.equipment?.[slot],90);
      s.equipment[slot] = s.inventory.some(i=>i.id===id && i.slot===slot) ? id : null;
    }
    s.mob = freshMob(s);
    if(raw.mob && typeof raw.mob==='object' && raw.version===SAVE_VERSION){
      const kind=s.farmStage!=null?'normal':requiredBossKind(progressAt(s))||'normal';
      const expectedMax=maxMobHp(s,kind);
      // Rebuild identity and maximum health from trusted area/phase definitions.
      const name=kind==='boss'?ZONES[s.zone].boss:kind==='miniboss'?ZONES[s.zone].miniboss:
        (ZONES[s.zone].names.includes(raw.mob.name)?raw.mob.name:s.mob.name);
      s.mob={name,kind,hp:number(raw.mob.hp,expectedMax,0,expectedMax)||expectedMax,maxHp:expectedMax,level:s.mob.level};
    }
    // Apply trusted max health after rebuilding inventory and equipped stats.
    s.heroHp=Math.min(s.heroHp,heroMaxHp(s));
    if (s.heroHp<=0 && !s.deadUntil) s.deadUntil=now()+8000;
    s.nextEnemyAttackAt=now()+enemyAttackInterval(s.mob);
    s.lastEventAt = integer(raw.lastEventAt,0,0,now());
    s.nextEventAt = integer(raw.nextEventAt,now()+randEventDelay(),0,now()+120000);
    if (raw.event && ['goblin','chest'].includes(raw.event.type) && number(raw.event.expiresAt)>now()) {
      const hp = number(raw.event.hp,1,1,MAX_NUMBER);
      const maxHp = number(raw.event.maxHp,hp,hp,MAX_NUMBER);
      s.event = {type:raw.event.type,hp,maxHp,expiresAt:integer(raw.event.expiresAt,now(),0,now()+18000)};
    }
    return s;
  }
  class Game {
    constructor() {
      this.state = null;
      this.profileId = null;
      this.tab = 'upgrades';
      this.buyQuantity = 1;
      this.attributeQuantity = 1;
      this.huntSelection = null;
      this.inventoryFilter = 'all';
      this.inventorySort = 'new';
      this.sellRarity = 'low';
      this.lastFrameAt = 0;
      this.lastCoreRender = 0;
      this.lastPanelRender = 0;
      this.lastZoneRendered = -1;
      this.lastEventRendered = '';
      this.enemyHealthTrail = null;
      this.heroHealthTrail = null;
      this.combatNumbers = {enemy:new Map(),hero:new Map()};
      this.combatNumberSequence = {enemy:0,hero:0};
      this.numberPool={enemy:[],hero:[]};
      this.combatNumberAnchors = {};
      this.combatVisuals = new Map();
      this.configureAtmosphereFX();
      this.prepareIdle($('combatHero').querySelector('.actor-idle'),$('combatHero').querySelector('img'));
      this.vitalityState='normal';this.vitalityOwner=null;
      this.sparkCursor=0;
      this.sparkNodes=Array.from({length:FX_CONFIG.impact.sparkLimit},()=>{const n=document.createElement('i');n.className='combat-spark';n.setAttribute('aria-hidden','true');$('battlefield').append(n);return n;});
      document.addEventListener('hellward:screen-effects',()=>{this.clearCombatVisuals();this.cancelEncounterFX();if(this.state)this.renderCore();});
      this.lastCombatImpactAt = -Infinity;
      this.lastCriticalImpactAt = -Infinity;
      document.documentElement.toggleAttribute('data-combat-idle-paused',document.hidden);
      this.reducedCombatMotion = matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedCombatMotion.addEventListener('change',()=>{
        this.resetEnemyHealthTrail();
        this.resetHeroHealthTrail();
        this.clearCombatNumbers();
        this.clearCombatVisuals();
        this.cancelEncounterFX();
        if(this.state)this.renderCore();
      });
      this.setupEncounterFX();
      this.startedLoop = false;
      this.loopTimer = 0;
      this.arenaSize = {width:800,height:400};
      // Reuse one observer: cache anchors only when the arena/actors/event resize.
      // Floating numbers never measure layout on hits or animation frames.
      const combatResize=new ResizeObserver(()=>this.cacheCombatNumberAnchors());
      for(const id of ['battlefield','combatHero','attackTarget','eventOverlay'])combatResize.observe($(id));
      this.sessionStorage = new Map();
      this.storageAvailable = this.testStorage();
      this.resetLegacyProgress();
      this.bindEvents();
      document.querySelectorAll('[data-status-icon]').forEach(node=>paintIcon(node,ART.status[node.dataset.statusIcon]));
      this.showAuth();
      window.addEventListener('pagehide',()=>this.save());
      window.addEventListener('beforeunload',()=>this.save());
      document.addEventListener('visibilitychange',()=>{
        this.cancelEncounterFX();
        document.documentElement.toggleAttribute('data-combat-idle-paused',document.hidden);
        this.resetEnemyHealthTrail();
        this.resetHeroHealthTrail();
        this.clearCombatNumbers();
        this.clearCombatVisuals();
        if (this.state) {this.stepClock();this.save();if(document.hidden)this.stopLoop();else{this.renderCore();this.startLoop();}}
      });
      setInterval(()=>this.save(),SAVE_INTERVAL);
    }
    setupEncounterFX() {
      this.encounterAnimations=new Map();this.encounterHold=null;this.encounterSeenMob=null;this.encounterSeenState=null;
      this.encounterTimer=0;this.receiptTimer=0;this.pendingExpeditionReceipt=null;
      const node=(tag,cls)=>{const n=document.createElement(tag);n.className=cls;n.hidden=true;return n;};
      this.deathGhost=node('div','encounter-death');this.deathGhost.setAttribute('aria-hidden','true');
      this.deathGhost.innerHTML='<span class="mob-shadow"></span><img alt="" draggable="false">';
      $('battlefield').querySelector('[data-scene-layer=characters]').append(this.deathGhost);
      this.encounterIntro=node('div','encounter-intro');this.encounterIntro.setAttribute('role','status');this.encounterIntro.innerHTML='<small></small><strong></strong><span></span>';
      this.phaseVeil=node('div','phase-transition-veil');this.phaseVeil.setAttribute('aria-hidden','true');$('arenaCamera').append(this.phaseVeil);
      this.phaseCurtain=node('div','encounter-curtain');this.phaseCurtain.setAttribute('role','status');this.phaseCurtain.innerHTML='<small></small><strong></strong>';
      this.expeditionReceipt=node('section','expedition-receipt');this.expeditionReceipt.setAttribute('role','status');this.expeditionReceipt.innerHTML='<small></small><strong></strong><p></p><p></p><button type="button">CONTINUAR</button>';
      this.expeditionReceipt.querySelector('button').addEventListener('click',()=>this.closeExpeditionReceipt());
      this.expeditionReceipt.querySelector('button').addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter')e.stopPropagation();});
      $('battlefield').append(this.encounterIntro,this.phaseCurtain,this.expeditionReceipt);
      const pause=()=>{if($('appFrame').inert||document.documentElement.classList.contains('hw-lite')){const held=Boolean(this.encounterHold);this.cancelEncounterFX();if(held&&this.state)this.renderCore();}};
      new MutationObserver(pause).observe($('appFrame'),{attributes:true,attributeFilter:['inert']});
      new MutationObserver(pause).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    }
    encounterMotionEnabled() {
      return Boolean(this.encounterAnimations) && this.combatMotionEnabled() && $('hudBackdrop').hidden && $('dialogBackdrop').hidden && matchMedia('(min-width:1000px) and (min-height:600px)').matches;
    }
    stopEncounterAnimation(key) {
      const animation=this.encounterAnimations?.get(key);if(!animation)return;
      this.encounterAnimations.delete(key);animation.cancel();
    }
    animateEncounter(key,node,frames,duration,done=()=>{}) {
      this.stopEncounterAnimation(key);
      const animation=node.animate(frames,{duration,easing:key==='entry'?'steps(2,end)':'steps(12,end)',fill:'both'});
      this.encounterAnimations.set(key,animation);
      animation.finished.then(()=>{if(this.encounterAnimations.get(key)!==animation)return;this.encounterAnimations.delete(key);animation.cancel();done();},()=>{});
    }
    closeExpeditionReceipt() {
      if(!this.encounterAnimations)return;
      clearTimeout(this.receiptTimer);this.receiptTimer=0;
      if(this.expeditionReceipt&&!this.expeditionReceipt.hidden)this.expeditionReceipt.hidden=true;
      this.stopEncounterAnimation('receipt');
    }
    cancelEncounterFX(forget=false) {
      if(!this.encounterAnimations)return;
      clearTimeout(this.encounterTimer);this.encounterTimer=0;this.encounterHold=null;
      if(this.encounterAnimations)for(const key of [...this.encounterAnimations.keys()])this.stopEncounterAnimation(key);
      for(const node of [this.deathGhost,this.encounterIntro,this.phaseCurtain,this.phaseVeil])if(node)node.hidden=true;
      $('attackTarget').classList.remove('encounter-hidden');$('battlefield').classList.remove('encounter-hold');
      this.closeExpeditionReceipt();this.pendingExpeditionReceipt=null;
      if(forget){this.encounterSeenMob=null;this.encounterSeenState=null;}
    }
    beginEncounterDeath(defeated,from,visible) {
      if(this.encounterHold || !visible || !this.encounterMotionEnabled())return;
      const a=this.combatNumberAnchors.enemy,img=$('monsterArt').querySelector('img');
      if(!a?.width || !img?.naturalWidth)return;
      this.stopEncounterAnimation('entry');this.stopEncounterAnimation('intro');this.encounterIntro.hidden=true;
      this.stopEncounterAnimation('curtain');this.stopEncounterAnimation('veil');this.phaseCurtain.hidden=true;this.phaseVeil.hidden=true;
      const record={owner:this.state,targetMob:defeated,from};this.encounterHold=record;
      $('battlefield').classList.add('encounter-hold');text('mobLevel','DERROTADO');
      const duration=defeated.kind==='boss'?Math.max(FX_CONFIG.encounter.bossDeathMs,FX_CONFIG.impact.finalMs):FX_CONFIG.encounter.deathMs;
      if(defeated.kind!=='boss'){
        const ghost=this.deathGhost,{width,height}=this.arenaSize;
        ghost.querySelector('img').src=img.getAttribute('src');
        for(const [key,value]of Object.entries({left:a.x/width*100+'%',top:a.y/height*100+'%',width:a.width/width*100+'%',height:a.height/height*100+'%'}))ghost.style[key]=value;
        ghost.hidden=false;this.animateEncounter('death',ghost,[{opacity:1},{opacity:0}],duration);
      }
      // Only presentation is delayed. State/rewards and overflow damage stay synchronous.
      this.encounterTimer=setTimeout(()=>{
        if(this.encounterHold!==record)return;
        this.encounterTimer=0;this.encounterHold=null;this.deathGhost.hidden=true;this.stopEncounterAnimation('death');
        $('battlefield').classList.remove('encounter-hold');
        if(this.state!==record.owner || document.hidden){this.cancelEncounterFX();return;}
        this.renderCore();this.presentPhaseChange(record.from);this.presentExpeditionReceipt();
      },duration);
    }
    renderEncounterFX() {
      const s=this.state;if(!s)return;
      if(this.encounterSeenState!==s){this.encounterSeenState=s;this.encounterSeenMob=null;}
      if(this.encounterSeenMob===s.mob)return;
      this.stopEncounterAnimation('entry');this.stopEncounterAnimation('intro');this.encounterIntro.hidden=true;
      this.encounterSeenMob=s.mob;
      if(!['boss','miniboss','elite'].includes(s.mob.kind)||s.deadUntil||!this.encounterMotionEnabled())return;
      const c=FX_CONFIG.encounter,banner=this.encounterIntro;
      banner.querySelector('small').textContent=`${s.mob.kind==='boss'?'CHEFÃO':'ELITE'} · FASE ${combatStage(s)}/10`;
      banner.querySelector('strong').textContent=s.mob.name;
      banner.querySelector('span').textContent=c.titles[s.zone][s.mob.kind==='boss'?1:0];banner.hidden=false;
      this.animateEncounter('intro',banner,[{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.83},{opacity:0}],c.introMs,()=>{banner.hidden=true;});
      const idle=$('monsterArt').querySelector('.actor-idle');
      if(idle)this.animateEncounter('entry',idle,[{opacity:.4,transform:`translateX(${c.entryPx}px)`},{opacity:1,transform:'translateX(0)'}],c.entryMs);
    }
    presentPhaseChange(from) {
      const s=this.state;if(!s||!this.encounterMotionEnabled())return;
      if(from.zone===s.zone&&from.stage===combatStage(s)&&(from.cleared||!progressAt(s).cleared))return;
      this.phaseVeil.hidden=false;this.animateEncounter('veil',this.phaseVeil,[{opacity:0},{opacity:1,offset:.35},{opacity:0}],FX_CONFIG.encounter.curtainMs,()=>{this.phaseVeil.hidden=true;});
      if(this.pendingExpeditionReceipt||s.mob.kind!=='normal')return;
      const node=this.phaseCurtain;node.querySelector('small').textContent=ZONES[s.zone].name;node.querySelector('strong').textContent=`FASE ${combatStage(s)} / 10`;node.hidden=false;
      this.animateEncounter('curtain',node,[{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.65},{opacity:0}],FX_CONFIG.encounter.curtainMs,()=>{node.hidden=true;});
    }
    presentExpeditionReceipt() {
      const receipt=this.pendingExpeditionReceipt;this.pendingExpeditionReceipt=null;
      if(!this.encounterAnimations||!receipt||receipt.owner!==this.state||document.hidden||!$('authScreen').hidden)return;
      this.closeExpeditionReceipt();this.stopEncounterAnimation('intro');this.stopEncounterAnimation('curtain');this.encounterIntro.hidden=true;this.phaseCurtain.hidden=true;const node=this.expeditionReceipt;
      node.querySelector('small').textContent=receipt.final?'EXPEDIÇÃO CONCLUÍDA':'REGIÃO CONCLUÍDA';
      node.querySelector('strong').textContent=ZONES[receipt.zone].name;
      const rows=node.querySelectorAll('p');rows[0].textContent=`+${fmt(receipt.gold)} ouro · +${fmt(receipt.xp)} XP · ${receipt.trophy}`;
      rows[1].textContent=receipt.final?'As seis regiões foram conquistadas. Sua jornada continua.':`Próxima região: ${ZONES[this.state.zone].name} · FASE ${combatStage(this.state)}/10`;
      node.hidden=false;
      if(this.encounterMotionEnabled())this.animateEncounter('receipt',node,[{opacity:0},{opacity:1}],160);
      this.receiptTimer=setTimeout(()=>this.closeExpeditionReceipt(),FX_CONFIG.encounter.receiptMs);
    }
    configureAtmosphereFX() {
      const root=document.documentElement,i=FX_CONFIG.idle,o=FX_CONFIG.orb;
      const values={'hero-idle-ms':i.heroMs+'ms','enemy-idle-ms':i.enemyMs+'ms','miniboss-idle-ms':i.minibossMs+'ms','boss-idle-ms':i.bossMs+'ms','hero-idle-px':-i.heroPx+'px','enemy-idle-px':-i.enemyPx+'px','miniboss-idle-px':-i.minibossPx+'px','boss-idle-px':-i.bossPx+'px','hero-idle-steps':i.heroPx,'enemy-idle-steps':i.enemyPx,'miniboss-idle-steps':i.minibossPx,'boss-idle-steps':i.bossPx,'hero-idle-phase':-i.heroPhaseMs+'ms','orb-pulse-steps':o.pulseSteps,'orb-low-ms':o.lowMs+'ms','orb-critical-ms':o.criticalMs+'ms','orb-normal-opacity':o.normalOpacity,'orb-low-min':o.lowMin,'orb-low-max':o.lowMax,'orb-critical-min':o.criticalMin,'orb-critical-max':o.criticalMax,'orb-normal-color':o.normalColor,'orb-low-color':o.lowColor,'orb-critical-color':o.criticalColor};
      for(const [name,value]of Object.entries(values))root.style.setProperty('--'+name,String(value));
    }
    prepareIdle(idle,image) {
      if(idle.querySelector('.idle-top'))return;
      idle.style.setProperty('--idle-sprite',`url(${JSON.stringify(image.getAttribute('src'))})`);
      const top=document.createElement('span'),motion=document.createElement('span'),feet=document.createElement('span');
      top.className='idle-top';motion.className='idle-motion';feet.className='idle-feet';
      top.append(motion);idle.append(top,feet);
      const ready=()=>image.decode().then(()=>idle.classList.add('idle-ready')).catch(()=>{});
      if(image.complete&&image.naturalWidth)ready();else image.addEventListener('load',ready,{once:true});
    }
    renderVitalityMood(hp,maxHp) {
      const o=FX_CONFIG.orb,ratio=Math.max(0,Math.min(1,hp/Math.max(1,maxHp)));
      let mood=this.vitalityOwner===this.state?this.vitalityState:'normal';
      if(this.state.deadUntil)mood='dead';
      else if(mood==='critical'){
        if(ratio>=o.criticalExit)mood=ratio>=o.lowExit?'normal':'low';
      }else if(mood==='low'){
        if(ratio<=o.criticalEnter)mood='critical';else if(ratio>=o.lowExit)mood='normal';
      }else mood=ratio<=o.criticalEnter?'critical':ratio<=o.lowEnter?'low':'normal';
      this.vitalityOwner=this.state;this.vitalityState=mood;
      attr('errantVitals','data-vitality',mood);
      const warning=mood==='low'||mood==='critical';
      $('errantVitals').classList.toggle('low-health',warning);
      attr('quickPotion','data-life-cue',warning&&!$('quickPotion').disabled?mood:'none');
    }
    testStorage() {
      try {localStorage.setItem('cinzas_probe','1');localStorage.removeItem('cinzas_probe');return true;}
      catch (_) {return false;}
    }
    resetLegacyProgress() {
      if(!this.storageAvailable)return;
      try {
        if(localStorage.getItem(RESET_MARKER)==='1')return;
        // Only game-owned legacy keys; never erase unrelated localStorage keys.
        for(const key of Object.keys(localStorage)) {
          if(key==='cinzas_profiles_v1'||key.startsWith('cinzas_save_v1_')||key==='hellward_profiles_v6'||key.startsWith('hellward_save_v6_'))localStorage.removeItem(key);
        }
        localStorage.setItem(RESET_MARKER,'1');
      }catch(_) { /* private-browsing/session-storage fallback */ }
    }
    read(key) {
      if (!this.storageAvailable) return this.sessionStorage.get(key) || null;
      try {return localStorage.getItem(key);} catch (_) {this.storageAvailable=false;return this.sessionStorage.get(key)||null;}
    }
    write(key, value) {
      if (!this.storageAvailable) {this.sessionStorage.set(key,value);return false;}
      try {localStorage.setItem(key,value);return true;}
      catch (_) {this.storageAvailable=false;this.sessionStorage.set(key,value);this.toast('Armazenamento indisponível. Exporte seu save para não perder progresso.');return false;}
    }
    getProfiles() {
      try {
        const data=JSON.parse(this.read(PROFILE_INDEX_KEY)||'[]');
        if (!Array.isArray(data)) return [];
        return data.slice(0,35).filter(p=>p && typeof p.id==='string' && /^[a-zA-Z0-9_-]{1,90}$/.test(p.id))
          .map(p=>({id:p.id,name:safeName(p.name,18)||'Errante',lastPlayed:integer(p.lastPlayed,0,0,now())}));
      } catch (_) {return [];}
    }
    storeProfiles(profiles) {this.write(PROFILE_INDEX_KEY,JSON.stringify(profiles.slice(0,35)));}
    touchProfile() {
      if (!this.state || !this.profileId) return;
      const profiles=this.getProfiles();
      const profile=profiles.find(p=>p.id===this.profileId);
      if (profile) {profile.name=this.state.name;profile.lastPlayed=now();this.storeProfiles(profiles);}
    }
    showAuth() {
      this.cancelEncounterFX(true);
      this.stopLoop();
      this.resetEnemyHealthTrail();
      this.resetHeroHealthTrail();
      this.clearCombatNumbers();
      this.clearCombatVisuals();
      const profiles=this.getProfiles().sort((a,b)=>b.lastPlayed-a.lastPlayed);
      const list=$('profileList');
      list.replaceChildren();
      for (const profile of profiles) {
        const btn=document.createElement('button');btn.type='button';btn.className='saved-profile';
        const name=document.createElement('strong');name.textContent='♜  '+profile.name;
        const detail=document.createElement('small');detail.textContent='CONTINUAR  ❯';
        btn.append(name,detail);btn.addEventListener('click',()=>this.openProfile(profile));list.append(btn);
      }
      prop('savedProfiles','hidden',profiles.length===0);
      prop('authScreen','hidden',false);
      $('authScreen').dispatchEvent(new Event('menu-open'));
      document.dispatchEvent(new CustomEvent('hellward:scenechange',{detail:{scene:'menu'}}));
      $('newProfileName').value='';
    }
    createProfile(name, preloaded = null) {
      const clean=safeName(name,18);
      if (clean.length < 2) {this.toast('Escolha um nome com pelo menos 2 caracteres.');return;}
      const profiles=this.getProfiles();
      if (profiles.length>=35) {this.toast('Limite de 35 perfis locais atingido.');return;}
      const profile={id:uid().replace(/[^a-zA-Z0-9_-]/g,''),name:clean,lastPlayed:now()};
      const state=preloaded || newState(clean);
      state.name=clean;
      profiles.push(profile);this.storeProfiles(profiles);
      this.write(SAVE_PREFIX+profile.id,JSON.stringify(state));
      this.activate(profile,state);
    }
    openProfile(profile) {
      try {
        const data=this.read(SAVE_PREFIX+profile.id);
        if (!data) {this.toast('Save não encontrado. Uma nova jornada foi iniciada.');this.activate(profile,newState(profile.name));return;}
        const raw=JSON.parse(data);
        this.activate(profile,normalizeSave(raw,profile.name));
      } catch (error) {
        this.dialog('Save danificado','Não foi possível ler este perfil. O arquivo local não foi substituído. Importe um backup JSON ou crie um novo aventureiro.',[{text:'ENTENDI'}],'⚠');
      }
    }
    activate(profile,state) {
      this.cancelEncounterFX(true);
      this.resetEnemyHealthTrail();
      this.resetHeroHealthTrail();
      this.clearCombatNumbers();
      this.clearCombatVisuals();
      this.state=state;
      this.huntSelection=null;
      this.profileId=profile.id;
      this.lastZoneRendered=-1;
      this.lastEventRendered='';
      this.lastFrameAt=now();
      prop('authScreen','hidden',true);
      document.dispatchEvent(new CustomEvent('hellward:scenechange',{detail:{scene:'battle'}}));
      const seconds=Math.min(MAX_OFFLINE_SECONDS,Math.max(0,(now()-state.lastSeen)/1000));
      const offline=this.grantOffline(seconds);
      state.lastSeen=now();
      if (state.event && state.event.expiresAt <= now()) state.event=null;
      state.nextEventAt=now()+this.nextEventDelay();
      state.nextEnemyAttackAt=now()+enemyAttackInterval(state.mob);
      if(state.deadUntil && state.deadUntil<=now()) {state.deadUntil=0;state.heroHp=this.bonuses().maxHp;state.mob=freshMob(state);}
      this.touchProfile();
      this.renderEverything();
      this.addLog('Uma chama ressurge nas ruínas. A caçada continua.','✦','good');
      if (!this.storageAvailable) this.toast('Modo temporário: seu navegador bloqueou o armazenamento. Exporte backups JSON.');
      if (offline.kills>0) {
        this.addLog(`Seu ritual venceu ${fmt(offline.kills)} inimigos durante sua ausência.`, '☽', 'good');
        this.dialog('As cinzas guardaram sua jornada',`${state.name}, seus rituais continuaram a colher poder enquanto você esteve ausente.`,[{text:'RETOMAR A CAÇADA',primary:true}],'☽',{kind:'offline',duration:this.formatDuration(seconds),kills:offline.kills,gold:offline.gold,xp:offline.xp});
      }
      this.save();
      this.startLoop();
    }
    bindEvents() {
      $('createProfileForm').addEventListener('submit',(e)=>{e.preventDefault();this.createProfile($('newProfileName').value);});
      $('switchProfile').addEventListener('click',()=>{if(this.state){this.save();this.state=null;this.profileId=null;this.showAuth();}});
      $('attackTarget').addEventListener('click',()=>this.attack());
      $('quickPotion').addEventListener('click',()=>this.useQuickPotion());
      $('eventTarget').addEventListener('click',(e)=>{e.stopPropagation();this.attackEvent();});
      document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>this.changeTab(btn.dataset.tab)));
      $('tabBody').addEventListener('click',(e)=>this.onPanelClick(e));
      $('tabBody').addEventListener('change',(e)=>{
        if(e.target.id==='farmStageSelect')this.huntSelection=Number(e.target.value);
        if(e.target.id==='inventoryFilter'){this.inventoryFilter=e.target.value;this.renderPanel();}
        if(e.target.id==='inventorySort'){this.inventorySort=e.target.value;this.renderPanel();}
        if(e.target.id==='inventorySellRarity'){this.sellRarity=e.target.value;this.renderPanel();}
      });
      $('exportSave').addEventListener('click',()=>this.exportSave());
      $('importSave').addEventListener('click',()=>this.pickImport());
      $('importFromAuth').addEventListener('click',()=>this.pickImport());
      $('saveFileInput').addEventListener('change',(e)=>{const file=e.target.files?.[0];if(file)this.importSave(file);e.target.value='';});
      document.addEventListener('keydown',(e)=>{
        if (!this.state || !$('dialogBackdrop').hidden || !$('authScreen').hidden) return;
        const interactive=['INPUT','BUTTON','SELECT','TEXTAREA'].includes(document.activeElement?.tagName);
        if(e.code==='KeyQ' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && !['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName) && $('hudBackdrop').hidden){e.preventDefault();this.useQuickPotion();}
        if(e.code==='Space' && !interactive && $('hudBackdrop').hidden){e.preventDefault();this.attack();}
      });
    }
    pickImport() {$('saveFileInput').click();}
    save() {
      if (!this.state || !this.profileId) return;
      this.stepClock();
      this.state.lastSeen=now();
      const success=this.write(SAVE_PREFIX+this.profileId,JSON.stringify(this.state));
      $('saveIndicator').classList.toggle('warning',!success);
      prop('saveIndicator','title',success?'Progresso salvo localmente':'Exportar JSON recomendado');
    }
    exportSave() {
      if (!this.state) {this.toast('Abra um perfil para exportar o progresso.');return;}
      this.save();
      const output={type:'hellward',format:3,exportedAt:new Date().toISOString(),state:this.state};
      const blob=new Blob([JSON.stringify(output,null,2)],{type:'application/json;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const anchor=document.createElement('a');
      anchor.href=url;anchor.download=`hellward-save-${this.state.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/g,'-')||'aventureiro'}.json`;
      document.body.append(anchor);anchor.click();anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1200);
      this.toast('Backup JSON exportado com sucesso.','good');
    }
    async importSave(file) {
      if (file.size>2*1024*1024) {this.toast('Arquivo muito grande. O limite é 2 MB.');return;}
      try {
        const imported=JSON.parse(await file.text());
        if (imported?.type!=='hellward' || imported?.format!==3 || imported?.state?.version!==SAVE_VERSION || typeof imported.state!=='object') throw Error('Use um backup Hellward V7. Saves anteriores foram descontinuados para esta nova campanha.');
        const state=normalizeSave(imported.state,'Errante');
        const perform=()=>{
          if(this.state){state.name=this.state.name;this.activate({id:this.profileId,name:state.name},state);this.toast('Backup importado e validado.','good');}
          else {this.createProfile(state.name,state);this.toast('Backup importado em um novo perfil.','good');}
        };
        if (this.state) this.dialog('Substituir o progresso?',`O backup pertence a “${state.name}”, nível ${state.level}. Importá-lo irá substituir o progresso do perfil atual. Exporte um backup antes, se necessário.`,[{text:'CANCELAR'},{text:'IMPORTAR',primary:true,action:perform}],'⚠');
        else perform();
      } catch(error){this.toast(`Falha na importação: ${safeName(error?.message,100)||'JSON inválido'}`);}
    }
    dialog(title,body,actions=[{text:'CONTINUAR',primary:true}],glyph='✦',details=null) {
      text('dialogIcon',glyph);
      text('dialogTitle',title);
      // Every opening owns fresh content, including when the caption is unchanged.
      // An image has no textContent, so the changed-value text helper cannot reset it.
      $('dialogText').replaceChildren(document.createTextNode(String(body)));
      $('dialogBackdrop').dataset.kind=details?.kind || 'chronicle';
      if(details?.kind==='offline') {
        const intro=document.createElement('p');intro.textContent=body;
        const loot=document.createElement('div');loot.className='offline-loot';
        loot.innerHTML=[['⚔',fmt(details.kills),'ABATES'],['✦','+'+fmt(details.gold),'OURO'],['✧','+'+fmt(details.xp),'EXPERIÊNCIA']].map(([icon,value,label])=>`<div><span aria-hidden="true">${icon}</span><strong>${value}</strong><small>${label}</small></div>`).join('');
        const seal=document.createElement('p');seal.className='offline-seal';seal.textContent='Ausência: '+details.duration+' · Até 12 horas de progresso offline.';
        $('dialogText').replaceChildren(intro,loot,seal);
      }
      const container=$('dialogActions');container.replaceChildren();
      for (const act of actions) {
        const btn=document.createElement('button');btn.type='button';btn.className=act.primary?'primary-button':'subtle-button';btn.textContent=act.text;
        btn.addEventListener('click',()=>{$('dialogBackdrop').hidden=true;if(act.action)act.action();});container.append(btn);
      }
      prop('dialogBackdrop','hidden',false);
      container.querySelector('button:last-child')?.focus();
    }
    toast(text,kind='') {
      if(!$('hudBackdrop').hidden && $('dialogBackdrop').hidden) {
        const feedback=$('hudFeedback');feedback.textContent=text;feedback.hidden=false;
        clearTimeout(this.feedbackTimer);this.feedbackTimer=setTimeout(()=>feedback.hidden=true,3800);return;
      }
      const node=document.createElement('div');node.className=`toast ${kind}`;node.textContent=text;
      const box=$('toastStack');box.prepend(node);
      while(box.children.length>4)box.lastElementChild.remove();
      setTimeout(()=>node.remove(),3800);
    }
    addLog(text,glyph='⚔',kind='') {
      if(!this.state) return;
      const row=document.createElement('div');row.className=`log-entry ${kind}`;
      const symbol=document.createElement('div');symbol.className='log-glyph';symbol.textContent=glyph;
      const content=document.createElement('div');const paragraph=document.createElement('p');paragraph.textContent=text;
      const date=document.createElement('time');date.textContent=timeLabel();
      content.append(paragraph,date);row.append(symbol,content);
      const log=$('combatLog');
      const historyOpen=log.scrollTop>12,previousHeight=log.scrollHeight;
      log.prepend(row);
      while(log.children.length>70)log.lastElementChild.remove();
      log.scrollTop=historyOpen?log.scrollTop+(log.scrollHeight-previousHeight):0;
    }
    formatDuration(seconds) {
      const total=Math.floor(seconds);
      if(total>=3600) return `${Math.floor(total/3600)}h ${Math.floor(total%3600/60)}min`;
      if(total>=60) return `${Math.floor(total/60)}min`;
      return `${total}s`;
    }
    equippedStats() { return heroEquipmentStats(this.state); }
    bonuses() {
      const s=this.state,eq=this.equippedStats();
      const click=multiply(2+s.level*.5+s.upgrades.strike*2.4+s.attributes.strength*2+eq.click,(1+s.skills.w1*.2));
      const dps=multiply(s.upgrades.ritual*1.8+s.attributes.will+eq.dps,(1+s.skills.s1*.25+s.skills.s4*.3));
      const crit=Math.min(.75,.08+s.upgrades.focus*.007+s.skills.w2*.02+eq.crit);
      const critDamage=1.7+s.skills.w3*.22;
      const luck=s.skills.r1*.06+eq.luck;
      const gold=1+s.upgrades.banner*.07+s.skills.s3*.10+eq.gold;
      const drop=Math.min(.05,.02+Math.max(0,luck)*.012);
      const maxHp=heroMaxHp(s);
      const defense=Math.max(0,3+(s.level-1)*.28+s.upgrades.guard*2.5+s.attributes.guard+eq.defense);
      const regenNatural=Math.max(.2,.55+maxHp*.0025+s.upgrades.recovery*.65);
      const regen=combatRegeneration(s,regenNatural);
      return {click,dps,crit,critDamage,luck,gold,drop,maxHp,defense,regen,regenNatural,offline:.6*(1+s.skills.s2*.12),eventDamage:1+s.skills.w4*.35};
    }
    awardGold(amount) {
      const value=number(amount);
      const s=this.state;
      const previous=s.gold;
      s.gold=add(previous,value);
      const earned=s.gold-previous;
      s.runGold=add(s.runGold,earned);
      return earned;
    }
    awardXp(amount) {
      const s=this.state;
      const before=s.level;
      s.xp=add(s.xp,number(amount));
      let iterations=0;
      while(s.level<MAX_LEVEL && s.xp>=xpNeeded(s.level) && iterations++<MAX_LEVEL){
        s.xp-=xpNeeded(s.level);
        s.level++;
      }
      if(s.level>=MAX_LEVEL)s.xp=0;
      if(s.level>before){
        s.heroHp=Math.min(heroMaxHp(s),s.heroHp+(s.level-before)*13);
        this.addLog(`Você alcançou o nível ${s.level}!`,'✦','good');
        this.toast(`NÍVEL ${s.level} — +${(s.level-before)*2} pontos no Livro Negro!`,'good');
        this.renderPanel();
      }
    }
    grantOffline(seconds) {
      const s=this.state;
      if(!s||seconds<1 || s.deadUntil || s.heroHp<=0)return {kills:0,gold:0,xp:0};
      const bonus=this.bonuses();
      if(bonus.dps<=0)return {kills:0,gold:0,xp:0};
      let remaining=multiply(bonus.dps,Math.min(MAX_OFFLINE_SECONDS,seconds)*bonus.offline);
      let kills=0,gold=0,xp=0;
      // At most 100 regular enemies are simulated before each mandatory boss.
      // Offline progression stops at the miniboss/boss, so gated areas cannot be skipped.
      while(remaining>0 && kills<MAX_OFFLINE_KILLS && (s.farmStage!=null || !requiredBossKind(progressAt(s)))){
        const mob=s.mob;
        if(mob.kind!=='normal'){s.mob=freshMob(s);break;}
        if(remaining<mob.hp){mob.hp-=remaining;break;}
        remaining-=mob.hp;
        gold=add(gold,multiply(rewardGold(s),bonus.gold));
        xp=add(xp,rewardXp(s));
        s.runKills++;s.lifetimeKills++;s.zoneKills[s.zone]++;
        const progress=progressAt(s);
        if(s.farmStage!=null)s.farmKills=(s.farmKills+1)%ENEMIES_PER_PHASE;
        else if(!progress.cleared){
          progress.kills++;
          if(progress.kills===ENEMIES_PER_PHASE && progress.stage!==5 && progress.stage!==10){
            progress.stage++;progress.kills=0;
          }
        }
        kills++;
        s.mob=freshMob(s,mob.name);
      }
      if(kills){this.awardGold(Math.floor(gold));this.awardXp(Math.floor(xp));}
      return {kills,gold:Math.floor(gold),xp:Math.floor(xp)};
    }
    stepClock() {
      if(!this.state)return;
      const t=now();
      if(!this.lastFrameAt){this.lastFrameAt=t;return;}
      const raw=(t-this.lastFrameAt)/1000;
      this.lastFrameAt=t;
      if(raw<=0)return;
      const s=this.state;
      if(s.deadUntil){
        if(t>=s.deadUntil)this.reviveHero();
        return;
      }
      if(s.event && this.state.event.expiresAt<=t)this.expireEvent();
      if(raw>2){
        // Offline DPS yields rewards safely without surprise lethal enemy hits.
        s.nextEnemyAttackAt=t+enemyAttackInterval(s.mob);
        const result=this.grantOffline(Math.min(MAX_OFFLINE_SECONDS,raw));
        if(result.kills && document.visibilityState!=='hidden')this.addLog(`${fmt(result.kills)} abates em segundo plano: +${fmt(result.gold)} ouro.`,'☽','good');
      }else{
        const b=this.bonuses();
        s.heroHp=Math.min(b.maxHp,s.heroHp+b.regen*Math.min(raw,2));
        if(document.visibilityState==='visible' && t>=s.nextEnemyAttackAt)this.enemyStrike();
        if(!s.deadUntil && b.dps>0)this.damageMob(multiply(b.dps,Math.min(raw,2)),false,false);
      }
      if(document.visibilityState==='visible' && !s.deadUntil && !this.state.event && t>=this.state.nextEventAt)this.spawnEvent();
    }
    enemyStrike() {
      const s=this.state;
      if(!s || s.deadUntil)return;
      const b=this.bonuses();
      const mitigated=enemyHitDamage(s,b.defense);
      s.heroHp=Math.max(0,s.heroHp-mitigated);
      s.nextEnemyAttackAt=now()+enemyAttackInterval(s.mob);
      this.playEnemyAttack();
      this.floatHeroNumber(`−${fmt(mitigated)}`);
      if(s.heroHp<=0)this.killHero();
    }
    floatHeroNumber(label,heal=false) {
      this.spawnCombatNumber(label,heal?'healing':'hero-hit',true);
    }
    killHero() {
      this.cancelEncounterFX(true);
      const s=this.state;
      if(s.deadUntil)return;
      s.heroHp=0;
      s.deadUntil=now()+8000;
      this.clearCombatVisuals();
      s.event=null;
      s.mob=freshMob(s);
      s.nextEventAt=now()+this.nextEventDelay();
      this.addLog('Você foi derrotado! O inimigo recuperou toda a vida. Retorno em 8 segundos.','☠','epic');
      this.toast('☠ DERROTADO — Retorno em 8 segundos.');
      this.renderEvent();this.save();
    }
    reviveHero() {
      const s=this.state;
      if(!s?.deadUntil)return;
      s.deadUntil=0;
      s.heroHp=this.bonuses().maxHp;
      s.nextEnemyAttackAt=now()+enemyAttackInterval(s.mob);
      this.addLog('Você retornou ao combate com vida restaurada.','✚','good');
      this.renderCore();
    }
    startLoop() {
      this.stopLoop();
      if(!this.state || document.hidden)return;
      this.startedLoop=true;this.loop();
    }
    stopLoop() {clearTimeout(this.loopTimer);this.loopTimer=0;this.startedLoop=false;}
    loop() {
      if(!this.state || document.hidden){this.stopLoop();return;}
      this.stepClock();
      const t=now();
      if(t-this.lastCoreRender>=180){this.renderCore();this.lastCoreRender=t;}
      if(t-this.lastPanelRender>=1500 && !$('hudBackdrop').hidden && $('hudPanel').dataset.view===this.tab && (this.tab==='upgrades' || this.tab==='ascension'))this.renderPanel();
      this.loopTimer=setTimeout(()=>this.loop(),100);
    }
    attack() {
      this.closeExpeditionReceipt();
      this.stopEncounterAnimation('entry');
      if(this.state?.deadUntil)return;
      if(!this.state || !$('dialogBackdrop').hidden || !$('hudBackdrop').hidden)return;
      const b=this.bonuses(),critical=Math.random()<b.crit;
      const hit=multiply(b.click,critical?b.critDamage:1);
      this.damageMob(hit,true,critical);
      this.renderCore();
    }
    combatMotionEnabled() {
      return this.state && !document.hidden && $('authScreen').hidden && !this.reducedCombatMotion.matches && !document.documentElement.classList.contains('hw-lite') && document.documentElement.dataset.screenEffects!=='off';
    }
    animateCombat(channel,node,frames,options) {
      if(!node)return;
      this.combatVisuals.get(channel)?.cancel();
      const idle=node.closest('.actor-idle');
      idle?.classList.add('actor-active');
      const animation=node.animate(frames,{easing:'linear',...options});
      this.combatVisuals.set(channel,animation);
      const done=()=>{if(this.combatVisuals.get(channel)===animation){this.combatVisuals.delete(channel);idle?.classList.remove('actor-active');if(channel==='finisher')node.hidden=true;animation.cancel();}};
      animation.finished.then(done,done);
      return animation;
    }
    clearCombatVisuals() {
      for(const animation of this.combatVisuals.values()){
        animation.effect?.target?.closest('.actor-idle')?.classList.remove('actor-active');
        animation.cancel();
      }
      this.combatVisuals.clear();
      $('finisherArt').hidden=true;
      this.lastCombatImpactAt=this.lastCriticalImpactAt=-Infinity;
    }
    playCombatImpact(critical=false,amount=0,maxHp=1) {
      if(!this.combatMotionEnabled()){this.clearCombatVisuals();return;}
      const c=FX_CONFIG.impact,t=performance.now();
      if(t-this.lastCombatImpactAt<FX_CONFIG.impact.gapMs)return;
      this.lastCombatImpactAt=t;
      const strong=critical && t-this.lastCriticalImpactAt>=FX_CONFIG.impact.criticalGapMs;
      if(strong)this.lastCriticalImpactAt=t;
      const heroFrames=[{transform:'translateX(0)'},{transform:`translateX(${-c.heroBackPx}px)`,offset:.12},{transform:`translateX(${c.heroForwardPx}px)`,offset:.3}];
      if(strong)heroFrames.push({transform:`translateX(${c.heroForwardPx}px)`,offset:.3+c.holdMs/c.criticalHeroMs,easing:'ease-out'});
      heroFrames.push({transform:'translateX(0)'});
      this.animateCombat('hero',$('combatHero').querySelector('img'),heroFrames,{duration:strong?c.criticalHeroMs:c.heroMs});
      const delay=strong?c.criticalContactMs:c.contactMs;
      const enemyFrames=strong?[{transform:`translateX(${c.criticalEnemyPx}px)`},{transform:`translateX(${c.criticalEnemyPx}px)`,offset:c.holdMs/c.criticalEnemyMs,easing:'ease-out'},{transform:'translateX(0)'}]:[{transform:'translateX(0)'},{transform:`translateX(${c.enemyPx}px)`,offset:.22,easing:'ease-out'},{transform:'translateX(0)'}];
      this.animateCombat('enemy',$('monsterArt').querySelector('img'),enemyFrames,{duration:strong?c.criticalEnemyMs:c.enemyMs,delay});
      const a=this.combatNumberAnchors.enemy,{width,height}=this.arenaSize,slash=$('duelSlash'),size=(strong?c.criticalSlashRem:c.slashRem)*(this.uiRem||16);
      const x=Math.max(76,Math.min(width-76,a?.width?a.x+a.width/2:width*.75));
      const y=Math.max(76,Math.min(height-76,a?.height?a.y+a.height*.42:height*.5));
      for(const [key,value] of Object.entries({left:x+'px',top:y+'px',width:size+'px',height:size+'px'}))if(slash.style[key]!==value)slash.style[key]=value;
      slash.classList.toggle('impact-critical',strong);
      this.animateCombat('impact',slash,[{opacity:0,transform:'translate(-50%,-50%) rotate(-12deg) scale(.65)'},{opacity:1,transform:'translate(-50%,-50%) rotate(-8deg) scale(1)',offset:.2},{opacity:0,transform:'translate(-50%,-50%) rotate(-5deg) scale(1.08)'}],{duration:strong?170:140,delay});
      this.playHitDecorations(false,strong);
      const shake=Math.min(FX_CONFIG.impact.shakePx,FX_CONFIG.impact.shakePx*Math.min(1,amount/Math.max(1,maxHp))*(strong?2:.1)+(strong?1:0));
      if(shake>.05)this.animateCombat('camera',$('arenaCamera'),[{transform:'translateX(0)'},{transform:`translateX(${-shake}px)`,offset:.2},{transform:`translateX(${shake}px)`,offset:.4},{transform:'translateX(-1px)',offset:.65},{transform:'translateX(0)'}],{duration:FX_CONFIG.impact.shakeMs,delay});
    }
    playHitDecorations(final=false,strong=false) {
      if(!this.combatMotionEnabled())return;
      const c=FX_CONFIG.impact,a=this.combatNumberAnchors.enemy;if(!a?.width)return;
      const img=$('monsterArt').querySelector('img');if(!img)return;
      const node=final?$('finisherArt'):$('targetFlash');
      for(const [k,v]of Object.entries({left:a.x+'px',top:a.y+'px',width:a.width+'px',height:a.height+'px'}))node.style[k]=v;
      const src=img.getAttribute('src');node.style.setProperty('--hit-mask',`url(${JSON.stringify(src)})`);
      if(final){node.querySelector('img').src=src;node.hidden=false;this.animateCombat('finisher',node,[{opacity:1,transform:'translateX(0)'},{opacity:1,transform:'translateX(0)',offset:c.holdMs/c.finalMs},{opacity:0,transform:'translateX(3px)'}],{duration:c.finalMs,fill:'both'});}
      const flash=final?node.querySelector('i'):node;
      this.animateCombat('flash',flash,[{opacity:.9},{opacity:0}],{duration:final?c.finalFlashMs:c.flashMs,fill:'both'});
      if(final)this.animateCombat('camera',$('arenaCamera'),[{transform:'translateX(0)'},{transform:`translateX(${-c.shakePx}px)`,offset:.25},{transform:`translateX(${c.shakePx}px)`,offset:.5},{transform:'translateX(0)'}],{duration:c.shakeMs});
      const count=final?c.finalSparks:strong?c.criticalSparks:c.sparks;
      for(let i=0;i<Math.min(count,c.sparkLimit);i++){
        const index=this.sparkCursor++%this.sparkNodes.length,n=this.sparkNodes[index],angle=Math.random()*Math.PI*2;
        const travel=(.5+Math.random())*c.sparkTravelRem*(this.uiRem||16);
        n.style.left=(a.x+a.width*.5)+'px';n.style.top=(a.y+a.height*.42)+'px';
        this.animateCombat('spark'+index,n,[{opacity:1,transform:'translate(0,0)'},{opacity:0,transform:`translate(${Math.round(Math.cos(angle)*travel)}px,${Math.round(Math.sin(angle)*travel)}px)`}],{duration:c.sparkMs,fill:'both'});
      }
    }
    playEnemyAttack() {
      if(!this.combatMotionEnabled()){this.clearCombatVisuals();return;}
      const c=FX_CONFIG.impact;
      this.animateCombat('enemy',$('monsterArt').querySelector('img'),[{transform:'translateX(0)'},{transform:`translateX(${-c.enemyAttackPx}px)`,offset:.28,easing:'ease-out'},{transform:'translateX(0)'}],{duration:c.enemyAttackMs});
      this.animateCombat('hero',$('combatHero').querySelector('img'),[{transform:'translateX(0)'},{transform:`translateX(${-c.heroHurtPx}px)`,offset:.18,easing:'ease-out'},{transform:'translateX(0)'}],{duration:c.heroHurtMs});
    }
    floatNumber(label,style='') {
      this.spawnCombatNumber(label,style,false);
    }
    cacheCombatNumberAnchors() {
      const arena=$('battlefield').getBoundingClientRect();
      if(!arena.width || !arena.height)return;
      this.arenaSize={width:arena.width,height:arena.height};
      this.uiRem=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;
      const box=id=>{
        const b=$(id).getBoundingClientRect();
        return {x:b.left-arena.left,y:b.top-arena.top,width:b.width,height:b.height};
      };
      this.combatNumberAnchors={enemy:box('attackTarget'),hero:box('combatHero'),event:box('eventArt'),eventCard:$('eventOverlay').hidden?null:box('eventOverlay')};
      const img=$('monsterArt').querySelector('img'),a=this.combatNumberAnchors.enemy;
      const ink=img&&MONSTER_INK_BOUNDS[img.getAttribute('src').split('?')[0]];
      if(ink&&img.naturalWidth){const scale=Math.min(a.width/img.naturalWidth,a.height/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;
        this.combatNumberAnchors.ink={x:a.x+(a.width-w)/2+ink[0]*w,right:a.x+(a.width-w)/2+ink[2]*w};}
      for(const group of Object.values(this.combatNumbers))for(const [node,meta] of group)this.positionCombatNumber(node,meta);
    }
    positionCombatNumber(node,meta) {
      const {width,height}=this.arenaSize;
      const a=this.combatNumberAnchors[meta.kind];
      const small=width<=760,crit=meta.style==='crit';
      const cfg=FX_CONFIG.numbers,rem=this.uiRem||16;
      const desired=(crit?cfg.criticalRem:meta.hero?cfg.heroRem:cfg.normalRem)*rem;
      const budget=Math.min(width-24,meta.hero?Math.max(108,width*.28):width*.45,260);
      const size=Math.min(desired,budget/Math.max(1,node.textContent.length*.68));
      const half=Math.max(node.textContent.length*size*.34,meta.caption.length*5/2)+7;
      let x=a?.width?a.x+a.width/2:width*(meta.hero?.22:meta.kind==='event'?.13:.75);
      let y=a?.height?a.y+a.height*(meta.hero?.32:meta.kind==='event'?.5:.42):height*.55;
      if(meta.kind==='reward'){x=width*.5;y=height*.56;}
      const laneGap=meta.kind==='event'?6:small?40:48;
      // Reserve travel/caption space before splitting lanes, even on short actors.
      if(a?.height && meta.kind==='enemy')y=Math.max(a.y+50+laneGap,y);
      x+=meta.jitter;
      if(meta.kind==='enemy'){const edge=this.combatNumberAnchors.ink?.x??a?.x??width*.6;const room=Math.max(48,edge-20);const fitted=Math.min(size,room/Math.max(1,node.textContent.length*.68));node.style.fontSize=(fitted/rem)+'rem';const span=Math.max(node.textContent.length*fitted*.34,meta.caption.length*5/2)+7;x=Math.max(span+8,edge-span-16-Math.abs(meta.jitter));}

      y+=meta.lane*laneGap;
      y=Math.max(58,Math.min(height-Math.ceil(size*1.1)-8,y));
      const card=this.combatNumberAnchors.eventCard;
      if(meta.hero && card && x-half<card.x+card.width+8 && x+half>card.x && y+20>card.y && y-54<card.y+card.height)x=card.x+card.width+half+12;
      x=Math.max(half+8,Math.min(width-half-8,x));
      if(meta.kind!=='enemy')node.style.fontSize=(size/rem)+'rem';node.style.left=`${x}px`;node.style.top=`${y}px`;
    }
    spawnCombatNumber(label,style,hero) {
      if(document.hidden || !$('authScreen').hidden)return;
      const key=hero?'hero':'enemy',group=this.combatNumbers[key];
      const cfg=FX_CONFIG.numbers;
      while(group.size>=(hero?cfg.heroLimit:cfg.enemyLimit))this.removeCombatNumber(group.keys().next().value,group);
      const node=this.numberPool[key].pop()||document.createElement('span');
      const caption=style==='crit'?'CRÍTICO':style==='healing'?'CURA':'';
      node.className=`combat-number ${hero?'hero-damage-number':'float-damage'} ${style}`;
      let value=String(label);
      if(style==='crit')value=value.replace(/^CRÍTICO!?\s*/u,'');
      if(style==='healing')value=value.replace(/\s*♥\s*$/u,'');
      node.textContent=value;
      if(caption)node.dataset.caption=caption;else delete node.dataset.caption;
      const kind=hero?'hero':style==='event-hit'?'event':style==='reward'?'reward':'enemy';
      const meta={hero,kind,style,caption,lane:this.combatNumberSequence[key]++%3-1,jitter:(Math.random()*2-1)*cfg.jitterRem*(this.uiRem||16),timer:0,animation:null};
      this.positionCombatNumber(node,meta);
      $(hero?'heroDamageLayer':'damageLayer').append(node);
      group.set(node,meta);
      const reduced=this.reducedCombatMotion.matches||document.documentElement.classList.contains('hw-lite');
      const rise=cfg.riseRem*(this.uiRem||16),duration=Math.max(600,Math.min(900,cfg.durationMs));
      const frames=reduced?[{opacity:1},{opacity:1,offset:.75},{opacity:0}]:[
        {opacity:0,transform:`translate(-50%,0) scale(${style==='crit'?.85:1})`},
        {opacity:1,transform:`translate(-50%,-${rise*.1}px) scale(${style==='crit'?cfg.pop:1})`,offset:.15},
        {opacity:1,transform:`translate(-50%,-${rise*.4}px) scale(1)`,offset:.55},
        {opacity:0,transform:`translate(-50%,-${rise}px) scale(1)`}];
      meta.animation=node.animate(frames,{duration,easing:'ease-out',fill:'both'});
      meta.animation.finished.then(()=>{if(group.get(node)===meta)this.removeCombatNumber(node,group);},()=>{});
    }
    removeCombatNumber(node,group) {
      const meta=group.get(node);
      if(!meta)return;
      clearTimeout(meta.timer);meta.animation?.cancel();
      group.delete(node);node.remove();this.numberPool[meta.hero?'hero':'enemy'].push(node);
    }
    clearCombatNumbers() {
      for(const group of Object.values(this.combatNumbers))for(const node of group.keys())this.removeCombatNumber(node,group);
      this.combatNumberSequence={enemy:0,hero:0};
    }
    damageMob(amount,fromClick,critical) {
      const s=this.state;
      if(!s || s.deadUntil || amount<=0)return;
      if(fromClick && !this.encounterHold){this.floatNumber(`${critical?'CRÍTICO! ':''}−${fmt(amount)}`,critical?'crit':'');this.playCombatImpact(critical,amount,s.mob.maxHp);}
      let remaining=amount;
      let chain=0;
      while(remaining>0 && chain++<12){
        const mob=s.mob;
        if(!mob || mob.hp<=0){s.mob=freshMob(s);continue;}
        if(remaining<mob.hp){mob.hp=Math.max(0,mob.hp-remaining);break;}
        remaining-=mob.hp;
        mob.hp=0;
        this.killMob();
      }
    }
    killMob() {
      const s=this.state;
      const defeated=s.mob;
      const kind=defeated.kind||'normal';
      const name=defeated.name;
      const from={zone:s.zone,stage:combatStage(s),cleared:progressAt(s).cleared,gold:s.gold};
      const visible=this.encounterSeenMob===defeated && !this.encounterHold;
      if(kind==='boss' && visible)this.playHitDecorations(true,true);
      this.beginEncounterDeath(defeated,from,visible);
      const multiplier=kind==='boss'?18:kind==='miniboss'?7:1;
      const gold=Math.floor(multiply(multiply(rewardGold(s),multiplier),this.bonuses().gold));
      const xp=Math.floor(multiply(rewardXp(s),kind==='boss'?14:kind==='miniboss'?6:1));
      this.awardGold(gold);
      s.runKills++;s.lifetimeKills++;s.zoneKills[s.zone]++;
      this.awardXp(xp);
      const progress=progressAt(s);
      let travelNext=false;
      if(kind==='miniboss'){
        progress.minibossDefeated=true;
        progress.stage=6;progress.kills=0;
        this.dropMaterial(3);
        if(Math.random()<.4)this.awardEquipment(weightedPick(['incomum','raro','epico'],[80,19,1]));
        this.addLog(`MINIBOSS ${name} vencido! Fase 6 desbloqueada. +${fmt(gold)} ouro e +${fmt(xp)} XP.`,'⚔','epic');
        this.toast('✦ MINIBOSS VENCIDO! A fase 6 foi liberada!','epic');
      }else if(kind==='boss'){
        progress.bossDefeated=true;progress.cleared=true;progress.stage=10;progress.kills=10;
        this.dropMaterial(5);
        const trophy=this.awardEquipment(weightedPick(['raro','epico','lendario'],[90,9,1]),3);
        if(!from.cleared)this.pendingExpeditionReceipt={owner:s,zone:from.zone,gold:Math.max(0,s.gold-from.gold),xp,trophy:trophy?.name||'Tesouro convertido conforme a Mochila',final:from.zone===ZONES.length-1};
        this.addLog(`CHEFÃO ${name} DERROTADO! ${ZONES[s.zone].name} foi conquistada! +${fmt(gold)} ouro e +${fmt(xp)} XP.`,'◆','epic');
        this.toast(`CHEFÃO DERROTADO! ${s.zone===ZONES.length-1?'Todas as regiões conquistadas!':'Nova região liberada!'}`,'epic');
        travelNext=s.zone<ZONES.length-1;
      }else{
        if(s.farmStage!=null)s.farmKills=(s.farmKills+1)%ENEMIES_PER_PHASE;
        else if(!progress.cleared){
          progress.kills++;
          if(progress.kills===ENEMIES_PER_PHASE){
            if(progress.stage===5){
              this.addLog(`Os dez inimigos da fase 5 caíram. O MINIBOSS surgiu!`,'☠','rare');
              this.toast('⚠ MINIBOSS — Uma criatura poderosa bloqueia o caminho!');
            }else if(progress.stage===10){
              this.addLog(`Os dez inimigos da fase 10 caíram. O CHEFÃO FINAL despertou!`,'☠','epic');
              this.toast('⚠ CHEFÃO DA REGIÃO! Prepare seus golpes!','epic');
            }else{
              progress.stage++;progress.kills=0;
              this.addLog(`FASE ${progress.stage} liberada em ${ZONES[s.zone].name}!`,'✦','good');
            }
          }
        }
        this.rollCombatLoot();
        this.addLog(`${name} derrotado. +${fmt(gold)} ouro · +${fmt(xp)} XP.`,'⚔');
      }
      if(!s.event && now()-s.lastEventAt>17000 && Math.random()<(.029+s.skills.r3*.007))this.spawnEvent();
      if(travelNext){
        const previousZone=ZONES[s.zone].name;
        s.zone++;
        s.event=null;
        s.nextEventAt=now()+this.nextEventDelay();
        this.lastZoneRendered=-1;
        this.addLog(`✧ ${previousZone} concluída. Você avançou para ${ZONES[s.zone].name}!`,'⚑','good');
        this.toast(`REGIÃO ${ZONES[s.zone].rune} — ${ZONES[s.zone].name}`,'good');
      }
      s.mob=freshMob(s,defeated.name);
      s.nextEnemyAttackAt=now()+enemyAttackInterval(s.mob);
      if(this.encounterHold)this.encounterHold.targetMob=s.mob;
      this.renderCore();
      if(!this.encounterHold){this.presentPhaseChange(from);this.presentExpeditionReceipt();}
      if(kind==='boss' && !from.cleared)this.save();
      if(!$('hudBackdrop').hidden && (this.tab==='inventory'||this.tab==='zones'))this.renderPanel();
    }
    nextEventDelay() {return Math.floor(randEventDelay()/(1+this.state.skills.r3*.14));}
    spawnEvent() {
      const s=this.state;
      if(!s || s.deadUntil || s.event || document.visibilityState==='hidden')return;
      const type=Math.random()<.55?'goblin':'chest';
      const maxHp=Math.max(18,Math.ceil(this.bonuses().click*8));
      s.event={type,hp:maxHp,maxHp,expiresAt:now()+11000+s.skills.r3*3000};
      s.lastEventAt=now();s.nextEventAt=now()+this.nextEventDelay();
      this.lastEventRendered='';
      this.addLog(type==='goblin'?'Um Goblin do Tesouro apareceu!':'Um Baú Raro emergiu das sombras!','✦','rare');
      this.toast('✦ EVENTO RARO! Clique no tesouro antes que fuja!');
      this.renderEvent();
    }
    attackEvent() {
      const s=this.state;
      if(!s?.event || s.deadUntil || !$('dialogBackdrop').hidden)return;
      if(now()>=s.event.expiresAt){this.expireEvent();return;}
      const b=this.bonuses();
      const critical=Math.random()<b.crit;
      const dmg=multiply(b.click*(critical?b.critDamage:1),b.eventDamage);
      s.event.hp=Math.max(0,s.event.hp-dmg);
      this.floatNumber(`−${fmt(dmg)}`,'event-hit');
      if(s.event.hp<=0)this.winEvent();
      this.renderEvent();
    }
    expireEvent() {
      if(!this.state?.event)return;
      this.addLog(this.state.event.type==='goblin'?'O goblin escapou com suas riquezas.':'O baú desapareceu nas sombras.','☾');
      this.state.event=null;this.renderEvent();
    }
    winEvent() {
      const s=this.state,event=s.event;
      if(!event)return;
      s.event=null;
      const gold=Math.floor(multiply(rewardGold(s),event.type==='goblin'?38:27)*this.bonuses().gold);
      const xp=Math.floor(multiply(rewardXp(s),9));
      const shards=rand(event.type==='goblin'?3:2,7);
      this.awardGold(gold);this.awardXp(xp);
      s.shards+=shards;
      const souls=Math.floor(s.shards/10);
      if(souls){s.souls=add(s.souls,souls);s.shards%=10;}
      this.dropMaterial(event.type==='goblin'?3:4);
      const item=Math.random()<(event.type==='goblin'?.20:.35)?this.awardEquipment(weightedPick(['raro','epico','lendario'],[85,14,1])):null;
      const name=event.type==='goblin'?'Goblin do Tesouro':'Baú Raro';
      this.floatNumber(`+${fmt(gold)} OURO`,'reward');
      this.addLog(`${name}: +${fmt(gold)} ouro, +${fmt(xp)} XP, ${shards} fragmentos${souls?`, +${souls} alma(s)`:''}!`,'✦','epic');
      this.toast(`TESOURO! +${fmt(gold)} ouro · ${(RARITIES.find(r=>r.id===item?.rarity)?.label||'SUCATA').toUpperCase()} · ${shards} fragmentos`,'epic');
      if(item)this.addLog(`Tesouro raro: ${item.name}!`,'◆','epic');
      this.renderEverything();this.save();
    }
    rollRarity() {
      const bonus=Math.min(8,this.state.skills.r2);
      return weightedPick(['comum','incomum','raro','epico','lendario'],
        [67,23,8,1.8+bonus*.12,.2+bonus*.025]);
    }
    chooseCatalogItem(forcedRarity=null,forcedKind=null) {
      const s=this.state,zone=s.zone;
      const regional=ITEM_CATALOG.filter(x=>catalogZone(x)===zone && (!forcedKind || (forcedKind==='equipment'?Boolean(CATALOG_SLOTS[x.tipo]):x.tipo===forcedKind)));
      if(!regional.length) return null;
      if(forcedKind==='material')return pick(regional);
      // Never replace an epic reward with a common item merely because a zone lacks that rarity.
      const all=regional.filter(x=>x.tipo!=='material');
      let rarity=forcedRarity||this.rollRarity();
      let options=all.filter(x=>CATALOG_RARITIES[x.raridade]===rarity);
      if(!options.length){
        const ranked=['comum','incomum','raro','epico','lendario'];
        const wanted=ranked.indexOf(rarity);
        const distance=(x)=>Math.abs(ranked.indexOf(CATALOG_RARITIES[x.raridade])-wanted);
        const best=Math.min(...all.map(distance));
        options=all.filter(x=>distance(x)===best);
      }
      return options.length?pick(options):null;
    }
    makeItem(forcedRarity=null,forcedKind=null,minimumQuality=1) {
      const s=this.state;
      const def=this.chooseCatalogItem(forcedRarity,forcedKind);
      if(!def)return null;
      const kind=def.tipo==='material'?'material':def.tipo==='poção'?'potion':'equipment';
      const slot=CATALOG_SLOTS[def.tipo]||null;
      const rarity=CATALOG_RARITIES[def.raridade]||'comum';
      const quality=kind==='equipment'?Math.max(integer(minimumQuality,1,1,10),rollQuality()):null;
      const mult=kind==='equipment'?qualityMultiplier(rarity,quality):(RARITIES.find(r=>r.id===rarity)||RARITIES[1]).multiplier;
      const level=s.level;
      const scale=(1+Math.min(250,level)*.13+s.zone*.75)*mult;
      const roll=()=>1;
      const stats=slotStats();
      if(slot==='weapon'){stats.click=Math.max(1,Math.round(scale*3.4*roll()));if(['raro','epico','lendario'].includes(rarity))stats.crit=Number((mult*.006*roll()).toFixed(4));}
      if(slot==='helmet'){stats.click=Math.round(scale*.9*roll());stats.defense=Number((scale*2.5*roll()).toFixed(1));stats.health=Math.round(scale*8*roll());}
      if(slot==='armor'){stats.defense=Number((scale*4.5*roll()).toFixed(1));stats.health=Math.round(scale*13*roll());if(['epico','lendario'].includes(rarity))stats.dps=Number((scale*.9*roll()).toFixed(1));}
      if(slot==='ring'){stats.gold=Number((scale*.018*roll()).toFixed(3));stats.crit=Number((mult*.007*roll()).toFixed(4));}
      if(slot==='necklace'){stats.click=Math.round(scale*.65*roll());stats.health=Math.round(scale*4.3*roll());stats.luck=Number((scale*.007*roll()).toFixed(3));}
      if(slot==='relic'){stats.luck=Number((scale*.012*roll()).toFixed(3));stats.dps=Number((scale*1.1*roll()).toFixed(1));}
      return {id:uid(),catalogId:def.id,kind,slot,rarity,quality,name:def.nome,level,qty:1,stats,createdAt:now()};
    }
    addItem(item,guaranteed=false) {
      if(!item)return null;
      const s=this.state;
      if(item.kind!=='equipment'){
        const stack=s.inventory.find(x=>x.catalogId===item.catalogId && x.kind===item.kind);
        if(stack){stack.qty=Math.min(99999,stack.qty+item.qty);return stack;}
      }
      if(s.inventory.length>=MAX_INVENTORY){
        const protectedIds=new Set(Object.values(s.equipment).filter(Boolean));
        const weakest=s.inventory.filter(x=>!protectedIds.has(x.id)).sort((a,b)=>
          RARITIES.findIndex(r=>r.id===a.rarity)-RARITIES.findIndex(r=>r.id===b.rarity) || this.itemPower(a)-this.itemPower(b))[0];
        if(guaranteed && weakest){
          s.inventory=s.inventory.filter(x=>x.id!==weakest.id);
          this.awardGold(this.itemPrice(weakest)*weakest.qty);
          this.addLog(`Inventário cheio: ${weakest.name} vendido para receber o tesouro.`,'♢');
        }else{
          this.awardGold(this.itemPrice(item));
          this.addLog(`Inventário cheio: ${item.name} convertido em ouro.`,'♢');
          return null;
        }
      }
      s.inventory.push(item);
      if(['epico','lendario'].includes(item.rarity)){
        this.addLog(`${item.rarity==='lendario'?'LENDÁRIO':'ÉPICO'} encontrado: ${item.name}!`,'◆',item.rarity==='lendario'?'rare':'epic');
        this.toast(`✦ ${item.name} encontrado!`,'epic');
      }else if(s.inventory.length<6)this.addLog(`Obtido: ${item.name}.`,'♢');
      text('inventoryCount',s.inventory.length);
      return item;
    }
    dropMaterial(qty=1) {const item=this.makeItem(null,'material');if(item)item.qty=integer(qty,1,1,10);return this.addItem(item);}
    dropItem(forceRarity=null,minimumQuality=1) {return this.addItem(this.makeItem(forceRarity,'equipment',minimumQuality),Boolean(forceRarity));}
    awardEquipment(rarity=null,minimumQuality=1) {
      const item=this.dropItem(rarity,minimumQuality);
      if(item && item.quality>=5 && ['raro','epico','lendario'].includes(item.rarity))this.state.lootDryStreak[this.state.zone]=0;
      return item;
    }
    rollCombatLoot() {
      const s=this.state;
      if(Math.random()<SCRAP_DROP_CHANCE)this.dropMaterial();
      if(Math.random()<POTION_DROP_CHANCE)this.addItem(this.makeItem(null,'poção'));
      s.lootDryStreak[s.zone]=Math.min(RARE_DROP_LIMIT,s.lootDryStreak[s.zone]+1);
      if(s.lootDryStreak[s.zone]>=RARE_DROP_LIMIT){
        const item=this.awardEquipment('raro',5);
        if(item)this.addLog(`Persistência recompensada: ${item.name}, qualidade ${item.quality}/10. Uma relíquia rara encerrou a sequência de caça.`,'◆','rare');
      }else if(Math.random()<this.bonuses().drop)this.awardEquipment();
    }
    itemPrice(item) {
      const def=CATALOG_BY_ID.get(item.catalogId);
      const area=def?catalogZone(def):this.state.zone;
      if(item.kind==='material')return Math.max(2,Math.floor(6*power(2.15,area)));
      if(item.kind==='potion')return Math.max(3,Math.floor(5*power(2.2,area)));
      const rarity=RARITIES.find(r=>r.id===item.rarity)||RARITIES[1];
      return Math.max(4,Math.floor((6+item.level*4)*rarity.multiplier*power(1.42,area)));
    }
    equipItem(id) {
      const item=this.state.inventory.find(x=>x.id===id);
      if(!item || item.kind!=='equipment'||!SLOTS.includes(item.slot))return;
      if(this.state.equipment[item.slot]===id)this.state.equipment[item.slot]=null;
      else this.state.equipment[item.slot]=id;
      this.state.heroHp=Math.min(this.state.heroHp,heroMaxHp(this.state));
      this.renderPanel();this.renderCore();this.save();
    }
    quickPotionChoice() {
      if (!this.state) return null;
      const s=this.state, maxHp=this.bonuses().maxHp, missing=Math.max(0,maxHp-s.heroHp);
      const options=s.inventory.filter(item=>item.kind==='potion' && item.qty>0).map(item=>{
        const def=CATALOG_BY_ID.get(item.catalogId), area=def?catalogZone(def):0;
        return {item,heal:Math.max(20,Math.ceil(maxHp*Math.min(.85,.36+area*.085)))};
      }).sort((a,b)=>a.heal-b.heal || a.item.createdAt-b.item.createdAt);
      // Use the smallest dose that can fill the missing health, otherwise the largest.
      return (options.find(x=>x.heal>=missing) || options[options.length-1])?.item || null;
    }
    useQuickPotion() {
      if (!this.state || !$('authScreen').hidden || !$('dialogBackdrop').hidden || !$('hudBackdrop').hidden) return;
      const item=this.quickPotionChoice();
      if(item)this.usePotion(item.id);
    }
    renderQuickPotion() {
      const s=this.state, item=this.quickPotionChoice(), button=$('quickPotion');
      const count=s.inventory.filter(x=>x.kind==='potion').reduce((sum,x)=>sum+x.qty,0);
      text('quickPotionCount',fmt(count));
      button.disabled=!item || Boolean(s.deadUntil) || s.heroHp>=this.bonuses().maxHp-.01;
      const label=!count?'Nenhuma poção de vida. Encontre poções durante sua jornada.':s.deadUntil?'Você está derrotado. Aguarde para usar poções.':button.disabled?'Vida cheia. Poções disponíveis: '+fmt(count):'Usar '+item.name+' (Q). Poções disponíveis: '+fmt(count);
      button.setAttribute('aria-label',label);button.title=label;
      paintIcon($('quickPotionArt'),itemArt(item || {catalogId:'area-01-09-pocao-de-vida-pequena'}));
    }
    usePotion(id) {
      const s=this.state,item=s.inventory.find(x=>x.id===id);
      if(!item||item.kind!=='potion')return;
      if(s.deadUntil){this.toast('Você não pode beber poções enquanto estiver derrotado.');return;}
      const b=this.bonuses();
      if(s.heroHp>=b.maxHp-0.01){this.toast('Sua vida já está cheia.');return;}
      const def=CATALOG_BY_ID.get(item.catalogId);
      const area=def?catalogZone(def):0;
      const ratio=Math.min(.85,.36+area*.085);
      const healed=Math.min(b.maxHp-s.heroHp,Math.max(20,Math.ceil(b.maxHp*ratio)));
      s.heroHp=Math.min(b.maxHp,s.heroHp+healed);
      item.qty--;if(item.qty<=0)s.inventory=s.inventory.filter(x=>x.id!==item.id);
      this.floatHeroNumber(`+${fmt(healed)} ♥`,true);
      this.addLog(`${item.name}: +${fmt(healed)} de vida restaurada.`,'✚','good');
      this.toast(`${item.name}: +${fmt(healed)} de cura!`,'good');
      this.renderPanel();this.renderCore();this.save();
    }
    bestEquipment() {
      const s=this.state, result={...s.equipment};
      for(const slot of SLOTS) {
        let best=s.inventory.find(i=>i.id===s.equipment[slot] && i.kind==='equipment' && i.slot===slot);
        for(const item of s.inventory)if(item.kind==='equipment' && item.slot===slot && (!best || this.itemPower(item)>this.itemPower(best)))best=item;
        result[slot]=best?.id || null;
      }
      return result;
    }
    equipBestItems() {
      if(!this.state)return;
      const best=this.bestEquipment(), changed=SLOTS.filter(slot=>best[slot]!==this.state.equipment[slot]).length;
      if(!changed){this.toast('Os melhores itens por poder já estão equipados.');return;}
      this.state.equipment=best;
      this.state.heroHp=Math.min(this.state.heroHp,heroMaxHp(this.state));
      this.renderCore();this.renderPanel();this.save();
      this.toast(`${changed} equipamento(s) melhorado(s). Seleção pelo poder dos atributos.`,'good');
    }
    sellItem(id) {
      if(!this.state)return;
      const state=this.state,item=state.inventory.find(i=>i.id===id);
      if(!item)return;
      if(item.kind==='equipment' && state.equipment[item.slot]===id){this.toast('Desequipe este item antes de vendê-lo.');return;}
      const perform=()=>{
        if(this.state!==state)return;
        const current=state.inventory.find(i=>i.id===id);
        if(!current || Object.values(state.equipment).includes(id))return;
        const price=this.itemPrice(current)*current.qty;
        state.inventory=state.inventory.filter(i=>i.id!==id);this.awardGold(price);
        this.toast(`${current.qty} unidade(s) vendida(s) por ${fmt(price)} ouro.`,'good');
        this.renderPanel();this.renderCore();this.save();
      };
      if(['raro','epico','lendario'].includes(item.rarity))this.dialog('Entregar esta relíquia?',`${item.name} será vendido por ${fmt(this.itemPrice(item)*item.qty)} ouro. Esta venda não pode ser desfeita.`,[{text:'MANTER ITEM'},{text:'CONFIRMAR VENDA',primary:true,action:perform}],'✦',{kind:'sale'});
      else perform();
    }
    saleCandidates(selection=this.sellRarity) {
      if(!this.state)return [];
      const allowed=new Set(['low','all',...RARITIES.map(r=>r.id)]);
      if(!allowed.has(selection))return [];
      const equipped=new Set(Object.values(this.state.equipment).filter(Boolean));
      return this.state.inventory.filter(item=>item.kind!=='potion' && !equipped.has(item.id) &&
        (selection==='all' || (selection==='low' && ['sucata','comum'].includes(item.rarity)) || item.rarity===selection));
    }
    requestBulkSale() {
      const state=this.state, selection=this.sellRarity, candidates=this.saleCandidates(selection);
      if(!candidates.length){this.toast('Nenhum item disponível nesta seleção. Equipados e poções são preservados.');return;}
      const ids=new Set(candidates.map(i=>i.id));
      const units=candidates.reduce((sum,i)=>sum+i.qty,0);
      const value=candidates.reduce((sum,i)=>add(sum,this.itemPrice(i)*i.qty),0);
      const rarity=selection==='all'?'todas as raridades':selection==='low'?'sucata e comuns':RARITIES.find(r=>r.id===selection).label;
      this.dialog('O tributo do saque',`Vender ${fmt(units)} unidade(s) de ${rarity} por ${fmt(value)} ouro?

Itens equipados e poções serão preservados. A venda não pode ser desfeita.`,[
        {text:'MANTER ESPÓLIOS'},
        {text:'CONFIRMAR VENDA',primary:true,action:()=>{
          if(this.state!==state)return;
          // A snapshot excludes drops gained after the dialog opened; recheck protection.
          const current=this.saleCandidates(selection).filter(i=>ids.has(i.id));
          const sold=new Set(current.map(i=>i.id));
          const earned=current.reduce((sum,i)=>add(sum,this.itemPrice(i)*i.qty),0);
          state.inventory=state.inventory.filter(i=>!sold.has(i.id));this.awardGold(earned);
          this.renderCore();this.renderPanel();this.save();
          this.toast(`${current.length} tipo(s) de item vendidos por ${fmt(earned)} ouro.`,'good');
        }}
      ],'✦',{kind:'sale'});
    }
    sellLowRarities() {this.sellRarity='low';this.requestBulkSale();}
    upgradeCost(up) {
      return Math.max(1,Math.floor(multiply(up.base,power(up.growth,this.state.upgrades[up.id]))));
    }
    upgradeQuote(up,desired) {
      const s=this.state;
      const capacity=Math.max(0,MAX_RANK-s.upgrades[up.id]);
      const wanted=desired==='max'?capacity:Math.min(desired,capacity);
      let affordable=0,total=0;
      for(let i=0;i<wanted;i++){
        const price=Math.max(1,Math.floor(multiply(up.base,power(up.growth,s.upgrades[up.id]+i))));
        if(price>MAX_NUMBER-total || total+price>s.gold)break;
        total+=price;affordable++;
      }
      return {count:affordable,total};
    }
    buyUpgrade(id) {
      const up=UPGRADES.find(x=>x.id===id);
      if(!up)return;
      const quote=this.upgradeQuote(up,this.buyQuantity);
      if(!quote.count){this.toast('Ouro insuficiente para essa melhoria.');return;}
      this.state.gold=Math.max(0,this.state.gold-quote.total);
      this.state.upgrades[id]+=quote.count;
      this.renderCore();this.renderPanel();
    }
    skillCost(skill) {
      return Math.max(1,Math.floor(multiply(skill.cost,power(skill.growth,this.state.skills[skill.id]))));
    }
    buySkill(id) {
      const skill=SKILLS.find(x=>x.id===id);
      if(!skill)return;
      const s=this.state;
      if(s.skills[id]>=skill.max || (skill.req && s.skills[skill.req]<skill.reqRank))return;
      const price=this.skillCost(skill);
      if(s.souls<price){this.toast('Almas insuficientes. Renascimentos concedem novas almas.');return;}
      s.souls-=price;s.skills[id]++;
      this.addLog(`A habilidade ${skill.name} alcançou grau ${s.skills[id]}.`,'✧','epic');
      this.renderEverything();
    }
    previewPrestige() {
      const s=this.state;
      if(s.level<15 || s.runKills<100)return 0;
      const base=Math.floor(Math.sqrt(s.runGold/2900)+s.level/12+s.zone*2);
      return Math.max(1,Math.floor(base*(1+s.skills.r4*.12)));
    }
    requestAscension() {
      const gain=this.previewPrestige();
      if(!gain){this.toast('Requer nível 15 e pelo menos 100 abates nesta jornada.');return;}
      this.dialog('Renascer das Cinzas?',`Você receberá ${fmt(gain)} alma(s) permanente(s). Nível, XP, ouro, atributos, melhorias da jornada e regiões serão reiniciados.\n\nEquipamentos, inventário, fragmentos, almas e toda a árvore de habilidades serão preservados.`,[
        {text:'AINDA NÃO'},
        {text:'RENASCER',primary:true,action:()=>this.performAscension(gain)}
      ],'◆');
    }
    performAscension(gain) {
      this.cancelEncounterFX(true);
      const s=this.state;
      s.souls=add(s.souls,gain);
      s.level=1;s.xp=0;s.gold=0;s.zone=0;s.zoneKills=Array(ZONES.length).fill(0);s.zoneProgress=ZONES.map(freshProgress);
      s.farmStage=null;s.farmKills=0;s.lootDryStreak=ZONES.map(()=>0);
      s.attributes=emptyRanks(ATTRIBUTES);s.upgrades=emptyRanks(UPGRADES);s.runKills=0;s.runGold=0;
      this.huntSelection=null;
      s.deadUntil=0;s.heroHp=heroMaxHp(s);
      s.rebirths++;s.event=null;s.mob=freshMob(s);s.nextEnemyAttackAt=now()+enemyAttackInterval(s.mob);s.nextEventAt=now()+this.nextEventDelay();
      this.lastZoneRendered=-1;this.lastEventRendered='';
      this.changeTab('ascension');this.renderEverything();
      this.addLog(`RENASCIMENTO ${s.rebirths}: ${fmt(gain)} almas recebidas.`,'◆','epic');
      this.toast(`Você renasceu e conquistou ${fmt(gain)} almas eternas!`,'epic');
      this.save();
    }
    travelTo(z) {
      const index=validZone(z);
      if(!unlockedZone(this.state,index)){this.toast(`Região bloqueada. Derrote o chefão da área anterior para entrar.`);return;}
      if(index===this.state.zone)return;
      this.cancelEncounterFX(true);
      this.state.zone=index;
      this.state.farmStage=null;this.state.farmKills=0;
      this.huntSelection=null;
      this.state.mob=freshMob(this.state);
      this.state.nextEnemyAttackAt=now()+enemyAttackInterval(this.state.mob);
      this.state.event=null;
      this.state.nextEventAt=now()+this.nextEventDelay();
      this.lastZoneRendered=-1;
      this.addLog(`Você atravessou para ${ZONES[index].name}.`,'⚑','rare');
      this.changeTab('zones');this.renderEverything();this.save();
    }
    setHuntMode(stage) {
      const s=this.state;if(!s)return;
      if(stage!==null && (!Number.isInteger(stage)||stage<1||stage>progressAt(s).stage))return;
      this.cancelEncounterFX(true);
      s.farmStage=stage;s.farmKills=0;s.mob=freshMob(s);
      this.huntSelection=stage;
      s.nextEnemyAttackAt=now()+enemyAttackInterval(s.mob);
      this.addLog(stage===null?'A expedição foi retomada no ponto em que parou.':'Caça iniciada na fase '+stage+'. O avanço da expedição será preservado.','⚑','good');
      this.renderEverything();this.save();
    }
    changeTab(name) {
      if(!TABS.has(name) || !this.state)return;
      this.tab=name;
      for(const btn of document.querySelectorAll('[data-tab]')){
        const active=btn.dataset.tab===name;
        btn.classList.toggle('active',active);
        btn.setAttribute('aria-selected',String(active));
      }
      this.renderPanel();
    }
    renderEverything() {this.renderCore();this.renderPanel();this.renderEvent();}
    renderScene() {
      const s=this.state;
      if(s.zone===this.lastZoneRendered)return;
      const z=ZONES[s.zone];
      $('battlefield').className=`battlefield zone-${s.zone}`;
      text('zoneName',z.name);
      text('zoneSubtitle',z.subtitle);
      text('zoneCrest',z.rune);
      // Battlefield background changes per zone; sprite changes per individual monster.
      this.lastZoneRendered=s.zone;
    }
    resetEnemyHealthTrail() {
      this.enemyHealthTrail?.animation?.cancel();
      this.enemyHealthTrail=null;
    }
    resetHeroHealthTrail() {
      this.heroHealthTrail?.animation?.cancel();
      this.heroHealthTrail=null;
    }
    updateHealthTrail(key,id,ratio,resetTo=null) {
      const previous=this[key],node=$(id),config=FX_CONFIG.healthTrail;
      const motion=config.enabled && !document.hidden && !this.reducedCombatMotion.matches && !document.documentElement.classList.contains('hw-lite');
      if(!motion || !previous || resetTo!==null || ratio>previous.ratio){
        previous?.animation?.cancel();
        fill(id,(motion && resetTo!==null?resetTo:ratio)*100);
        return this[key]={ratio,animation:null,delay:0,duration:0};
      }
      if(previous.ratio===ratio)return previous;
      let delay=config.delayMs;
      let from=node.style.transform || `scaleX(${previous.ratio})`;
      const old=previous.animation;
      if(old){
        if(old.playState!=='finished' && old.playState!=='idle'){
          // Hits in the waiting phase restart its delay; an ongoing fall stays smooth.
          const time=old.currentTime??0;
          if(time<previous.delay)from=previous.from;
          else if(time<previous.delay+previous.duration){
            // Freeze only an interrupted fall, once per hit; no geometry reads.
            old.commitStyles();
            from=node.style.transform;
            delay=0;
          }
        }
        old.cancel();
      }
      fill(id,ratio*100);
      const animation=node.animate([{transform:from},{transform:`scaleX(${ratio})`}],{
        delay,duration:config.durationMs,easing:config.easing,fill:'both'
      });
      const next=this[key]={ratio,animation,delay,duration:config.durationMs,from};
      animation.finished.then(()=>{
        if(this[key]?.animation===animation){
          this[key].animation=null;
          animation.cancel();
        }
      },()=>{});
      return next;
    }
    renderEnemyHealth() {
      const s=this.state,mob=s.mob,previous=this.enemyHealthTrail,stage=combatStage(s);
      const ratio=Math.max(0,Math.min(1,mob.hp/Math.max(1,mob.maxHp)));
      fill('mobHPFill',ratio*100);
      attr('mobHealthProgress','aria-label',`Vida de ${mob.name}`);
      attr('mobHealthProgress','aria-valuenow',String(Math.round(ratio*100)));
      attr('mobHealthProgress','aria-valuetext',`${fmt(Math.ceil(mob.hp))} de ${fmt(mob.maxHp)} pontos de vida`);
      const changed=previous && (previous.mob!==mob || previous.maxHp!==mob.maxHp || previous.zone!==s.zone || previous.stage!==stage);
      const trail=this.updateHealthTrail('enemyHealthTrail','mobHPDamageTrail',ratio,changed?1:null);
      Object.assign(trail,{mob,maxHp:mob.maxHp,zone:s.zone,stage});
    }
    renderHeroHealth(hp,maxHp) {
      const ratio=Math.max(0,Math.min(1,hp/Math.max(1,maxHp))),previous=this.heroHealthTrail;
      fill('heroHPFill',ratio*100);
      const changed=previous && (previous.state!==this.state || previous.maxHp!==maxHp);
      const trail=this.updateHealthTrail('heroHealthTrail','heroHPDamageTrail',ratio,changed?ratio:null);
      Object.assign(trail,{state:this.state,maxHp});
    }
    renderCore() {
      const s=this.state;
      if(!s)return;
      const b=this.bonuses();
      if(this.encounterHold && (this.encounterHold.owner!==s || this.encounterHold.targetMob!==s.mob || s.deadUntil || !this.encounterMotionEnabled()))this.cancelEncounterFX();
      if(!this.encounterHold)this.renderScene();
      text('goldValue',fmt(s.gold));
      text('prestigeValue',fmt(s.souls));
      const points = attributePoints(s);
      $('attributeBadge').textContent = fmt(points);
      $('attributeBadge').hidden = points === 0;
      $('attributeBadge').parentElement.setAttribute('aria-label', `Livro Negro: status e pontos (C). ${fmt(points)} pontos disponíveis`);
      text('fragmentValue',`${s.shards} / 10`);
      text('profileName',s.name);
      text('playerHeroName',s.name);
      attr('playerHeroName','title',s.name);
      text('combatHeroName',s.name);
      attr('heroHealthProgress','aria-label','Vida de '+s.name);
      attr('codexSummary','aria-label','Status de '+s.name);
      text('levelValue',fmt(s.level));
      const required=xpNeeded(s.level);
      text('xpLabel',s.level===MAX_LEVEL?'NÍVEL MÁXIMO':`${fmt(s.xp)} / ${fmt(required)} XP`);
      const pct=s.level>=MAX_LEVEL?100:Math.max(0,Math.min(100,s.xp/required*100));
      fill('xpFill',pct);
      attr('xpProgress','aria-valuenow',String(Math.round(pct)));
      text('clickStat',fmt(b.click,1));
      text('dpsStat',fmt(b.dps,1));
      text('critStat',fmtPercent(b.crit));
      text('luckStat',fmtPercent(b.luck));
      const hp=Math.min(s.heroHp,b.maxHp);
      text('heroHPText',`${fmt(Math.ceil(hp))} / ${fmt(b.maxHp)} HP`);
      this.renderHeroHealth(hp,b.maxHp);
      fill('lifeOrbFill',hp/b.maxHp*100,'Y');
      fill('arenaHPFill',Math.max(0,Math.min(100,hp/b.maxHp*100)));
      $('heroHPFill').classList.toggle('critical',hp/b.maxHp<.26);
      attr('heroHealthProgress','aria-valuenow',String(Math.round(100*hp/b.maxHp)));
      attr('heroHealthProgress','aria-valuetext',`${fmt(Math.ceil(hp))} de ${fmt(b.maxHp)} pontos de vida`);
      const potionKey=`${s.inventory.length}|${s.inventory.filter(x=>x.kind==='potion').map(x=>x.id+':'+x.qty).join(',')}|${deadForPotion(s,b)}`;
      if(this.potionRenderKey!==potionKey){this.potionRenderKey=potionKey;this.renderQuickPotion();}
      this.renderVitalityMood(hp,b.maxHp);
      const regenText=`+${fmt(b.regen,1)}/s`,naturalRegenText=`+${fmt(b.regenNatural,1)}/s`;
      text('heroRegeneration',regenText);
      attr('heroRegeneration','title',`Recuperação atual: ${regenText}. Natural: ${naturalRegenText}.${s.mob.kind==='normal'?'':' A presença de elites limita a cura passiva.'}`);
      text('combatRegen',regenText);
      text('naturalRegen',naturalRegenText);
      text('defenseStat',fmt(b.defense,1));
      text('hpStat',fmt(b.maxHp));
      const dead=Boolean(s.deadUntil);
      prop('attackTarget','disabled',dead);
      prop('heroRespawn','hidden',!dead);
      text('heroRespawnTime',dead?`${Math.ceil(Math.max(0,s.deadUntil-now())/1000)}s`:'');
      $('combatHero').classList.toggle('defeated',dead);
      text('enemyDamage',fmt(enemyHitDamage(s,b.defense)));
      text('rareDropProgress',`${s.lootDryStreak[s.zone]} / ${RARE_DROP_LIMIT} abates ativos`);
      text('enemyAttackCountdown',dead?'PAUSADO':`${(Math.max(0,s.nextEnemyAttackAt-now())/1000).toFixed(1)}s`);
      text('runKills',fmt(s.runKills));
      text('runGold',fmt(s.runGold));
      text('rebirths',fmt(s.rebirths));
      text('runStatus',`JORNADA ${this.roman(Math.min(30,s.rebirths+1))}`);
      text('currentZoneShort',ZONES[s.zone].rune);
      if(this.encounterHold){this.renderEnemyHealth();text('mobHPText',`${fmt(Math.ceil(s.mob.hp))} / ${fmt(s.mob.maxHp)}`);this.renderEvent();return;}
      const phase=progressAt(s),bossKind=s.mob.kind;
      text('mobName',s.mob.name);
      prop('mobName','title',s.mob.name);
      // A save cannot inject an arbitrary src: choose only from our bundled roster.
      const visualIndex = bossKind === 'boss' ? 6 : bossKind === 'miniboss' ? 5
        : Math.max(0, ZONES[s.zone].names.indexOf(s.mob.name));
      const sprite = monsterSrc(s.zone,visualIndex);
      const proportions=ART.monsters[s.zone][visualIndex];
      const arenaNode=$('battlefield');
      if(arenaNode.dataset.monsterSize!==proportions.size)arenaNode.dataset.monsterSize=proportions.size;
      if(arenaNode.dataset.stature!==String(proportions.height)){
        arenaNode.dataset.stature=String(proportions.height);
        arenaNode.style.setProperty('--monster-stature',proportions.height+'%');
      }
      const artNode = $('monsterArt');
      if(artNode.dataset.family!==MONSTER_FAMILIES[s.zone][visualIndex])artNode.dataset.family=MONSTER_FAMILIES[s.zone][visualIndex];
      if (artNode.dataset.sprite !== sprite) {
        this.combatVisuals.get('enemy')?.cancel();
        this.combatVisuals.delete('enemy');
        artNode.dataset.sprite = sprite;
        const portrait = document.createElement('img');
        portrait.src = sprite;
        portrait.width = 300;
        portrait.height = 315;
        portrait.alt = '';
        portrait.draggable = false;
        portrait.decoding = 'async';
        const idle=document.createElement('span');
        idle.className='actor-idle enemy-idle';
        idle.style.setProperty('--idle-delay',(-((visualIndex*.43+s.zone*.71)%(FX_CONFIG.idle.phaseSpreadMs/1000))).toFixed(2)+'s');
        portrait.addEventListener('load',()=>this.cacheCombatNumberAnchors(),{once:true});
        idle.append(portrait);
        this.prepareIdle(idle,portrait);
        artNode.replaceChildren(idle);
      }
      text('mobLevel',bossKind==='boss'?'☠ CHEFÃO':bossKind==='miniboss'?'✦ MINIBOSS':`Nv. ${fmt(s.mob.level)}`);
      const arena = $('battlefield');
      arena.classList.toggle('boss-fight',bossKind==='boss');
      arena.classList.toggle('miniboss-fight',bossKind==='miniboss');
      arena.classList.toggle('final-boss-fight',bossKind==='boss' && s.zone===ZONES.length-1);
      const frame = $('cameraState');
      frame.textContent = bossKind === 'boss' ? (s.zone===ZONES.length-1 ? 'CONFRONTO FINAL' : 'ARENA DE CHEFÃO') :
        bossKind === 'miniboss' ? 'ARENA DE MINIBOSS' : 'COMBATE • 2D';
      const hunting=s.farmStage!=null,stage=combatStage(s),kills=hunting?s.farmKills:phase.kills;
      text('stageNumber',`FASE ${stage} / 10${hunting?' · CAÇA':''}`);
      text('stageKills',hunting?`${kills} / 10 · REPETINDO`:phase.cleared?'REGIÃO CONQUISTADA':bossKind==='boss'?'CHEFÃO FINAL':bossKind==='miniboss'?'MINIBOSS':`${kills} / 10 INIMIGOS`);
      fill('stageProgressFill',!hunting&&phase.cleared?100:kills*10);
      attr('stageProgressTrack','aria-valuenow',String(!hunting&&phase.cleared?100:kills*10));
      for(const bar of $('stagePips').children){
        const n=Number(bar.dataset.stage);
        bar.classList.toggle('completed',!hunting&&(phase.cleared||n<phase.stage));
        bar.classList.toggle('active',(hunting||!phase.cleared)&&n===stage);
      }
      text('intelMob',s.mob.name);
      text('mobHPText',`${fmt(Math.ceil(s.mob.hp))} / ${fmt(s.mob.maxHp)}`);
      this.renderEnemyHealth();
      text('zoneKillsLabel',`${fmt(s.zoneKills[s.zone])} ABATES · FASE ${phase.stage}/10`);
      const rewardScale=bossKind==='boss'?18:bossKind==='miniboss'?7:1;
      text('intelReward',`+${fmt(Math.floor(multiply(rewardGold(s),rewardScale)*b.gold))} ouro · +${fmt(Math.floor(rewardXp(s)*(bossKind==='boss'?14:bossKind==='miniboss'?6:1)))} XP`);
      text('dropChance',fmtPercent(b.drop));
      text('goldBonus',`+${fmtPercent(b.gold-1)}`);
      text('prestigePreview',fmt(this.previewPrestige()));
      text('inventoryCount',s.inventory.length);
      this.renderMilestone();
      this.renderEvent();
      this.renderEncounterFX();
    }
    roman(n) {
      const pairs=[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
      let result='';for(const [a,b] of pairs)while(n>=a){result+=b;n-=a;}
      return result;
    }
    renderMilestone() {
      const s=this.state,p=progressAt(s),z=ZONES[s.zone];
      if(s.farmStage!=null){
        text('milestoneTitle',`Caça · Fase ${s.farmStage}`);
        text('milestoneDescription','A fase se repete para reunir ouro, XP e equipamentos. Retome a expedição pelo painel Regiões.');
      }else if(p.cleared){
        text('milestoneTitle','Região conquistada!');
        text('milestoneDescription',s.zone===ZONES.length-1?'O Imperador caiu. Todas as seis regiões foram conquistadas!':'Você venceu o chefão! A próxima região foi liberada. Volte às regiões anteriores quando quiser.');
      }else if(s.mob.kind==='miniboss'){
        text('milestoneTitle',`✦ MINIBOSS: ${z.miniboss}`);
        text('milestoneDescription','Derrote o guardião da fase 5 para avançar à fase 6. É obrigatório vencê-lo.');
      }else if(s.mob.kind==='boss'){
        text('milestoneTitle',`☠ CHEFÃO: ${z.boss}`);
        text('milestoneDescription','A vitória abre a próxima região automaticamente. Não é possível ignorar o chefão.');
      }else{
        const remaining=ENEMIES_PER_PHASE-p.kills;
        text('milestoneTitle',`Fase ${p.stage} · ${z.name}`);
        text('milestoneDescription',`Faltam ${remaining} inimigo${remaining===1?'':'s'} para ${p.stage===5?'desafiar o miniboss':p.stage===10?'desafiar o chefão':`chegar à fase ${p.stage+1}`}.`);
      }
    }
    renderEvent() {
      const e=this.state?.event,overlay=$('eventOverlay');
      if(!e){if(!overlay.hidden)overlay.hidden=true;this.lastEventRendered='';return;}
      if(e.expiresAt<=now()){this.expireEvent();return;}
      if(overlay.hidden)overlay.hidden=false;
      const key=`${e.type}-${e.expiresAt}`;
      if(this.lastEventRendered!==key){
        text('eventTitle',e.type==='goblin'?'Goblin do Tesouro':'Baú Raro');
        const portrait=document.createElement('img');
        portrait.src=EVENT_ART[e.type==='goblin'?'goblin':'chest'];
        portrait.alt='';portrait.width=256;portrait.height=256;portrait.draggable=false;
        $('eventArt').replaceChildren(portrait);
        attr('eventTarget','aria-label',`Atacar ${e.type==='goblin'?'goblin':'baú'} do evento`);
        this.lastEventRendered=key;
      }
      fill('eventHPFill',Math.max(0,Math.min(100,e.hp/e.maxHp*100)));
      text('eventTime',`${Math.max(0,(e.expiresAt-now())/1000).toFixed(1)}s`);
    }
    renderPanel() {
      if(!this.state)return;
      let html='';
      switch(this.tab){
        case 'upgrades':html=this.renderUpgrades();break;
        case 'inventory':html=this.renderInventory();break;
        case 'zones':html=this.renderZones();break;
        case 'ascension':html=this.renderAscension();break;
      }
      const body=$('tabBody');
      const scroller=$('hudPanelScroll'),top=scroller.scrollTop;
      const focused = body.contains(document.activeElement) ? document.activeElement : null;
      const focusId = focused?.id;
      const focusData = focused ? Object.entries(focused.dataset) : [];
      if(this.lastPanelHTML===html){this.lastPanelRender=now();return;}
      this.lastPanelHTML=html;
      body.innerHTML=html;
      scroller.scrollTop=top;
      const restored = focusId ? document.getElementById(focusId) : focusData.length ? [...body.querySelectorAll('button')].find(b => focusData.every(([k,v]) => b.dataset[k] === v)) : null;
      if (restored && !restored.disabled) restored.focus({preventScroll:true});
      else if (focused) $('hudClose').focus({preventScroll:true});
      this.lastPanelRender=now();
    }
    spendAttribute(id,quantity=this.attributeQuantity) {
      const a = ATTRIBUTES.find(a => a.id === id);
      if (!a || !this.state || ![1,5,10,'all'].includes(quantity)) return;
      const available=attributePoints(this.state),count=quantity==='all'?available:Math.min(quantity,available);
      if(count<1)return;
      this.state.attributes[id]+=count;
      if (id === 'vitality' && !this.state.deadUntil) this.state.heroHp = Math.min(heroMaxHp(this.state), this.state.heroHp + 15*count);
      this.renderCore(); this.renderPanel(); this.save();
    }
    renderAttributes() {
      const s = this.state, points = attributePoints(s);
      return `<section class="attribute-section" aria-label="Distribuição de atributos"><div class="attribute-heading"><div><h2>Escreva seu destino</h2><p>Você recebe 2 pontos por nível. Atributos reiniciam na ascensão.</p></div><strong class="attribute-total">${fmt(points)} <small>PONTOS DISPONÍVEIS</small></strong></div>
        <div class="attribute-quantity quantity-control" role="group" aria-label="Pontos por aplicação"><small>PONTOS POR VEZ</small>${[1,5,10,'all'].map(n=>`<button type="button" class="mini-button ${this.attributeQuantity===n?'selected':''}" data-attribute-qty="${n}" aria-pressed="${this.attributeQuantity===n}">${n==='all'?'MÁX':`x${n}`}</button>`).join('')}<span>O botão aplica até a quantidade disponível.</span></div>
        <div class="attribute-grid">${ATTRIBUTES.map(a=>{const count=this.attributeQuantity==='all'?points:Math.min(this.attributeQuantity,points);return `<article class="attribute-row attribute-${a.id}">${statusIcon({strength:'strength',will:'will',vitality:'health',guard:'defense'}[a.id],'attribute-icon')}<div><strong>${a.name}</strong><small>${a.effect}</small></div><b>${fmt(s.attributes[a.id])}</b><button type="button" data-attribute="${a.id}" aria-label="Adicionar ${count} ponto${count===1?'':'s'} em ${a.name}" ${points<1?'disabled':''}>+${count}</button></article>`;}).join('')}</div></section>`;
    }
    renderUpgrades() {
      return this.renderAttributes() + `<div class="section-headline"><div><h2>Forja &amp; Rituais</h2><p>Invista o ouro conquistado para fortalecer esta jornada. Melhorias básicas reiniciam na ascensão.</p></div><div class="quantity-control"><small>COMPRAR</small>${[1,10,'max'].map(n=>`<button class="mini-button ${this.buyQuantity===n?'selected':''}" data-qty="${n}" type="button">${n==='max'?'MÁX':`x${n}`}</button>`).join('')}</div></div>
      <div class="upgrade-grid">${UPGRADES.map(up=>{
        const rank=this.state.upgrades[up.id],quote=this.upgradeQuote(up,this.buyQuantity);
        const maxed=rank>=MAX_RANK;
        const label=maxed?'MELHORIA MÁXIMA':quote.count?`COMPRAR ${quote.count} · ✦ ${fmt(quote.total)}`:`✦ ${fmt(this.upgradeCost(up))} OURO`;
        return `<article class="upgrade-card"><div class="upgrade-icon">${statusIcon(({strike:'click',ritual:'dps',banner:'gold',focus:'crit',vitality:'health',guard:'defense',recovery:'recovery'})[up.id])}</div><h3 class="upgrade-name">${esc(up.title)}</h3><div class="upgrade-description">${esc(up.desc)}</div><div class="upgrade-rank"><span>NÍVEL <strong>${fmt(rank)}</strong></span><span>${esc(up.effect)}</span></div><button type="button" data-buy="${up.id}" class="buy-button" ${!quote.count?'disabled':''}>${label}</button></article>`;
      }).join('')}</div>`;
    }
    itemStatLines(item) {
      const a=item.stats,lines=[];
      if(a.click)lines.push(`+${fmt(a.click,1)} golpe`);
      if(a.dps)lines.push(`+${fmt(a.dps,1)} DPS`);
      if(a.crit)lines.push(`+${fmtPercent(a.crit)} crítico`);
      if(a.gold)lines.push(`+${fmtPercent(a.gold)} ouro`);
      if(a.luck)lines.push(`+${fmtPercent(a.luck)} sorte`);
      if(a.health)lines.push(`+${fmt(a.health)} vida`);
      if(a.defense)lines.push(`+${fmt(a.defense,1)} defesa`);
      return lines.join(' · ') || 'Poder ancestral';
    }
    itemPower(item) {const a=item.stats;return a.click+a.dps*2+a.crit*150+a.gold*30+a.luck*35+a.health*.16+a.defense*3;}
    renderInventory() {
      const s=this.state;
      const equipment=SLOTS.map(slot=>{
        const item=s.inventory.find(x=>x.id===s.equipment[slot]);
        return `<div class="equip-slot ${item?'':'empty-slot'}">${iconMarkup(itemArt(item,slot),'equip-thumbnail')}<div><small>${SLOT_NAMES[slot].toUpperCase()}</small><strong title="${esc(item?.name||'Vazio')}">${item?esc(item.name):'Vazio'}</strong></div></div>`;
      }).join('');
      const filters=['all',...SLOTS,'material','potion'];
      const filterOptions=filters.map(f=>`<option value="${f}" ${this.inventoryFilter===f?'selected':''}>${f==='all'?'Todos os tipos':f==='material'?'Materiais / sucata':f==='potion'?'Poções':SLOT_NAMES[f]}</option>`).join('');
      const sortOptions=[['new','Mais recentes'],['rarity','Maior raridade'],['power','Maior poder']].map(([key,label])=>`<option value="${key}" ${this.inventorySort===key?'selected':''}>${label}</option>`).join('');
      const items=s.inventory.filter(i=>this.inventoryFilter==='all'||(i.kind==='equipment'?i.slot===this.inventoryFilter:i.kind===this.inventoryFilter)).slice().sort((a,b)=>{
        if(this.inventorySort==='rarity')return RARITIES.findIndex(x=>x.id===b.rarity)-RARITIES.findIndex(x=>x.id===a.rarity);
        if(this.inventorySort==='power')return this.itemPower(b)-this.itemPower(a);
        return b.createdAt-a.createdAt;
      });
      const best=this.bestEquipment(),canImprove=SLOTS.some(slot=>best[slot]!==s.equipment[slot]);
      const sale=this.saleCandidates(),saleValue=sale.reduce((sum,i)=>add(sum,this.itemPrice(i)*i.qty),0),saleUnits=sale.reduce((sum,i)=>sum+i.qty,0);
      const saleOptions=[['low','Sucata e comuns'],...RARITIES.map(r=>[r.id,r.label]),['all','Todos os não equipados']].map(([key,label])=>`<option value="${key}" ${this.sellRarity===key?'selected':''}>${label}</option>`).join('');
      const buff='';
      return `<div class="section-headline"><div><h2>Arsenal de ${esc(s.name)}</h2><p>Raridade e qualidade (1–10) definem o potencial dos equipamentos. Ocupação: ${s.inventory.length}/${MAX_INVENTORY}.</p>${buff}</div></div>
        <div class="arsenal-actions"><button type="button" class="equip-best-button" data-equip-best ${!canImprove?'disabled':''}>⚔ EQUIPAR MELHORES</button><span>Maior poder por slot, pelos atributos reais. Empates mantêm o item equipado.</span></div>
        <div class="equipment-strip">${equipment}</div>
        <div class="inventory-tools"><div class="filter-control"><label for="inventoryFilter">TIPO</label><select class="dark-select" id="inventoryFilter">${filterOptions}</select><label for="inventorySort">ORDEM</label><select class="dark-select" id="inventorySort">${sortOptions}</select></div></div>
        <div class="inventory-sale"><div><label for="inventorySellRarity">TRIBUTO DO SAQUE</label><select class="dark-select" id="inventorySellRarity">${saleOptions}</select></div><button type="button" class="subtle-button" data-sell-bulk ${!sale.length?'disabled':''}>VENDER ${fmt(saleUnits)} · ✦ ${fmt(saleValue)}</button><small>Equipados e poções preservados · confirmação antes de vender</small></div>
        ${items.length?`<div class="inventory-grid">${items.map(item=>{
          const rarity=RARITIES.find(x=>x.id===item.rarity)||RARITIES[1];
          const equipped=item.kind==='equipment'&&s.equipment[item.slot]===item.id;
          const image=itemArt(item);
          const detail=CATALOG_BY_ID.get(item.catalogId);
          const type=item.kind==='equipment'?SLOT_NAMES[item.slot]:item.kind==='potion'?'Poção':'Material';
          return `<article class="item-card rarity-${item.rarity} ${equipped?'equipped':''}"><div class="item-top"><div class="item-glyph">${iconMarkup(image,'item-icon')}</div><div><div class="rarity">${rarity.label} · ${esc(type)}${item.kind==='equipment'?' · QUALIDADE '+(item.quality===null?'ANTERIOR':item.quality+'/10')+' · NV. '+item.level:''}${item.qty>1?' · x'+fmt(item.qty):''}</div><h3>${esc(item.name)}</h3></div></div><div class="item-stats">${item.kind==='equipment'?`<strong class="item-power">PODER ${fmt(this.itemPower(item),1)}</strong>`:''}${item.kind==='equipment'?esc(this.itemStatLines(item)):item.kind==='potion'?'Consumível: restaura vida do herói durante o combate.':'Material comum: pode ser vendido por ouro.'}${detail?`<small class="item-origin">${esc(detail.regiao)}</small>`:''}</div><div class="item-actions">${item.kind==='equipment'?`<button type="button" data-equip="${esc(item.id)}">${equipped?'DESEQUIPAR':'EQUIPAR'}</button>`:item.kind==='potion'?`<button type="button" data-use="${esc(item.id)}">UTILIZAR</button>`:''}<button type="button" data-sell="${esc(item.id)}" ${equipped?'disabled':''}>VENDER · ${fmt(this.itemPrice(item)*item.qty)}</button></div></article>`;
        }).join('')}</div>`:`<div class="empty-state"><div class="empty-glyph">◇</div><strong>Nenhum item nesta categoria</strong>Derrote criaturas para encontrar equipamentos, materiais e poções.</div>`}`;
    }
    renderZones() {
      const s=this.state;
      const active=progressAt(s),hunting=s.farmStage!=null;
      const selected=Math.min(active.stage,Math.max(1,this.huntSelection??s.farmStage??active.stage));
      const hunt=`<section class="hunt-controls" aria-label="Caça e expedição"><div><h3>${hunting?'Caça em andamento':'Prepare sua próxima batalha'}</h3><p>Repita uma fase já alcançada para ganhar ouro, XP e espólios. Seu avanço e os chefes pendentes ficam guardados.</p></div><div class="hunt-actions"><label for="farmStageSelect">FASE DE CAÇA</label><select id="farmStageSelect" class="dark-select">${Array.from({length:active.stage},(_,n)=>`<option value="${n+1}" ${n+1===selected?'selected':''}>Fase ${n+1}</option>`).join('')}</select><button type="button" class="subtle-button" data-start-hunt>${hunting?'TROCAR FASE':'REPETIR FASE'}</button><button type="button" class="subtle-button" data-resume-journey ${hunting?'':'disabled'}>RETOMAR EXPEDIÇÃO</button></div><p class="hunt-loot-note"><strong>${s.lootDryStreak[s.zone]} / ${RARE_DROP_LIMIT}</strong> abates ativos desde o último equipamento raro de qualidade 5+ nesta região. Em até ${RARE_DROP_LIMIT} abates ativos, equipamento raro ou melhor com qualidade mínima 5/10. Sucata: 70% por inimigo comum.</p></section>`;
      return `<div class="section-headline"><div><h2>Mapa das Terras Perdidas</h2><p>Cada região possui 10 fases. Derrote 10 criaturas por fase; vença o miniboss da fase 5 e o chefão da fase 10 para liberar o próximo território.</p></div></div>${hunt}<div class="zone-grid">${ZONES.map((z,index)=>{
        const unlocked=unlockedZone(s,index),current=index===s.zone,p=s.zoneProgress[index];
        const gate=!unlocked?'Derrote o chefão da região anterior':p.cleared?'✦ REGIÃO CONQUISTADA':`FASE ${p.stage}/10 · ${p.kills}/10 INIMIGOS`;
        const progressPercent=p.cleared?100:((p.stage-1)*10+p.kills)*100/100;
        const bossNote=p.cleared?'Chefão derrotado':p.stage===5&&!p.minibossDefeated?'✦ Miniboss na fase 5':p.stage===10?'☠ Chefão na fase 10':'Miniboss F5 · Chefão F10';
        return `<article style="--region-art:url('assets/backgrounds/fast/${['campos-de-cinza','bosque-profanado','criptas-afogadas','fortaleza-de-ferro','fendas-infernais','trono-do-crepusculo'][index]}-mobile.webp?v=dark-14')" class="zone-card ${current?'current':''} ${!unlocked?'locked':''} ${p.cleared?'cleared':''}"><div class="zone-index">${p.cleared?'◆':unlocked?'✧':'♜'} &nbsp; REGIÃO ${z.rune}</div><h3>${esc(z.name)}</h3><p>${esc(z.subtitle)}</p><div class="zone-requirement">${gate}</div><div class="zone-progress-track"><span style="width:${progressPercent}%"></span></div><div class="zone-boss-note">${bossNote}</div><div class="zone-bestiary" aria-label="Bestiário de ${esc(z.name)}">${[...z.names,z.miniboss,z.boss].map((mobName,mobIndex)=>`<button type="button" class="bestiary-creature ${mobIndex>=5?'elite':''} ${/\.(png|webp)$/.test(MONSTER_SPRITES[index][mobIndex])?'original-art':''}" data-inspect-zone="${index}" data-inspect-creature="${mobIndex}" aria-label="Ver ${esc(mobName)}" title="${esc(mobName)}${/\.(png|webp)$/.test(MONSTER_SPRITES[index][mobIndex])?' · Arte personalizada':''}${mobIndex===5?' (Miniboss)':mobIndex===6?' (Chefão)':''}"><img src="${monsterSrc(index,mobIndex)}" width="56" height="60" loading="lazy" alt=""/></button>`).join('')}</div><button type="button" data-travel="${index}" ${!unlocked||current?'disabled':''}>${current?'ATUAL':unlocked?'VIAJAR':'BLOQUEADA'}</button></article>`;
      }).join('')}</div>`;
    }
    renderAscension() {
      const s=this.state,gain=this.previewPrestige(),ready=gain>0;
      const paths=SKILL_PATHS.map(path=>{
        const nodes=SKILLS.filter(x=>x.path===path.id).map((skill)=>{
          const rank=s.skills[skill.id];
          const maxed=rank>=skill.max;
          const locked=Boolean(skill.req && s.skills[skill.req]<skill.reqRank);
          const price=this.skillCost(skill);
          const afford=s.souls>=price;
          const disabled=locked||maxed||!afford;
          const caption=maxed?'DOMINADA':locked?`REQUER ${SKILLS.find(x=>x.id===skill.req).name} ${skill.reqRank}`:`◆ ${fmt(price)} ALMA${price>1?'S':''}`;
          return `<button type="button" class="skill-node ${rank?'unlocked':''} ${locked?'locked':''} ${!disabled?'available':''}" data-skill="${skill.id}" ${disabled?'disabled':''} title="${esc(skill.desc)}"><span class="node-symbol">${skill.icon}</span><span class="node-copy"><strong>${esc(skill.name)} · ${rank}/${skill.max}</strong><span>${esc(skill.desc)}</span><em>${esc(caption)}</em></span></button>`;
        }).join('');
        return `<div class="skill-path path-${path.id}"><div class="skill-path-header"><span class="path-icon">${path.icon}</span><strong>${esc(path.name)}</strong><small>${esc(path.subtitle)}</small></div>${nodes}</div>`;
      }).join('');
      return `<div class="section-headline"><div><h2>O Pacto Eterno</h2><p>Almas persistem entre vidas. Desbloqueie nodos sucessivos e molde seu próprio legado.</p></div><span class="eyebrow">◆ ${fmt(s.souls)} ALMAS DISPONÍVEIS</span></div><div class="ascension-layout"><aside class="ascension-info"><div class="ascension-sigil"><img src="assets/hud/calice-ascensao.png" alt="" width="128" height="128"></div><h3>Renascimento</h3><p>Renasça no nível 1 e receba almas permanentes. Equipamentos e habilidades seguem com você.</p><div class="ascension-gain"><strong>+${fmt(gain)}</strong><span>ALMAS AO RENASCER</span></div><button type="button" class="buy-button ascend-button" data-ascend ${!ready?'disabled':''}>${ready?'INICIAR ASCENSÃO ✧':'ASCENSÃO BLOQUEADA'}</button><div class="ascension-note">${ready?'O cálice aguarda seu juramento.':`Requer nível 15 (${s.level}/15) e 100 abates (${fmt(s.runKills)}/100).`}</div></aside><div class="skill-tree">${paths}</div></div>`;
    }
    inspectMonster(zoneIndex,creatureIndex) {
      if (!Number.isInteger(zoneIndex) || !Number.isInteger(creatureIndex) ||
          zoneIndex<0 || zoneIndex>=ZONES.length || creatureIndex<0 || creatureIndex>6) return;
      const zone=ZONES[zoneIndex];
      const names=[...zone.names,zone.miniboss,zone.boss];
      const creature=names[creatureIndex];
      const rank=creatureIndex===6?'CHEFÃO — FASE 10':creatureIndex===5?'MINIBOSS — FASE 5':'CRIATURA COMUM';
      const isCustom=/\.(png|webp)$/.test(MONSTER_SPRITES[zoneIndex][creatureIndex]);
      this.dialog(creature,`${rank}  ·  ${zone.name}  ·  PORTE ${ART.sizeLabels[ART.monsters[zoneIndex][creatureIndex].size].toUpperCase()}${isCustom?'  ·  ARTE EXCLUSIVA':''}`,[{text:'FECHAR',primary:true}],creatureIndex===6?'☠':creatureIndex===5?'✦':'◇');
      const art=document.createElement('img');
      art.className='dialog-monster-preview';
      art.src=monsterSrc(zoneIndex,creatureIndex);
      art.alt='';
      art.width=260;art.height=274;art.draggable=false;
      $('dialogText').prepend(art);
    }
    onPanelClick(e) {
      if(!this.state)return;
      const b=e.target.closest('button');if(!b||b.disabled)return;
      if(b.dataset.inspectZone!==undefined){this.inspectMonster(Number(b.dataset.inspectZone),Number(b.dataset.inspectCreature));return;}
      if(b.dataset.attribute){this.spendAttribute(b.dataset.attribute);return;}
      if(b.hasAttribute('data-attribute-qty')){this.attributeQuantity=b.dataset.attributeQty==='all'?'all':integer(b.dataset.attributeQty,1,1,10);this.renderPanel();return;}
      if(b.dataset.qty){this.buyQuantity=b.dataset.qty==='max'?'max':integer(b.dataset.qty,1,1,10);this.renderPanel();return;}
      if(b.dataset.buy){this.buyUpgrade(b.dataset.buy);return;}
      if(b.hasAttribute('data-equip-best')){this.equipBestItems();return;}
      if(b.dataset.equip){this.equipItem(b.dataset.equip);return;}
      if(b.dataset.use){this.usePotion(b.dataset.use);return;}
      if(b.dataset.sell){this.sellItem(b.dataset.sell);return;}
      if(b.hasAttribute('data-sell-bulk')){this.requestBulkSale();return;}
      if(b.hasAttribute('data-sell-low')){this.sellLowRarities();return;}
      if(b.hasAttribute('data-start-hunt')){this.setHuntMode(Number($('farmStageSelect').value));return;}
      if(b.hasAttribute('data-resume-journey')){this.setHuntMode(null);return;}
      if(b.dataset.travel!==undefined){this.travelTo(integer(b.dataset.travel));return;}
      if(b.dataset.skill){this.buySkill(b.dataset.skill);return;}
      if(b.hasAttribute('data-ascend')){this.requestAscension();}
    }
  }
  new Game();
})();
