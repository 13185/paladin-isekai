export const CREDIT = "作者：Jack　© Jack 版权所有 · 禁止任何形式转载";

export const SKILLS = {
  slash:  { id: "slash",  name: "十字圣击", cd: 1.05, mp: 0,  desc: "金色十字斩光，单体伤害" },
  heal:   { id: "heal",   name: "圣光速疗", cd: 10,   mp: 16, desc: "圣光洒落，恢复自身 32% 生命" },
  hammer: { id: "hammer", name: "圣裁之锤", cd: 8,    mp: 14, desc: "金锤飞出砸头，眩晕 2 秒" },
  judge:  { id: "judge",  name: "审判之光", cd: 7,    mp: 20, desc: "天降金色印记，高伤并易伤" },
};

export const PLAYER_BASE = {
  name: "罗兰·光誓",
  level: 3,
  maxHp: 128,
  maxMp: 86,
  atk: 18,
  speed: 5.8,
  sprint: 8.8,
};

export const QUEST = {
  id: "ash_camp",
  title: "驱散林间灰烬",
  giver: "aurora",
  steps: [
    { id: "talk",    text: "在喷泉边与奥罗拉交谈" },
    { id: "travel",  text: "前往东边的晨辉林营地" },
    { id: "trash",   text: "击败灰烬狂徒 0/4" },
    { id: "boss",    text: "击败执事·焦喉" },
    { id: "return",  text: "回报奥罗拉" },
  ],
};

export const PORTRAITS = {
  roland:   "./assets/portraits/roland.webp",
  aurora:   "./assets/portraits/aurora.webp",
  lilisika: "./assets/portraits/lilisika.webp",
  ailian:   "./assets/portraits/ailian.webp",
  viola:    "./assets/portraits/viola.webp",
};

export const CGS = {
  lilisika: "./assets/cgs/lilisika-candle.webp",
  hook: "./assets/cgs/hook.webp",
};

const R = (speaker, text, extra = {}) => ({ speaker, text, ...extra });

export const DIALOGUES = {
  aurora_intro: [
    R("奥罗拉·苍角", "乖，到姐姐这儿来。你那身敞开的圣铠……晨誓广场的修女已经告状三次了。", { portrait: "aurora", side: "right" }),
    R("罗兰", "圣光在上，这题我会——通风。信仰也需要透气，对吧？", { portrait: "roland", side: "left" }),
    R("奥罗拉·苍角", "嘴比以前甜多了。广场东边的晨辉林里钻出一群灰烬狂徒，把地脉烤得发烫。预言说要「带光的男人」出马……姐姐本来想自己去的。", { portrait: "aurora", side: "right" }),
    R("罗兰", "带光的男人？巧了，本人不仅带光，还提供售前咨询和售后拥抱。", { portrait: "roland", side: "left" }),
    R("奥罗拉·苍角", "去把他们赶跑。营地里的执事叫焦喉，喜欢朝人脸上喷火星。打完回来，姐姐给你做一次正经的萨满安抚——握手就行。你怎么一脸失望？", { portrait: "aurora", side: "right" }),
    {
      speaker: "奥罗拉·苍角",
      text: "所以？要不要接这单「驱散林间灰烬」？报酬是姐姐的夸奖，外加一点正经经验。",
      portrait: "aurora",
      side: "right",
      choices: [
        { text: "接了。正好让灰烬教团见识一下销冠的售后服务。", next: "aurora_accept" },
        { text: "我先在广场转转，热热身再去。", next: "aurora_later" },
      ],
    },
  ],
  aurora_accept: [
    R("奥罗拉·苍角", "好孩子。沿着东边那条铺满落叶的路走，看见冒黑烟的营地就对了。记得——先看脚底下的红圈，再逞英雄。", { portrait: "aurora", side: "right", effect: "acceptQuest" }),
    R("罗兰", "红圈我懂，策划最爱画的那种。走了，姐姐，回来让你检查我的腰还硬不硬。", { portrait: "roland", side: "left" }),
    R("奥罗拉·苍角", "那是战斗检定。大概。", { portrait: "aurora", side: "right" }),
  ],
  aurora_later: [
    R("奥罗拉·苍角", "去吧。广场上那几位……一位想杀你，一位想吸你，一位已经把悬赏金算进下个月的匕首预算了。别让她们等太久。", { portrait: "aurora", side: "right" }),
  ],
  aurora_progress: [
    R("奥罗拉·苍角", "营地还在冒烟呢。姐姐会在喷泉边等你——活着回来，枕头（腿）借不借另说。", { portrait: "aurora", side: "right" }),
  ],
  aurora_turnin: [
    R("奥罗拉·苍角", "地脉凉下来了。你身上一股焦味，还有……这张从焦喉袍子里掉出来的残页？边缘烧得像情书。", { portrait: "aurora", side: "right", effect: "turnIn" }),
    R("罗兰", "第 37 页的边角？上面怎么还画着一艘会发光的船？原主该不会把禁书当火折子用了吧。", { portrait: "roland", side: "left" }),
    R("艾莉安·月歌", "罗兰·光誓！你又把本王要找的东西弄得脏兮兮的——等等，这纹路……水晶飞船？它不该出现在白冠的天上！", { portrait: "ailian", side: "right" }),
    R("奥罗拉·苍角", "乖，先把经验吃了。至于天上那道慢慢坠落的光……怕是下一章的故事了。", { portrait: "aurora", side: "right", effect: "levelUp" }),
    R("罗兰", "系统提示音我熟：升级，然后扔一个更大的钩子。行吧，钩就钩，反正我已经在这个坑里躺平了。", { portrait: "roland", side: "left", effect: "showHook" }),
  ],
  aurora_done: [
    R("奥罗拉·苍角", "累了就枕一会儿。不是那边，是这边。广场的石砖很凉，姐姐的腿不凉。", { portrait: "aurora", side: "right" }),
    R("罗兰", "这福利比晨誓骑士团的年金实在多了。", { portrait: "roland", side: "left" }),
    R("奥罗拉·苍角", "年金没有，预言有。带光的男人会让高原下雨——你先把白冠的天稳住吧。", { portrait: "aurora", side: "right" }),
  ],
  lilisika: [
    R("莉莉丝卡", "小骑士~圣堂门口坐着一位合法魅魔，你的同事已经绕路走了三圈。今晚的梦，想让姐姐出演吗？", { portrait: "lilisika", side: "right" }),
    R("罗兰", "抱歉，我的梦境排期被三十七笔风流债占满了。不过可以加你为特别嘉宾，包口碑，不包晚安。", { portrait: "roland", side: "left" }),
    R("莉莉丝卡", "加、加嘉宾？！魅惑是综艺节目吗！……不对，这个说法有点新鲜。心形尾巴有点打结，你没看见。", { portrait: "lilisika", side: "right" }),
    R("罗兰", "看见了。打成蝴蝶结了。很可爱。", { portrait: "roland", side: "left" }),
    R("莉莉丝卡", "你、你说我可爱？？？犯规！魅魔不能被说可爱！契约、盖章、吸精气，流程是固定的！", { portrait: "lilisika", side: "right" }),
    {
      speaker: "莉莉丝卡",
      text: "要不这样：圣堂侧廊那排蜡烛还亮着。你敢不敢跟姐姐过去「核对一下契约条款」？",
      portrait: "lilisika",
      side: "right",
      choices: [
        { text: "敢。条款我过目三遍，签字之前先讲清楚违约金。", next: "lilisika_close" },
        { text: "正事优先。灰烬狂徒还在林子里烤地脉。", next: "lilisika_later" },
      ],
    },
  ],
  lilisika_close: [
    R("莉莉丝卡", "跟我来。记得，圣光只准照到蜡烛——再往下照，系统要拉灯了。", { portrait: "lilisika", side: "right", effect: "cgLilisika" }),
    R("莉莉丝卡", "……你、你居然用情商把我讲到翅膀捂脸。这单契约算我暂记，不准跟别的女人说姐姐先破防。", { portrait: "lilisika", side: "right" }),
    R("罗兰", "保密条款加十个金币。销冠的职业素养。", { portrait: "roland", side: "left" }),
  ],
  lilisika_later: [
    R("莉莉丝卡", "工作狂。去吧，打完回来姐姐帮你「补充圣光」——我说的是精气。大概。", { portrait: "lilisika", side: "right" }),
  ],
  lilisika_again: [
    R("莉莉丝卡", "蜡烛还在。条款也还在。你要是再夸我可爱，翅膀真的要把脸包起来了。", { portrait: "lilisika", side: "right" }),
  ],
  ailian: [
    R("艾莉安·月歌", "罗兰·光誓！本王在台阶上等你，可不是来看你跟角牛族大姐姐眉来眼去的！", { portrait: "ailian", side: "right" }),
    R("罗兰", "陛下，您站在逆光里，耳尖粉得像要开花。是彩窗太热，还是——想见我？", { portrait: "roland", side: "left" }),
    R("艾莉安·月歌", "谁、谁想见你！本王是来找第 37 页的！那本不知廉耻的禁书缺了一页，灰烬教团最近满世界收购残页。你是不是又把东西乱塞了！", { portrait: "ailian", side: "right" }),
    R("罗兰", "原主的锅我背，原主的书我找。找到了亲手还给你——陛下是要「逐字逐句销毁」，还是先销毁第 36 页热热身？", { portrait: "roland", side: "left" }),
    R("艾莉安·月歌", "你、你胡说！本王那是审核！……东边营地里有纸灰的味道。你要是敢死在外面，本王就……就 triple 追杀你的墓碑。", { portrait: "ailian", side: "right" }),
    R("罗兰", "收到。活着回来接受酷刑，听起来像约会。", { portrait: "roland", side: "left" }),
    R("艾莉安·月歌", "是酷刑！！", { portrait: "ailian", side: "right" }),
  ],
  ailian_after: [
    R("艾莉安·月歌", "残页在你手里就好。天上那艘船……月宫典籍写过：星角族的方舟不该坠落在人类的天空。本王允许你，暂时活着把这件事查清楚。", { portrait: "ailian", side: "right" }),
    R("罗兰", "陛下准许我活着，我受宠若惊。那准不准我站近一点？光线不够。", { portrait: "roland", side: "left" }),
    R("艾莉安·月歌", "……准许你站半步。再近，法杖不长眼。", { portrait: "ailian", side: "right" }),
  ],
  viola: [
    R("薇欧拉·夜纱", "刺杀目标自己走到阴影里来……省得我爬房梁。你的悬赏金已经够买一把新匕首，外加一瓶假血口红。", { portrait: "viola", side: "right" }),
    R("罗兰", "别急着交货。我的圣光能暖诅咒，匕首能吗？要不要先用手确认一下心跳——职业需要。", { portrait: "roland", side: "left" }),
    R("薇欧拉·夜纱", "……贴这么近会失手的。所以别动，让我失手一次。我是说诅咒。脸上怎么有颜色？我诈尸了？", { portrait: "viola", side: "right" }),
    R("罗兰", "那叫脸红。活人福利，限时体验。", { portrait: "roland", side: "left" }),
    R("薇欧拉·夜纱", "今晚我守夜。守你。很近很近的那种守。你去林子里打架的时候，我会在树上给你数还有几个人敢靠近。", { portrait: "viola", side: "right" }),
  ],
  viola_after: [
    R("薇欧拉·夜纱", "焦喉死了，悬赏令少了一半乐趣。另一半还在——灰烬教团的先知出了更高的价。我暂时不交货。原因保密。", { portrait: "viola", side: "right" }),
    R("罗兰", "原因是不是「他是唯一能用圣光缓解我诅咒的人」？", { portrait: "roland", side: "left" }),
    R("薇欧拉·夜纱", "……你看过我的任务文档？死人不需要感情。但你可以继续说。", { portrait: "viola", side: "right" }),
  ],
};

export function dialogueOf(id) {
  return DIALOGUES[id] || DIALOGUES.aurora_later;
}

export const HOOK_CAPTION = "远方天空中，一艘碎裂的水晶方舟拖着光尾缓缓下沉。第 37 页、灰烬教团，以及尚未露面的星角族……故事才刚掀开一角。";
export const ENDING_TEXT = "灰烬狂徒已散，执事·焦喉倒下。奥罗拉收下那张焦黑残页，艾莉安抬眼望向天边缓缓坠落的水晶方舟。下一章，白冠的天不会再这么金黄了。";

export const LOAD_TIPS = [
  "正在给圣铠开通风口…",
  "正在安抚修女的投诉信…",
  "正在给魅魔的尾巴解蝴蝶结…",
  "正在给灰烬狂徒画红圈…",
  "正在核对第 37 页库存…",
  "正在给圣光充值…",
];
