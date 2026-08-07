/**
 * 经济学智库与基础知识数据集 (economicsData.ts)
 * 
 * 涵盖各大主流经济学派系（古典、凯恩斯、奥地利、货币主义、新制度、行为经济学等）
 * 以及微观与宏观经济学核心概念（边际递减效应、机会成本、博弈论、经济周期、资产负债表衰退等），
 * 附带详尽的财报分析与投资实操启示。
 */

export interface EconomicsItem {
  id: string;
  title: string;
  englishTitle: string;
  category: 'SCHOOL' | 'MICRO' | 'MACRO' | 'FINANCE';
  categoryLabel: string;
  representatives: string[];
  era: string;
  coreIdeas: string[];
  detailedDescription: string;
  financialApplication: string; // 财报与投资分析应用场景
  keyQuotes?: string[];
  recommendedBooks?: string[];
  tags: string[];
}

export const ECONOMICS_DATA: EconomicsItem[] = [
  // ==================== 1. 经济学派系 (SCHOOLS) ====================
  {
    id: 'classical-school',
    title: '古典经济学派',
    englishTitle: 'Classical Economics',
    category: 'SCHOOL',
    categoryLabel: '经济学派系',
    representatives: ['亚当·斯密 (Adam Smith)', '大卫·李嘉图 (David Ricardo)', '让-巴蒂斯特·萨伊 (J.B. Say)'],
    era: '18世纪末 - 19世纪中叶（工业革命时期）',
    coreIdeas: [
      '“看不见的手”机制：市场供给与需求通过价格自动调节实现均衡。',
      '自由放任 (Laissez-faire)：反对政府过多干预经济活动。',
      '萨伊定律 (Say\'s Law)：“供给创造其自身的需求”。',
      '比较优势理论：国家根据相对效率分工贸易，实现总体福利最大化。',
      '劳动价值论：商品的价值取决于生产该商品所需的社会必要劳动时间。'
    ],
    detailedDescription: `古典经济学派是现代经济学的基石，诞生于英国工业革命时期。亚当·斯密在1776年出版的《国富论》中奠定了市场经济的理论框架，提出了“看不见的手”，强调个人追求自利能在客观上促进社会整体繁荣。大卫·李嘉图在此基础上完善了自由贸易与比较优势理论，推动了全球化大生产的早期雏形。`,
    financialApplication: `在财报与企业分析中，古典学派的自由竞争与比较优势理论是评估“企业护城河”的基础。分析师可以通过企业的成本结构与毛利率，评估企业是否具备超越行业平均水平的“比较优势”与定价权。`,
    keyQuotes: [
      '“我们期望的晚餐并非来自屠夫、酿酒师或面包师的恩惠，而是来自他们对自身利益的顾及。” —— 亚当·斯密',
      '“自由贸易能使各国生产要素得到最合理的配置。” —— 大卫·李嘉图'
    ],
    recommendedBooks: ['《国民财富的性质和原因的研究》（国富论）', '《政治经济学及赋税原理》'],
    tags: ['自由市场', '看不见的手', '比较优势', '自由放任']
  },
  {
    id: 'keynesian-school',
    title: '凯恩斯主义学派',
    englishTitle: 'Keynesian Economics',
    category: 'SCHOOL',
    categoryLabel: '经济学派系',
    representatives: ['约翰·梅纳德·凯恩斯 (John Maynard Keynes)', '保罗·萨缪尔森 (Paul Samuelson)', '保罗·克鲁格曼 (Paul Krugman)'],
    era: '20世纪30年代（大萧条时期）至今',
    coreIdeas: [
      '有效需求不足：由于边际消费倾向递减、资本边际效率递减及流动性偏好，市场无法自动实现充分就业。',
      '政府干预与逆周期调节：在萧条期通过扩大财政支出（举债建基建）刺激总需求。',
      '乘数效应 (Multiplier Effect)：政府开支的增加会导致国民收入数倍增长。',
      '工资与价格刚性：短期内名义工资和价格难以向下调整，导致市场调节存在滞后与失灵。'
    ],
    detailedDescription: `凯恩斯在1936年发表《就业、利息和货币通论》，打破了古典学派“市场总能自我修复”的迷信。凯恩斯主张在经济衰退期，政府应当扮演“最后借款人”与刺激者角色，通过积极的财政政策与货币宽松来弥补私人投资与消费的不足。`,
    financialApplication: `在宏观研报与周期性行业分析中，凯恩斯主义是理解“逆周期财政刺激”的核心。当政府出台大规模基建投资（如特别国债或消费券）时，建筑、水泥、重型机械及工程机械等顺周期企业的订单和业绩将迎来显著改善。`,
    keyQuotes: [
      '“长期来看，我们都死了 (In the long run, we are all dead)。” —— 凯恩斯',
      '“当私人部门缩减开支时，公共部门必须扩大开支以维持经济平衡。”'
    ],
    recommendedBooks: ['《就业、利息和货币通论》', '《宏观经济学》（萨缪尔森）'],
    tags: ['有效需求', '逆周期调节', '财政政策', '乘数效应', '政府干预']
  },
  {
    id: 'austrian-school',
    title: '奥地利经济学派',
    englishTitle: 'Austrian School of Economics',
    category: 'SCHOOL',
    categoryLabel: '经济学派系',
    representatives: ['卡尔·门格尔 (Carl Menger)', '路德维希·冯·米塞斯 (Ludwig von Mises)', '弗里德里希·哈耶克 (Friedrich Hayek)'],
    era: '19世纪末至今',
    coreIdeas: [
      '主观价值论 (Subjective Value)：商品的价值不取决于生产成本，而取决于消费者对其边际效用的主观评价。',
      '奥地利学派商业周期理论 (ABCT)：央行人为压低利率导致信贷扩张，引发资源“错误投资”(Malinvestment)，最终以经济危机清算的形式爆雷。',
      '分散知识与价格机制：任何中央计划者都无法掌握散落在千百万人头脑中的分散信息，唯有自由价格体系能有效传递信号。',
      '坚决反对通货膨胀与纸币滥发：倡导金本位或竞争性货币制度。'
    ],
    detailedDescription: `奥地利学派强调人的行为（方法论个人主义）与主观选择。米塞斯与哈耶克在20世纪与社会主义计划经济展开了著名的“经济计算大论战”，证明没有自由价格就无法进行合理计算。哈耶克因在商业周期与制度演化方面的卓越贡献获1974年诺贝尔经济学奖。`,
    financialApplication: `奥地利学派的商业周期理论是预测美储/央行加息周期中“资产泡沫破裂”的利器。当长期低利率导致企业盲目杠杆扩张（如高杠杆房企或未盈利科技股），加息周期来临时，这类“错误投资”企业最先面临流动性枯竭与破产清算。`,
    keyQuotes: [
      '“价格是包含分散信息的信号系统。” —— 哈耶克',
      '“通货膨胀本质上是一种隐蔽的掠夺政策。” —— 米塞斯'
    ],
    recommendedBooks: ['《通往奴役之路》', '《人的行为》', '《自由选择》'],
    tags: ['主观价值论', '商业周期理论', '错误投资', '哈耶克', '反对通胀']
  },
  {
    id: 'monetarism-school',
    title: '货币主义学派（芝加哥学派）',
    englishTitle: 'Monetarism / Chicago School',
    category: 'SCHOOL',
    categoryLabel: '经济学派系',
    representatives: ['米尔顿·弗里德曼 (Milton Friedman)', '安娜·施瓦茨 (Anna Schwartz)'],
    era: '20世纪50-80年代（对抗滞胀时期）',
    coreIdeas: [
      '“通货膨胀在任何地方都无一例外是一种货币现象”：过多货币追逐过少商品必然导致物价飞涨。',
      '单一货币规则 (K% Rule)：央行应摒弃复杂的逆周期微调，转而保持货币供应量按照经济增长率固定增长。',
      '自然失业率假说：短期内 Phillips 曲线可能成立，但长期看扩展货币无法降低失业率，只会带来高通胀（滞胀）。',
      '极度推崇自由市场与小政府。'
    ],
    detailedDescription: `弗里德曼通过对美国《货币史》的详尽统计分析，指出1929年大萧条的根源并非市场失灵，而是美联储错误缩减了30%的货币供应量。在70年代西方出现“高通胀+低增长”的滞胀危机后，货币主义一举取代凯恩斯主义成为主导思想。`,
    financialApplication: `分析央行资产负债表（M0/M1/M2 增速）与流动性指标。当 M2 增速持续高于 GDP 增速 + CPI 目标时，过剩的流动性往往会溢出至股市、房地产或大宗商品，驱动资产价格上涨。`,
    keyQuotes: [
      '“通货膨胀在任何时候、任何地方都是一种货币现象。” —— 弗里德曼',
      '“衡量政府政策好坏的标准不是它的意图，而是它的结果。”'
    ],
    recommendedBooks: ['《美国货币史 (1867-1960)》', '《自由选择》'],
    tags: ['货币供应量', 'M2增速', '弗里德曼', '通货膨胀', '滞胀']
  },
  {
    id: 'institutional-school',
    title: '新制度经济学派',
    englishTitle: 'New Institutional Economics',
    category: 'SCHOOL',
    categoryLabel: '经济学派系',
    representatives: ['罗纳德·科斯 (Ronald Coase)', '道格拉斯·诺斯 (Douglass North)', '奥利弗·威廉姆森 (Oliver Williamson)'],
    era: '20世纪60年代至今',
    coreIdeas: [
      '交易成本 (Transaction Cost)：市场交易并非无成本的，搜寻信息、谈判、签约与履约均需消耗成本。',
      '科斯定理 (Coase Theorem)：在交易成本为零时，无论初始产权如何界定，市场交易都能实现资源的最优配置；当交易成本大于零时，产权界定至关重要。',
      '企业的边界：当市场交易成本大于企业内部管理成本时，企业就会替代市场。',
      '制度是经济长期增长的决定性因素。'
    ],
    detailedDescription: `科斯在《企业的性质》(1937) 和《社会成本问题》(1960) 中引入了交易成本与产权分析，极大地拓展了微观经济学。诺斯将制度演变引入宏观经济史，证明建立保护产权、法治与契约精神的制度是西方近代崛起的根本原因。`,
    financialApplication: `在研读平台型企业（如阿里巴巴、腾讯、美团）或垂直一体化公司（如比亚迪全产业链）时，交易成本理论解释了为什么互联网平台能够通过降低全社会撮合交易成本而获得巨大的平台溢价；也解释了垂直整合能否降低供应链摩擦。`,
    keyQuotes: [
      '“如果交易成本为零，产权初始分配就不影响资源配置效率。” —— 科斯',
      '“制度是一个社会的博弈规则。” —— 诺斯'
    ],
    recommendedBooks: ['《企业、市场与法律》', '《制度、制度变迁与经济绩效》'],
    tags: ['交易成本', '科斯定理', '产权明晰', '企业边界', '制度保障']
  },
  {
    id: 'behavioral-school',
    title: '行为经济学派',
    englishTitle: 'Behavioral Economics',
    category: 'SCHOOL',
    categoryLabel: '经济学派系',
    representatives: ['丹尼尔·卡尼曼 (Daniel Kahneman)', '理查德·塞勒 (Richard Thaler)', '阿莫斯·特沃斯基 (Amos Tversky)'],
    era: '20世纪70年代至今',
    coreIdeas: [
      '有限理性 (Bounded Rationality)：人类并非理性的“经济人 (Homo Economicus)”，决策受到心理偏差与认知局限的显著影响。',
      '前景理论 (Prospect Theory)：人们对“损失”的敏感度远高于对“收益”的敏感度（损失厌恶）。',
      '心理账户 (Mental Accounting)：人们在心理上将资金划分为不同来源与用途的账户，非理性地对待同等价值的资金。',
      '羊群效应与过度自信：金融市场中存在追涨杀跌、锚定效应与确认偏误。'
    ],
    detailedDescription: `行为经济学融合了心理学与经济学，打破了新古典派“有效市场假说 (EMH)”的假设。卡尼曼（2002年诺奖得主）与塞勒（2017年诺奖得主）通过大量心理试验揭示了资本市场中各种非理性行为，解释了为何股市频繁出现泡沫与崩盘。`,
    financialApplication: `行为金融学是指导行为投资与逆向投资的明灯。例如，利用“损失厌恶”与“恐慌抛售”，投资者可以在市场因非理性情绪暴跌时寻找被严重低估的优质财报标的（即格雷厄姆的“烟蒂”或巴菲特的“安全边际”）。`,
    keyQuotes: [
      '“人们对于亏损的痛苦感大约是获得同等收益快乐感的 2.5 倍。” —— 卡尼曼',
      '“在别人贪婪时恐惧，在别人恐惧时贪婪。” —— 沃伦·巴菲特'
    ],
    recommendedBooks: ['《思考，快与慢》', '《“错误”的行为》（理查德·塞勒）'],
    tags: ['有限理性', '前景理论', '损失厌恶', '心理账户', '行为金融']
  },

  // ==================== 2. 微观经济基础公理 (MICRO) ====================
  {
    id: 'diminishing-marginal-utility',
    title: '边际递减效应（边际效用/报酬递减）',
    englishTitle: 'Law of Diminishing Marginal Utility & Returns',
    category: 'MICRO',
    categoryLabel: '微观经济基础',
    representatives: ['威廉·斯坦利·杰文斯 (Stanley Jevons)', '卡尔·门格尔 (Carl Menger)', '阿尔弗雷德·马歇尔 (Alfred Marshall)'],
    era: '微观边际革命核心公理',
    coreIdeas: [
      '边际效用递减律：在一定时间内，随着消费者消费某种商品数量的增加，每增加一单位商品所带来的额外效用（满意度）呈递减趋势。',
      '边际报酬递减律：在技术水平和其他生产要素不变的情况下，连续增加同一种可变要素的投入，边际产量达到一定值后会逐步下降。',
      '消费者均衡与厂商最优要素组合。'
    ],
    detailedDescription: `边际递减效应是经济学最基本的公理之一。它解释了为什么吃第一块面包感到无比美味，而吃第五块面包时满意度趋近于零甚至产生反感；也解释了为什么企业在工厂里盲目增加工人数量，最终会导致新增产量效率下降甚至人满为患。`,
    financialApplication: `在企业财报与资本开支 (CapEx) 分析中，边际报酬递减律直接决定了企业扩产的效率。当一家制造型企业盲目扩大产能，或者软件公司过度扩充研发人员时，需要重点观察其单位产出率 (ROIC) 是否因边际递减而出现衰退。`,
    tags: ['边际效用', '边际报酬', '边际成本', 'ROIC衰退', '边际革命']
  },
  {
    id: 'opportunity-cost',
    title: '机会成本与沉没成本',
    englishTitle: 'Opportunity Cost & Sunk Cost',
    category: 'MICRO',
    categoryLabel: '微观经济基础',
    representatives: ['弗里德里希·冯·维塞尔 (Friedrich von Wieser)'],
    era: '微观经济学决策公理',
    coreIdeas: [
      '机会成本：为了选择某种方案而放弃的所有其他方案中价值最高的那一个。',
      '沉没成本：过去已经发生且无法收回的成本，理性的决策不应受沉没成本影响。',
      '边际分析法：比较边际收益 (MR) 与边际成本 (MC)。'
    ],
    detailedDescription: `机会成本是经济学中最重要的决策概念。在资源有限的约束下，选择做某事就意味着放弃做另一件事。而沉没成本则常引发“沉没成本谬误”——人们因为已经在某个失败项目上砸入巨资而舍不得止损，导致损失继续扩大。`,
    financialApplication: `企业财报分析中，评估资本开支 (CapEx) 与 R&D 投资的效率时，必须考虑机会成本。如果企业将资金投入到 ROI 仅 3% 的低效业务，而放弃了还债或回购（收益率 8%），则属于破坏股东价值。同时，在遇到不良资产时，敢于一次性计提资产减值损失（核销沉没成本）通常是企业重新轻装上阵的信号。`,
    tags: ['机会成本', '沉没成本', '边际收益', '决策理性', '资产减值']
  },
  {
    id: 'price-elasticity',
    title: '价格弹性与定价权（需求与供给弹性）',
    englishTitle: 'Price Elasticity of Demand & Supply',
    category: 'MICRO',
    categoryLabel: '微观经济基础',
    representatives: ['阿尔弗雷德·马歇尔 (Alfred Marshall)'],
    era: '微观供求均衡理论',
    coreIdeas: [
      '需求价格弹性 ($E_d$)：价格变动 1% 所引起的需求量变动的百分比。',
      '富有弹性 ($|E_d| > 1$)：降价能增加总收益（薄利多销，如普通电子消费品）。',
      '缺乏弹性 ($|E_d| < 1$)：涨价能增加总收益（强定价权，如高端白酒、胰岛素、专有药）。',
      '交叉价格弹性：判断替代品（为正）与互补品（为负）。'
    ],
    detailedDescription: `马歇尔将弹性概念引入经济学。价格弹性衡量了消费者或生产者对价格变化的敏感程度。缺乏弹性的商品通常具备强烈的刚需属性或不可替代性，这为企业提供了强大的提价空间。`,
    financialApplication: `评估企业的“提价能力 (Pricing Power)”。在通胀或成本上涨周期中，能够顺利向下游客户转嫁成本（产品涨价而销量基本不受影响）的企业具备高定价权与稳健的毛利率，是巴菲特最青睐的防御型标的。`,
    tags: ['价格弹性', '定价权', '毛利率', '巴菲特', '提价能力']
  },
  {
    id: 'economies-of-scale-scope',
    title: '规模经济与范围经济',
    englishTitle: 'Economies of Scale & Scope',
    category: 'MICRO',
    categoryLabel: '微观经济基础',
    representatives: ['亚当·斯密 (Adam Smith)', '阿尔弗雷德·钱德勒 (Alfred Chandler)'],
    era: '工业组织与战略管理理论',
    coreIdeas: [
      '规模经济 (Economies of Scale)：随生产规模扩大，固定成本被摊薄，单位产品成本下降。',
      '范围经济 (Economies of Scope)：利用同一套研发、生产、渠道或品牌生产多种产品，比单独生产成本更低。',
      '规模不经济：当企业过度膨胀导致管理层级过多、效率降低时，单位成本反升。'
    ],
    detailedDescription: `规模经济是制造与重资产行业（如芯片代工、汽车制造、面板）的核心生存法则。钱德勒在《看得见的手》中证明了现代大企业的崛起源于通过规模与范围经济获得无可比拟的成本优势。`,
    financialApplication: `财报分析中观察三费率（销售、管理、研发费用率）随营收增长是否出现显著的摊薄效应（经营杠杆效应）。强规模经济的企业，营收增长 20% 往往能带动净利润增长 40%+。`,
    tags: ['规模经济', '范围经济', '固定成本摊薄', '经营杠杆', '单位成本']
  },
  {
    id: 'veblen-giffen-goods',
    title: '吉芬商品与凡勃伦商品（炫耀性消费与反常需求）',
    englishTitle: 'Giffen Goods & Veblen Goods',
    category: 'MICRO',
    categoryLabel: '微观经济基础',
    representatives: ['索尔斯坦·凡勃伦 (Thorstein Veblen)', '罗伯特·吉芬 (Robert Giffen)'],
    era: '19世纪末消费经济学',
    coreIdeas: [
      '凡勃伦商品 (Veblen Goods)：价格越高，买的人反而越多（如爱马仕、劳力士、限量版超跑），具备炫耀性消费与社交身份属性。',
      '吉芬商品 (Giffen Goods)：价格上涨需求量反而增加的劣等品（如极端大饥荒时期的土豆，收入效应大于替代效应）。'
    ],
    detailedDescription: `这两种现象打破了传统的“需求法则 (价格越高需求越低)”。凡勃伦在《闲暇阶级论》中指出，奢侈品的购买并非为了实用价值，而是为了展示社会地位与炫耀财力。`,
    financialApplication: `奢侈品品牌（LVMH、爱马仕）分析利器。奢侈品企业的定价逻辑完全不同于普通消费品，频繁涨价反而能增强其品牌稀缺感与产品溢价，带来极高的毛利率 (70%+) 与极强的自由现金流。`,
    tags: ['凡勃伦效应', '奢侈品定价', '炫耀性消费', '溢价空间', '反常需求']
  },
  {
    id: 'monopoly-oligopoly',
    title: '护城河与市场结构（完全竞争/垄断/寡头）',
    englishTitle: 'Market Structures & Economic Moat',
    category: 'MICRO',
    categoryLabel: '微观经济基础',
    representatives: ['埃德加·休斯 (Edward Chamberlin)', '约瑟夫·熊彼特 (Joseph Schumpeter)'],
    era: '微观产业组织理论',
    coreIdeas: [
      '完全竞争：无数买方卖方、产品同质，企业无定价权，长期经济利润趋近于零。',
      '垄断竞争：产品有差异化，企业具备一定定价权。',
      '寡头垄断：少数几家巨头垄断市场（如博弈论中的纳什均衡），价格黏性高。',
      '自然垄断与网络效应：边际成本趋于零导致规模报酬递增。'
    ],
    detailedDescription: `市场结构决定了企业的竞争格局与长期盈利能力。熊彼特指出“创造性破坏”是资本主义发展的动力，短暂的垄断是创新的奖励；而巴菲特进一步将具备自然垄断、高转换成本或强网络效应的企业称为拥有“经济护城河”。`,
    financialApplication: `分析企业利润率（毛利率、营业利润率）的持续性。完全竞争行业（如低端纺织）长期 ROE 难以维持在高位；而寡头垄断或高转换成本企业（如高端白酒、操作系统、芯片代工）能长期维持 50%+ 以上的高毛利与强现金流。`,
    tags: ['护城河', '寡头垄断', '网络效应', '定价权', '规模经济']
  },
  {
    id: 'game-theory-nash',
    title: '博弈论与纳什均衡（囚徒困境与价格战）',
    englishTitle: 'Game Theory & Nash Equilibrium',
    category: 'MICRO',
    categoryLabel: '微观经济基础',
    representatives: ['约翰·纳什 (John Nash)', '约翰·冯·诺依曼 (John von Neumann)'],
    era: '20世纪40-50年代（1994诺奖）',
    coreIdeas: [
      '纳什均衡 (Nash Equilibrium)：在给定对手策略的条件下，没有参与者可以通过单方面改变自己的策略来增加收益的状态。',
      '囚徒困境 (Prisoner\'s Dilemma)：个体理性选择导致集体非理性结果（如行业价格战、广告拉锯战）。',
      '重复博弈与默契厮杀：通过长期重复博弈，企业间可能形成隐性默契以维持价格稳定。'
    ],
    detailedDescription: `纳什在1950年证明了非合作博弈中均衡解的存在性。博弈论深刻地改变了微观经济学与企业竞争战略，揭示了在寡头竞争中企业如何评估竞争对手反应。`,
    financialApplication: `在光伏、新能源车或快递行业的价格战分析中，博弈论是解释行业“内卷”与毛利率下行的利器。当行业处于囚徒困境时，降价抢份额是每个企业的占优策略，直到落后产能出清、行业集中度提升并达成新的纳什均衡。`,
    tags: ['博弈论', '纳什均衡', '囚徒困境', '价格战', '行业内卷']
  },
  {
    id: 'information-asymmetry',
    title: '信息不对称（逆向选择与道德风险）',
    englishTitle: 'Information Asymmetry & Adverse Selection',
    category: 'MICRO',
    categoryLabel: '微观经济基础',
    representatives: ['乔治·阿克洛夫 (George Akerlof)', '约瑟夫·斯蒂格利茨 (Joseph Stiglitz)'],
    era: '20世纪70年代（2001诺奖）',
    coreIdeas: [
      '柠檬市场 (Lemon Market)：在二手车等信息不对称市场中，买方因无法识别质量而只愿出平均价，导致好车退出市场，坏车（柠檬）充斥市场（逆向选择）。',
      '道德风险 (Moral Hazard)：在签约之后，拥有信息优势的一方做出损害另一方利益的行为（如投保后不注意防火、管理层盲目扩张牺牲股东利益）。',
      '信号传递 (Signaling) 与 筛选机制 (Screening)。'
    ],
    detailedDescription: `阿克洛夫在1970年发表《柠檬市场》开创了信息经济学。信息不对称解释了为什么许多市场无法实现完全竞争，以及为什么审计机构、信用评级与上市信息披露机制不可或缺。`,
    financialApplication: `财报审计与公司治理 (Corporate Governance) 分析的核心。投资者必须防范管理层的“道德风险”（如大股东抽逃资金、高管造假、违规担保），审计报告的“无保留意见”和独立董事制度就是降低信息不对称的信号传递机制。`,
    tags: ['信息不对称', '逆向选择', '道德风险', '柠檬市场', '公司治理']
  },

  // ==================== 3. 宏观与货币政策 (MACRO) ====================
  {
    id: 'balance-sheet-recession',
    title: '资产负债表衰退与流动性陷阱',
    englishTitle: 'Balance Sheet Recession & Liquidity Trap',
    category: 'MACRO',
    categoryLabel: '宏观与货币政策',
    representatives: ['辜朝明 (Richard Koo)', '约翰·梅纳德·凯恩斯 (John Maynard Keynes)'],
    era: '日本泡沫破裂与大萧条研究',
    coreIdeas: [
      '资产负债表衰退：资产价格暴跌导致企业与居民债务高企，企业目标从“利润最大化”转变为“负债最小化”，集体将收入用于还债而非投资。',
      '流动性陷阱：利率压至零甚至负值，货币政策失效，充沛的资金留在银行系统中循环而无法进入实体经济。',
      '需政府充当“最后借款人”进行大规模财政支出充当接盘者。'
    ],
    detailedDescription: `辜朝明在研究日本“失落的三十年”时提出了资产负债表衰退理论。当资产泡沫破裂（如房地产/股市崩盘），资产缩水而债务刚性，私人部门陷入长期“修复资产负债表”的过程，导致信贷需求死寂。`,
    financialApplication: `评估宏观经济与房地产、银行业财报的窗口。在资产负债表衰退期，居民买房贷款意愿极低，企业缩减资本开支，银行面临“无贷可发”的流动性淤积，高杠杆资产面临长期清算压力。`,
    tags: ['资产负债表衰退', '辜朝明', '流动性陷阱', '去杠杆', '信贷收紧']
  },
  {
    id: 'business-cycles-kondratiev',
    title: '经济周期与康波大周期（康波/朱格拉/库兹涅茨周期）',
    englishTitle: 'Business Cycles & Kondratiev Waves',
    category: 'MACRO',
    categoryLabel: '宏观与货币政策',
    representatives: ['尼古拉·康德拉季耶夫 (Kondratiev)', '约瑟夫·熊彼特 (Schumpeter)', '克莱门特·朱格拉 (Juglar)'],
    era: '宏观经济周期理论',
    coreIdeas: [
      '康波周期 (Kondratiev 50-60年)：由突破性重大科技创新（如蒸汽机、电力、互联网、AI）驱动的长波周期。',
      '库兹涅茨周期 (15-25年)：由房地产与建筑业驱动的建筑周期。',
      '朱格拉周期 (7-10年)：由企业设备投资与资本开支驱动的中周期。',
      '基钦周期 (3-4年)：由企业库存积压与去库存驱动的短周期（库存周期）。'
    ],
    detailedDescription: `熊彼特整合了三大周期，指出经济增长并非平滑增长，而是呈现出“繁荣-衰退-萧条-复苏”的周期性循环。人生与投资发财在很大程度上取决于“康波周期”所赋予的大趋势（“人生发财靠康波”）。`,
    financialApplication: `在大盘择时与周期股（芯片、大宗商品、地产、海运）投资中，分析师通过判断当前处于基钦周期（去库存还是加库存）和朱格拉周期（设备更新开支），精准买在行业周期底部。`,
    tags: ['康波周期', '库存周期', '设备开支', '周期股', '熊彼特']
  },
  {
    id: 'inflation-deflation-stagflation',
    title: '通货膨胀、通货紧缩与滞胀',
    englishTitle: 'Inflation, Deflation & Stagflation',
    category: 'MACRO',
    categoryLabel: '宏观与货币政策',
    representatives: ['欧文·费雪 (Irving Fisher)', '保罗·沃尔克 (Paul Volcker)'],
    era: '宏观价格水平理论',
    coreIdeas: [
      '通货膨胀 (Inflation)：货币购买力下降，物价总水平持续上涨。',
      '通货紧缩 (Deflation)：物价持续下跌，往往伴随着信贷紧缩与债务-通缩恶性循环（费雪债务通缩理论）。',
      '滞胀 (Stagflation)：经济停滞 (Stagnation) 与高通胀 (Inflation) 并存，是凯恩斯主义的噩梦。',
      'CPI / PPI 传导剪刀差。'
    ],
    detailedDescription: `通胀与通紧是宏观经济的体温计。适度的通胀（2%左右）被认为能刺激消费与投资，而通缩会导致消费者延迟购买并引爆债务危机。70年代美联储主席沃尔克通过激进加息至 20% 彻底驯服了高通胀。`,
    financialApplication: `分析企业成本端的 PPI 和消费端的 CPI。当 PPI 大幅高于 CPI 时，上游大宗原材料涨价，中下游企业毛利率受挤压；反之，当 PPI 下降而 CPI 稳定时，中下游企业利润空间扩大。`,
    tags: ['通货膨胀', '通货紧缩', '滞胀', 'CPI/PPI', '费雪债务通缩']
  },
  {
    id: 'monetary-policy-cycle',
    title: '加息/降息、QE/QT 与货币政策传导机制',
    englishTitle: 'Monetary Policy, QE & Transmission Mechanisms',
    category: 'MACRO',
    categoryLabel: '宏观与货币政策',
    representatives: ['本·伯南克 (Ben Bernanke)', '杰罗姆·鲍威尔 (Jerome Powell)'],
    era: '现代央行货币政策实践',
    coreIdeas: [
      '基准利率：央行调控商业银行借贷成本的锚（如联邦基金利率、LPR）。',
      '量化宽松 (QE)：央行在零利率下限时通过在公开市场购买国债/MBS，直接向市场注入流动性。',
      '量化紧缩 (QT)：缩减资产负债表，回收过剩流动性。',
      '收益率曲线倒挂：短期利率高于长期利率，通常是经济衰退的强预警信号。'
    ],
    detailedDescription: `现代央行通过利率窗口、准备金率及公开市场操作三大工具调控宏观流动性。当经济过热、通胀企稳时，央行开启加息周期以收紧流动性；当经济面临下行压力时，通过降息与 QE 刺激借贷与投资。`,
    financialApplication: `货币政策直接影响估值模型中的无风险利率 ($r$) 与折现率 (WACC)。加息周期中，高估值、高债务的科技股与房企折现后现值锐减，面临估值压制；而在降息与宽松周期中，高股息资产与成长股估值空间打开。`,
    tags: ['加息降息', '量化宽松', '资产负债表', '收益率曲线', 'WACC折现']
  },

  // ==================== 4. 金融与国际经济 (FINANCE) ====================
  {
    id: 'efficient-market-hypothesis',
    title: '有效市场假说与黑天鹅效应',
    englishTitle: 'Efficient Market Hypothesis & Black Swan',
    category: 'FINANCE',
    categoryLabel: '金融与国际经济',
    representatives: ['尤金·法玛 (Eugene Fama)', '纳西姆·塔勒布 (Nassim Taleb)'],
    era: '现代金融学与风险理论 (2013诺奖)',
    coreIdeas: [
      '有效市场假说 (EMH)：股票价格反映了所有可获取的信息，没有人能持续战胜市场。分弱式、半强式与强式有效。',
      '黑天鹅事件 (Black Swan)：高度不可预测、影响极其巨大、事后被解释为理所当然的稀有事件。',
      '反脆弱 (Antifragility)：在动荡与黑天鹅事件中不仅不受损，反而从中获利的系统属性。'
    ],
    detailedDescription: `法玛在1970年提出 EMH 奠定了量化投资与指数基金 (ETF) 的基础；而塔勒布在《黑天鹅》与《反脆弱》中严厉批评了假设正态分布的传统金融风控模型，指出极端概率事件才是决定历史进程的关键。`,
    financialApplication: `指导资产配置与风控。一方面解释了为什么买入低成本指数基金 (ETF) 长期收益超越大多数基金经理；另一方面告诫投资者财报分析中必须防范尾部杠杆风险，保留充足的现金流储备以具备“反脆弱”能力。`,
    tags: ['有效市场', '黑天鹅', '反脆弱', '量化投资', '尾部风险']
  },
  {
    id: 'impossible-trinity',
    title: '蒙代尔不可能三角与汇率机制',
    englishTitle: 'Mundell-Fleming Impossible Trinity',
    category: 'FINANCE',
    categoryLabel: '金融与国际经济',
    representatives: ['罗伯特·蒙代尔 (Robert Mundell)', '保罗·克鲁格曼 (Paul Krugman)'],
    era: '国际金融学经典定理 (1999诺奖)',
    coreIdeas: [
      '不可能三角公理：一个国家不可能同时实现以下三目标：\n  1. 资本自由流动 (Capital Mobility)\n  2. 货币政策独立性 (Monetary Independence)\n  3. 汇率稳定性 (Fixed Exchange Rate)',
      '三者只能择其二：例如中国选择“独立货币政策 + 资本管制 + 相对稳定汇率”；美欧选择“资本自由流动 + 独立货币政策 + 浮动汇率”。'
    ],
    detailedDescription: `蒙代尔-弗莱明模型阐明了开放经济下的政策约束。在资本自由流动的环境下，如果一国试图固定汇率，其利率就必须强制紧跟基准国（如美联储），从而丧失了根据本国经济调控利率的独立性。`,
    financialApplication: `跨国企业财报与出海公司分析中，汇率波动对外贸出口企业（汇兑损益、汇率对冲策略）影响巨大。了解不可能三角有助于投资者研判外汇储备变化、人民币/美元汇率走势及跨境资本流动的宏观逻辑。`,
    tags: ['不可能三角', '汇率机制', '资本流动', '外汇储备', '蒙代尔']
  },
  {
    id: 'dcf-wacc-capm',
    title: '现金流折现 (DCF) 与资本资产定价模型 (CAPM)',
    englishTitle: 'Discounted Cash Flow & CAPM / WACC',
    category: 'FINANCE',
    categoryLabel: '金融与国际经济',
    representatives: ['威廉·夏普 (William Sharpe)', '约翰·威廉姆斯 (John Burr Williams)'],
    era: '现代公司金融与估值理论',
    coreIdeas: [
      'DCF 现金流折现：任何资产的价值等于其未来所产生的全部自由现金流 (FCFF) 的现值总和。',
      'CAPM 模型：权益资本成本 $r_e = R_f + \\beta (R_m - R_f)$。',
      '加权平均资本成本 (WACC)：企业债务与股权融资的综合成本，是 DCF 模型中的折现率。',
      '安全边际 (Margin of Safety)：内在价值高于市场价格的安全距离。'
    ],
    detailedDescription: `DCF 是金融估值的终极基石。威廉姆斯在1938年提出股票价值等于未来股利的折现，夏普因提出 CAPM 模型获1990年诺贝尔奖。该模型将无风险利率、风险溢价与企业 Beta 结合，奠定了资本市场资产定价的标准。`,
    financialApplication: `研读财报自由现金流 (Free Cash Flow) 的核心工具。分析师通过计算经营活动现金流净额 minus 资本开支得到自由现金流，并用 WACC 折现，从而算出企业的绝对内在价值，帮助判断当前股价是否被低估。`,
    tags: ['DCF折现', 'WACC', 'CAPM', '自由现金流', '内在价值']
  }
];
