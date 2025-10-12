#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
角色提示词构筑器

实现思路：
- 固定前缀 → 种族 → 年龄(预留) → 外貌(遍历: 发型/发色(含个性化装饰)/眼睛/胸部/身材) →
  职业(由种族限定) → 服装/盔甲/武器/道具(颜色风格库) → 职业特定表情/姿态 →
  场景氛围(职业×种族判定池) → 镜头构图 → 可选：堕落反义映射（仅替换身份相关部分，外貌保持一致）

输出：CSV（race, identity, role, prompt, seed, corrupted(optional)）

ComfyUI 人物肖像生成器 - 灵活配置版本
用于生成少量人物肖像进行测试
"""

import requests
import json
import csv
import os
import time
import sys
from typing import List, Dict, Any, Tuple
import random

# 设置控制台编码为UTF-8
if sys.platform == "win32":
    import codecs

    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())


BASE_PREFIX = "score_9,score_8_up,score_7_up,source_anime,<lora:Super_Eye_Detailer_By_Stable_Yogi_SDPD0.safetensors:1:0.8>,<lora:add-detail-xl.safetensors:1:1>,<lora:Expressive_H-000001.safetensors:1:0.9>, 1girl, solo"


def get_role_allowed_races(role: str, race_roles: Dict[str, List[str]]) -> List[str]:
    """获取指定职业允许的种族列表"""
    allowed_races = []
    for race, roles in race_roles.items():
        if role in roles:
            allowed_races.append(race)
    return (
        allowed_races if allowed_races else ["人类", "永恒精灵", "黑暗精灵", "狐族"]
    )  # 默认所有种族都可以


def _get_random_hair_style(hair_style_config, hair_length, exclusions):
    """根据头发长度随机选择合适的发型"""
    available_styles = list(hair_style_config.keys())

    # 如果是短发，排除不合适的发型
    if hair_length == "短发":
        available_styles = [
            style for style in available_styles if style not in exclusions
        ]

    if available_styles:
        selected_style = random.choice(available_styles)
        return hair_style_config[selected_style]
    else:
        # 如果没有可用发型，返回默认
        return "straight hair"


def _get_random_hair_style_from_category(hair_style_config, category_key):
    """从发型类别中随机选择一个具体发型"""
    if category_key in hair_style_config:
        category_options = hair_style_config[category_key]
        # 随机选择一个具体发型
        random_style = random.choice(list(category_options.keys()))
        return category_options[random_style]
    else:
        # 如果配置中没有这个类别，随机选择一个类别
        random_category = random.choice(list(hair_style_config.keys()))
        category_options = hair_style_config[random_category]
        random_style = random.choice(list(category_options.keys()))
        return category_options[random_style]


def _get_random_hair_style_from_template(hair_style_config):
    """从模板中随机选择发型（从类别中随机选择）"""
    random_category = random.choice(list(hair_style_config.keys()))
    category_options = hair_style_config[random_category]
    random_style = random.choice(list(category_options.keys()))
    return category_options[random_style]


def _get_random_hair_color_from_template(hair_color_config):
    """从模板中随机选择发色（单色或渐变色）"""
    random_color = random.choice(list(hair_color_config.keys()))
    color_options = hair_color_config[random_color]
    # 50%概率选择单色，50%概率选择渐变色
    if random.random() < 0.5:
        return color_options["solid"]
    else:
        return color_options["gradient"]


def _get_random_hair_color(hair_color_config, color_key):
    """随机选择单色或渐变色"""
    if color_key in hair_color_config:
        color_options = hair_color_config[color_key]
        # 50%概率选择单色，50%概率选择渐变色
        if random.random() < 0.5:
            return color_options["solid"]
        else:
            return color_options["gradient"]
    else:
        # 如果配置中没有这个颜色，随机选择一个主色
        random_color = random.choice(list(hair_color_config.keys()))
        color_options = hair_color_config[random_color]
        if random.random() < 0.5:
            return color_options["solid"]
        else:
            return color_options["gradient"]


def get_template() -> Dict[str, Any]:
    """获取完整的模板"""
    return get_base_template()


def get_base_template() -> Dict[str, Any]:
    """获取基础模板（不包括动态生成的部分）"""
    return {
        "races": {
            "人类": "human girl",
            "永恒精灵": "elf girl, pointy ears, ethereal beauty",
            "黑暗精灵": "dark elf girl, pointy ears, brown skin",
            "狐族": "fox girl, kemonomimi, {hair_color} fox ears, {hair_color} fox tail",
        },
        # 外貌遍历池
        "appearance": {
            "hair_length": {
                "短发": "short hair",
                "中发": "medium hair",
                "长发": "long hair",
            },
            "hair_style": {
                # 所有发型统一抽取
                "直发": "straight hair",
                "卷发": "curly hair",
                "波浪形头发": "wavy hair",
                "蓬发": "disheveled hair",
                "凌乱发型": "messy hair",
                "马尾": "ponytail",
                "双马尾": "twintails",
                "高马尾": "high ponytail",
                "侧马尾": "side ponytail",
                "马尾编发": "braided ponytail",
                "双辫子": "twin braids",
                "辫子刘海": "braided bangs",
                "眼间头发": "hair between eyes",
                "妹妹切": "bob cut",
                "公主切": "hime cut",
                "翼状头发": "hair wings",
                "露额头": "forehead",
                "钻头卷公主卷": "drill hair",
                "包子头": "hair bun",
                "俩包子头": "double bun",
            },
            # 短发需要排除的发型
            "short_hair_exclusions": [
                "马尾",
                "双马尾",
                "高马尾",
                "侧马尾",
                "马尾编发",
                "双辫子",
                "辫子刘海",
                "翼状头发",
                "钻头卷公主卷",
                "包子头",
                "俩包子头",
            ],
            # 独立刘海系统
            "hair_bangs": {
                "无刘海": "",
                "侧扫刘海": "swept bangs",
                "交叉刘海": "crossed bangs",
                "齐刘海": "blunt bangs",
                "空气刘海": "air bangs",
                "长刘海": "long bangs",
                "中分刘海": "centre parting bangs",
                "不对称刘海": "asymmetric bangs",
            },
            "hair_color": {
                # 主色系 - 每个主色都有对应的单色和渐变色
                "金色": {
                    "solid": "blonde",
                    "gradient": "(blonde hair:1.2), blonde to golden gradient",
                },
                "银色": {
                    "solid": "silver",
                    "gradient": "(silver hair:1.2), silver to white gradient",
                },
                "黑色": {
                    "solid": "black",
                    "gradient": "(black hair:1.2), black to dark purple gradient",
                },
                "紫色": {
                    "solid": "purple",
                    "gradient": "(purple hair:1.2), purple to blonde gradient",
                },
                "红色": {
                    "solid": "red",
                    "gradient": "(red hair:1.2), red to orange gradient",
                },
                "白色": {
                    "solid": "white",
                    "gradient": "(white hair:1.2), white to silver gradient",
                },
                "蓝色": {
                    "solid": "blue",
                    "gradient": "(blue hair:1.2), blue to cyan gradient",
                },
                "绿色": {
                    "solid": "green",
                    "gradient": "(green hair:1.2), green to emerald gradient",
                },
                "粉色": {
                    "solid": "pink",
                    "gradient": "(pink hair:1.2), pink to rose gradient",
                },
            },
            "eye_color": {
                "蓝色": "blue",
                "绿色": "green",
                "紫色": "purple",
                "棕色": "brown",
                "粉色": "pink",
                "红色": "red",
                "金色": "golden",
                "彩虹色": "rainbow",
                "心形": "heart-shaped",
            },
            "body_type": {
                "娇小身材": "petite build, small breasts",
                "正常身材": "athletic build, (medium breasts:1.2)",
                "丰满身材": "curvy build, huge breasts",
                # "反差身材": "petite build, huge chest, contrast", 暂时弃用
            },
            # 个性化发饰/细节（从中抽一项叠加到发型旁）
            "hair_accessories": [
                "delicate hair ornament",
                "jeweled hairpin",
                "ribbon",
                "braid detail",
                "silk bow",
                "tiara",
                "flower accessory",
                "feather accent",
                "streaked hair",
                "ahoge",
            ],
        },
        # 种族 → 可选职业（种族直接对应职业列表）
        "race_roles": {
            "人类": [
                # 共通职业
                "法师",
                "医师",
                "吟游诗人",
                # 人类特色职业 - 体现军事霸权和贵族文化
                "骑士",  # 精英骑士，体现军事霸权
                "牧师",  # 圣职者，体现宗教文化
                "女王",  # 统治者
                "公主",  # 皇室成员
                "王后",  # 皇室成员
                "战士",  # 军事人员
                "学者",  # 知识阶层
                "商人",  # 贸易人员
                "盗贼",  # 地下人员
                "教师",  # 教育者
                "女仆",
            ],
            "永恒精灵": [
                # 永恒精灵特色职业 - 体现自然和谐和魔法传承 - 无共通职业
                "德鲁伊",  # 自然魔法使用者
                "游侠",  # 森林守护者
                "祭司",  # 自然信仰者
                "元素使",  # 元素使
                "精灵侍女",  # 精灵侍女
            ],
            "黑暗精灵": [
                # 黑暗精灵特色职业 - 体现黑暗魔法和军事文化
                "奴主",  # 奴隶主
                "女奴",  # 黑暗女奴，类似女仆，但衣着更加暴露，性奴隶
                "血法师",  # 血法师
                "巫灵姐妹",  # 持鞭近战
                "狂战士",  # 狂战士，暴露盔甲
                "暗影刺客",  # 暗影刺客
            ],
            "狐族": [
                # 共通职业
                "医师",
                "吟游诗人",
                # 狐族特色职业 - 体现神信仰和贸易文化
                "巫女",  # 九尾神信仰者
                "姬武士",  # 狐族武士
                "领主",  # 狐族领主
                "海贼",  # 海上劫掠者
                "船长",  # 狐族船长
                "歌妓",  # 狐族歌妓
            ],
        },
        # 职业配置（融合成套服装+武器道具等为一条：attire_sets，每条≥10个tags）
        "role_profiles": {
            # ========== 共通职业 ==========
            "法师": {
                "palette": "silver-blue color scheme, white-gold color scheme, violet color scheme, arcane purple scheme",
                "attire_sets": [
                    {
                        "name": "奥术华服",
                        "normal": "transparent silk robes, revealing arcane garments, wizard fascinator, ornate staff, spellbook, glowing runes, sheer gloves, exposed sash, jeweled pendant, mystical accessories, floating crystals, magic circles",
                    },
                    {
                        "name": "绣纹法袍",
                        "normal": "revealing mage attire, sheer embroidered robe, arcane sigils, crystal staff, floating grimoire, cropped velvet cape, lace inner layers, rune earrings, waist chains, talisman necklace, seductive arcane jewelry, spell pouches",
                    },
                    {
                        "name": "大法术师套装",
                        "normal": "alluring sorceress set, sheer satin robe, gilded trims, ornate wand, tome with clasps, slit brocade cape, beaded cords, gemstone rings, arcane brooch, spell components, provocative mystical ornaments, ritual accessories",
                    },
                    {
                        "name": "星象法袍",
                        "normal": "seductive stargazer robes, cosmic patterns, constellation staff, astral grimoire, celestial jewelry, sheer night-sky cloak, silver threads, moon pendant, star earrings, divination tools, alluring astral ornaments, telescope accessory",
                    },
                ],
                "expressions": ["mysterious", "calm", "focused"],
                "poses": ["casting", "meditating", "reading"],
                "bg_natural": ["moonlit grove", "silver forest", "ancient ruins"],
                "bg_building": ["magical academy", "stellar tower", "library"],
                "lighting": ["moonlight", "starlight", "magical light"],
                "atmosphere": ["mystical", "magical"],
            },
            "医师": {
                "palette": "medical white color scheme, green-white color scheme, healing green scheme",
                "attire_sets": [
                    {
                        "name": "医师白袍",
                        "normal": "alluring healer robes, revealing medical sash, herb pouch, healing crystals, bandages, medicine bottles, treatment tools, white gloves, medical choker, healing accessories, provocative therapeutic ornaments, healing crystal pendant",
                    },
                    {
                        "name": "治疗师装",
                        "normal": "seductive apothecary dress, cropped linen apron, herb satchel, healing potions, medical instruments, leather gloves, healing amulet, treatment kit, medicinal accessories, alluring care ornaments, mortar and pestle",
                    },
                    {
                        "name": "草药师服",
                        "normal": "revealing herbalist outfit, botanical patterns, plant guide, herb scissors, collection basket, dried herbs, essence vials, nature jewelry, green ribbons, healing charm, alluring natural healer ornaments, flower crown",
                    },
                ],
                "expressions": ["gentle", "focused", "caring"],
                "poses": ["healing pose", "standing", "examining"],
                "bg_natural": ["sacred garden", "herb garden"],
                "bg_building": ["village", "healing house", "herbalist hut"],
                "lighting": ["sunlight", "soft light"],
                "atmosphere": ["peaceful", "warm"],
            },
            "吟游诗人": {
                "palette": "rainbow color scheme, colorful scheme, vibrant multi-color scheme",
                "attire_sets": [
                    {
                        "name": "吟游装束",
                        "normal": "seductive bard outfit, revealing colorful cloak, musical instrument, feathered hat, slit performance costume, song sheets, lute strings, artistic accessories, performance jewelry, alluring entertainer ornaments, decorative bells, silk scarves",
                    },
                    {
                        "name": "艺术家服",
                        "normal": "alluring artist attire, cropped paint-stained apron, creative tools, parchment scroll, color palette, brushes, artistic beret, leather bag, inspiration choker, creative accessories, seductive bohemian ornaments, ink bottles",
                    },
                    {
                        "name": "歌舞表演装",
                        "normal": "provocative performer dress, flowing ribbons, hand drums, tambourine, dance veils, jingling anklets, performance makeup, stage jewelry, colorful sashes, entertainment props, alluring showman accessories, feather fans",
                    },
                ],
                "expressions": ["artistic", "smiling", "cheerful"],
                "poses": ["performing pose", "standing", "dancing"],
                "bg_natural": ["village square"],
                "bg_building": ["village", "tavern", "marketplace", "playhouse"],
                "lighting": ["sunlight", "stage light"],
                "atmosphere": ["peaceful", "lively"],
            },
            # ========== 人类特色职业 ==========
            "骑士": {
                "palette": "white-gold color scheme, white-silver color scheme, blue-gold color scheme, royal knight scheme",
                "attire_sets": [
                    {
                        "name": "骑士纹章装",
                        "normal": "torn plate armor, heraldic cut-out surcoat, ornate shield, rapier, cape, plume helm, waist straps, engraved vambraces, silk scarf, crest medallion, alluring chivalric accessories, sword belt",
                    },
                    {
                        "name": "比武甲饰",
                        "normal": "revealing tournament armor, polished cuirass, lance, buckler, sash, embroidered cape, plume, signet ring, scabbard, chain belt, seductive knight ornaments, tournament favor",
                    },
                    {
                        "name": "神圣卫甲",
                        "normal": "revealing holy plate, divine armor, ceremonial gear, longsword, blessed shield, sacred sigil, slit tabard, chain belt, silk lining, cape, alluring sanctified accessories, holy reliquary",
                    },
                    {
                        "name": "光辉骑誓",
                        "normal": "seductive paladin set, polished mail, greatsword, reliquary, heraldic cape, white gloves, sash, brooch, circlet, prayer book, alluring holy ornaments, blessed pendant",
                    },
                ],
                "expressions": ["confident", "serious", "noble"],
                "poses": ["combat stance", "standing", "praying"],
                "bg_natural": ["sacred garden", "starlit plains"],
                "bg_building": ["cathedral", "royal palace", "castle"],
                "lighting": ["sunlight", "divine light"],
                "atmosphere": ["divine", "romantic", "epic"],
            },
            "牧师": {
                "palette": "silver-blue color scheme, white-gold color scheme, holy white scheme",
                "attire_sets": [
                    {
                        "name": "圣职礼装",
                        "normal": "revealing holy vestments, slit blessed robes, ceremonial attire, gilded crosier, holy symbol, rosary beads, sheer stole, embroidered trim, reliquary pendant, lace gloves, provocative sacred accessories, incense thurible",
                    },
                    {
                        "name": "神圣典仪",
                        "normal": "divine ceremonial set, sheer luminous robe, golden embroidery, sacred bible, prayer book, beaded rosary, ribboned waist chain, veil fascinator, signet ring, halo accessory, alluring sanctified ornaments, holy water vessel",
                    },
                    {
                        "name": "祝福法衣",
                        "normal": "alluring blessed vestments, white silk robes, golden cross, sacred chalice, holy texts, ceremonial candles, silver chains, divine jewelry, prayer shawl, sacred relics, seductive clerical ornaments, blessing oils",
                    },
                ],
                "expressions": ["calm", "gentle", "serene"],
                "poses": ["casting", "meditating", "praying", "blessing"],
                "bg_natural": ["sacred garden", "starlit plains"],
                "bg_building": ["cathedral", "lunar temple", "chapel"],
                "lighting": ["moonlight", "starlight", "divine light"],
                "atmosphere": ["divine", "romantic", "peaceful"],
            },
            "女王": {
                "palette": "white-gold color scheme, royal purple color scheme, imperial crimson scheme",
                "attire_sets": [
                    {
                        "name": "王室礼服",
                        "normal": "revealing royal gown, jeweled tiara, royal scepter, cropped velvet mantle, slit court dress, silver embroidery, royal waist chain, lace gloves, crown jewels, pearl earrings, seductive regal accessories, orb of power",
                    },
                    {
                        "name": "统治华装",
                        "normal": "alluring sovereign attire, golden circlet, ceremonial rod, revealing brocade robe, royal insignia, sheer silk lining, jeweled clasp, formal gloves, royal choker, court ornaments, provocative majestic accessories, throne cushion",
                    },
                    {
                        "name": "帝国华服",
                        "normal": "seductive imperial regalia, ornate crown, royal scepter, revealing ermine cape, sheer silk gown, golden embroidery, jeweled waist chain, royal rings, lace gloves, pearl choker, alluring imperial ornaments, royal seal",
                    },
                    {
                        "name": "威严龙袍",
                        "normal": "alluring dragon robe, imperial crown, jade scepter, phoenix embroidery, slit silk train, golden threads, royal brooch, ceremonial bracers, signet ring, court jewelry, provocative sovereign accessories, dragon motifs",
                    },
                ],
                "expressions": ["elegant", "majestic", "commanding"],
                "poses": ["sitting regally", "walking gracefully", "commanding pose"],
                "bg_natural": ["royal gardens"],
                "bg_building": ["royal palace", "palace garden", "throne room"],
                "lighting": ["sunlight", "chandelier light"],
                "atmosphere": ["regal", "luxurious"],
            },
            "公主": {
                "palette": "rose-gold color scheme, pastel pink scheme, fairy tale scheme",
                "attire_sets": [
                    {
                        "name": "公主裙装",
                        "normal": "revealing princess gown, delicate tiara, slit fairy tale dress, silk ribbons, lace trim, pearl accessories, satin gloves, flower crown, jeweled brooch, court slippers, alluring innocent ornaments, butterfly pins",
                    },
                    {
                        "name": "花园礼服",
                        "normal": "seductive garden dress, floral tiara, sheer pastel gown, ribbon waist chain, embroidered flowers, pearl choker, lace gloves, hair ribbons, delicate jewelry, garden accessories, provocative youthful ornaments, rose bouquet",
                    },
                    {
                        "name": "舞会华服",
                        "normal": "alluring ballroom gown, sparkling tiara, revealing elegant dress, silk fan, dance invitation, pearl necklace, satin slippers, elbow gloves, jeweled hairpin, lace petticoat, seductive noble ornaments, masquerade mask",
                    },
                ],
                "expressions": ["elegant", "innocent", "cheerful"],
                "poses": ["walking gracefully", "dancing", "sitting elegantly"],
                "bg_natural": ["flower garden"],
                "bg_building": ["castle", "palace garden", "great hall"],
                "lighting": ["sunlight", "soft light"],
                "atmosphere": ["romantic", "dreamy"],
            },
            "王后": {
                "palette": "royal purple color scheme, deep crimson scheme, elegant burgundy scheme",
                "attire_sets": [
                    {
                        "name": "后冠华服",
                        "normal": "alluring consort gown, ornate crown, revealing royal mantle, slit ceremonial dress, golden embroidery, royal jewels, silk gloves, court waist chain, regal choker, formal accessories, seductive queenly ornaments, royal fan",
                    },
                    {
                        "name": "宫廷盛装",
                        "normal": "provocative court regalia, jeweled diadem, revealing state robe, slit formal gown, silver threading, royal brooch, ceremonial bracers, court gloves, pendant choker, palace jewelry, alluring dignified accessories, scepter ornament",
                    },
                    {
                        "name": "典仪后服",
                        "normal": "seductive ceremonial attire, queen's crown, revealing velvet robe, imperial train, precious gems, golden chains, silk undergarments, royal rings, pearl jewelry, court accessories, alluring majestic ornaments, ermine trim",
                    },
                ],
                "expressions": ["elegant", "majestic", "dignified"],
                "poses": ["sitting regally", "standing gracefully"],
                "bg_natural": [],
                "bg_building": ["royal palace", "palace garden", "court hall"],
                "lighting": ["sunlight", "royal lighting"],
                "atmosphere": ["regal", "dignified"],
            },
            "战士": {
                "palette": "steel-red color scheme, battle-worn scheme, iron-blood scheme",
                "attire_sets": [
                    {
                        "name": "纹章钢甲",
                        "normal": "torn plate armor, revealing chainmail, cut-out surcoat, longsword, scabbard, banner tassels, metal gorget, waist straps, exposed gauntlets, crest brooch, provocative battlefield accessories, war horn",
                    },
                    {
                        "name": "典仪武备",
                        "normal": "alluring warrior gear, polished breastplate, engraved pauldrons, greatsword, dagger, cloak clasp, slit heraldic tabard, belt chains, thigh straps, cape, seductive knightly ornaments, weapon maintenance kit",
                    },
                    {
                        "name": "重装战甲",
                        "normal": "revealing heavy armor, reinforced plate, battle axe, shield, war banner, metal boots, armored gloves, sword belt, combat accessories, warrior insignia, alluring militant ornaments, victory medals",
                    },
                ],
                "expressions": ["confident", "serious", "cold", "fierce"],
                "poses": ["combat stance", "standing", "battle ready"],
                "bg_natural": ["battlefield"],
                "bg_building": ["royal palace", "castle", "training grounds"],
                "lighting": ["sunlight", "flame light"],
                "atmosphere": ["epic", "intense"],
            },
            "学者": {
                "palette": "white-silver color scheme, blue-gold color scheme, scholarly brown scheme",
                "attire_sets": [
                    {
                        "name": "学院书装",
                        "normal": "transparent scholar robes, revealing academic gown, library attire, books, quill, scroll case, ribbon bookmarks, spectacles, chain necklace, cuffed sleeves, alluring scholarly accessories, ink well",
                    },
                    {
                        "name": "研究者套衫",
                        "normal": "seductive researcher set, tailored robe, ink-stained cuffs, notebook, feather quill, document tube, seal wax, lace collar, velvet ribbon, chain satchel, alluring academic ornaments, research notes",
                    },
                    {
                        "name": "典籍管理装",
                        "normal": "alluring librarian attire, scholarly vest, revealing chemise, archive tools, catalog books, magnifying lens, leather gloves, reading spectacles, book strap, academic jewelry, seductive intellectual ornaments, library seal",
                    },
                    {
                        "name": "魔法学者装",
                        "normal": "arcane researcher attire, mystical robes, ancient tome, relic analysis tools, magic detection devices, archaeological notes, cryptic symbols, enchanted spectacles, mystic jewelry, esoteric accessories, divination instruments, rune decoder",
                    },
                    {
                        "name": "历史学家装",
                        "normal": "historian outfit, archive robes, chronicle scrolls, ancient maps, historical artifacts, dating equipment, preservation tools, period jewelry, academic medals, legacy ornaments, timeline charts, restoration kit",
                    },
                    {
                        "name": "炼金学者装",
                        "normal": "alchemical scholar attire, laboratory coat, experimental apparatus, chemical formulas, transmutation circles, element samples, catalyst vials, safety goggles, measuring tools, formula notes, mystical compounds, philosopher's research",
                    },
                ],
                "expressions": ["calm", "gentle", "focused", "thoughtful"],
                "poses": ["meditating", "standing", "reading", "writing"],
                "bg_natural": ["ancient ruins"],
                "bg_building": ["magical academy", "library", "study room"],
                "lighting": ["sunlight", "candlelight"],
                "atmosphere": ["peaceful", "scholarly"],
            },
            "商人": {
                "palette": "gold-brown color scheme, obsidian-purple color scheme, wealthy emerald scheme",
                "attire_sets": [
                    {
                        "name": "行商精饰",
                        "normal": "revealing merchant attire, tight traveling gear, silk garments, coin pouch, ledger, signet ring, scarf, satchel, chain purse, seal stamp, alluring trade accessories, merchant scales",
                    },
                    {
                        "name": "商旅华装",
                        "normal": "seductive caravan finery, tailored vest, sheer silk chemise, ledger book, quill case, coin strings, lace gloves, brooch, necklace, belt chain, alluring refined ornaments, trade contract",
                    },
                    {
                        "name": "富商礼服",
                        "normal": "alluring wealthy attire, luxurious fabrics, jeweled accessories, money bag, business documents, seal ring, silk tie, golden chains, expensive jewelry, trade goods, seductive prosperity ornaments, merchant badge",
                    },
                    {
                        "name": "黑市商人装",
                        "normal": "underground trader outfit, concealed goods, smuggling pouches, illegal trade items, secret contacts list, coded ledger, hidden compartments, black market tokens, contraband seals, shadowy business tools, forbidden merchandise, discrete accessories",
                    },
                    {
                        "name": "海商巨贾装",
                        "normal": "maritime merchant attire, naval trade robes, shipping manifests, fleet documents, exotic goods, overseas treasures, sea charts, port authority seals, maritime jewelry, ocean trade badges, import certificates, cargo samples",
                    },
                    {
                        "name": "珠宝商装",
                        "normal": "jeweler outfit, luxurious display cloak, precious gems, appraisal tools, magnifying loupe, gemstone catalog, artisan accessories, fine metal work, certification documents, collector's items, masterwork jewelry, authenticity seals",
                    },
                ],
                "expressions": ["gentle", "smiling", "confident"],
                "poses": ["standing", "daily life pose", "negotiating"],
                "bg_natural": [],
                "bg_building": ["village", "marketplace", "tavern", "trading post"],
                "lighting": ["sunlight", "warm light"],
                "atmosphere": ["peaceful", "busy"],
            },
            "盗贼": {
                "palette": "obsidian-purple color scheme, dark color scheme, shadow-black scheme",
                "attire_sets": [
                    {
                        "name": "暗影皮装",
                        "normal": "tight leather armor, revealing cloak, hood, dagger, shortsword, lockpicks, throwing knives, belt chains, fingerless gloves, face veil, provocative stealth accessories, rope coil",
                    },
                    {
                        "name": "潜行者套装",
                        "normal": "seductive shadow outfit, fitted leathers, hidden blades, smoke vials, grappling hook, soft boots, wrist sheath, chain belt, cloak pin, shadow emblem, alluring rogue ornaments, thieves' tools",
                    },
                    {
                        "name": "夜行者装",
                        "normal": "alluring burglar gear, dark leather suit, face mask, climbing tools, lock picks, stolen jewels, silent boots, arm bracers, utility belt, stealth accessories, seductive criminal ornaments, dark vision potion",
                    },
                    {
                        "name": "飞贼怪盗装",
                        "normal": "phantom thief attire, acrobatic gear, silk grappling rope, calling card, rooftop running shoes, dramatic cloak, gentleman thief accessories, heist plans, escape routes, theatrical ornaments, signature mask, trophy collection",
                    },
                    {
                        "name": "刺客杀手装",
                        "normal": "assassin outfit, deadly hidden blades, poison vials, contract scrolls, target dossiers, silent kill tools, shadow walk accessories, death dealer ornaments, blood payment coins, elimination proof, lethal jewelry, quick escape gear",
                    },
                    {
                        "name": "宝藏猎人装",
                        "normal": "treasure hunter gear, adventure outfit, treasure maps, ancient puzzle tools, trap detection devices, excavation equipment, relic containers, expedition accessories, discovery journals, fortune seeker ornaments, archaeological tools, mystery solver kit",
                    },
                ],
                "expressions": ["cold", "mysterious", "sly"],
                "poses": ["sneaking", "standing", "crouching"],
                "bg_natural": ["dark forest"],
                "bg_building": ["village", "tavern", "alleyway"],
                "lighting": ["moonlight", "shadow"],
                "atmosphere": ["mysterious", "tense"],
            },
            "教师": {
                "palette": "academy blue color scheme, blue-white color scheme, scholarly beige scheme",
                "attire_sets": [
                    {
                        "name": "教师套装",
                        "normal": "transparent scholar robes, revealing academic gown, library attire, books, quill, scroll case, ribbon bookmarks, spectacles, chain necklace, cuffed sleeves, alluring scholarly accessories, pointer stick",
                    },
                    {
                        "name": "学院制服",
                        "normal": "revealing academy robes, sheer scholarly robe, slit formal dress, graduation cap, textbooks, quill pen, ink bottle, academic medal, school badge, educational jewelry, provocative scholarly accessories, lesson scrolls",
                    },
                    {
                        "name": "讲师装束",
                        "normal": "seductive educator attire, scholarly chemise, fitted robe, teaching materials, chalk, slate eraser, student records, reading spectacles, academy emblem, academic jewelry, alluring intellectual ornaments, attendance scroll",
                    },
                    {
                        "name": "贵族导师装",
                        "normal": "noble tutor attire, refined teaching robes, etiquette manuals, aristocratic lesson plans, deportment tools, cultural education materials, high society accessories, sophisticated jewelry, elegant teaching aids, nobility crest, refinement ornaments, grace training implements",
                    },
                    {
                        "name": "魔法导师装",
                        "normal": "magical instructor outfit, enchanted teaching robes, spell demonstration wand, talent assessment crystals, magic training tools, mana control devices, arcane lesson scrolls, mystical teaching aids, power development accessories, magical education badges, potential awakening gems, spell practice orbs",
                    },
                    {
                        "name": "战术教官装",
                        "normal": "military instructor gear, tactical teaching uniform, strategy boards, combat training manual, war game pieces, drill equipment, tactical maps, battlefield simulation tools, training whistle, military medals, discipline ornaments, rank insignia",
                    },
                ],
                "expressions": ["focused", "gentle", "encouraging"],
                "poses": ["teaching pose", "standing", "explaining"],
                "bg_natural": [],
                "bg_building": ["village", "library", "study chamber"],
                "lighting": ["sunlight", "study light"],
                "atmosphere": ["peaceful", "educational"],
            },
            "女仆": {
                "palette": "white-black color scheme, classic maid scheme",
                "attire_sets": [
                    {
                        "name": "女仆制服",
                        "normal": "revealing maid robes, sheer white apron, short black dress, lace headband, thigh-high stockings, leather slippers, feather duster, cleaning supplies, service bell, uniform accessories, seductive domestic ornaments, tea tray",
                    },
                    {
                        "name": "管家装束",
                        "normal": "alluring head maid attire, cropped formal apron, slit long dress, service cap, white gloves, hourglass pendant, key ring, silver tray, service brooch, service accessories, provocative professional ornaments, duster",
                    },
                    {
                        "name": "侍女礼服",
                        "normal": "seductive servant outfit, elegant apron, revealing robes, lace trim, serving gloves, tea set, cleaning tools, service badge, polished slippers, domestic jewelry, alluring housekeeping ornaments, feather duster",
                    },
                    {
                        "name": "战斗女仆装",
                        "normal": "battle maid outfit, armored apron, concealed weapons, protective serving gear, combat cleaning tools, defensive accessories, guard maid badge, tactical service equipment, warrior servant ornaments, battle-ready slippers, protection jewelry, fighting stance ready",
                    },
                    {
                        "name": "魔法女仆装",
                        "normal": "magical maid attire, enchanted apron, cleaning spell wand, convenience magic tools, household charm accessories, arcane domestic implements, magical service badge, spell-aided cleaning gear, mystical servant ornaments, enchanted slippers, mana-infused jewelry, quick-clean magic",
                    },
                    {
                        "name": "贵族侍女装",
                        "normal": "aristocratic servant outfit, luxury maid dress, high-class service tools, social event accessories, noble etiquette implements, elegant serving ware, sophisticated service badge, refined slippers, aristocratic jewelry, banquet assistance tools, grace ornaments, formal event gear",
                    },
                ],
                "expressions": ["gentle", "smiling", "obedient"],
                "poses": ["standing", "serving pose", "cleaning pose"],
                "bg_natural": [],
                "bg_building": ["village", "manor", "castle"],
                "lighting": ["sunlight", "indoor light"],
                "atmosphere": ["peaceful", "domestic"],
            },
            # ========== 永恒精灵特色职业 ==========
            "德鲁伊": {
                "palette": "silver-green color scheme, green-brown color scheme, natural earth scheme",
                "attire_sets": [
                    {
                        "name": "自然法袍",
                        "normal": "sheer druidic robes, revealing nature garb, cropped ranger cloak, oak staff, vine adornments, glowing leaves, waist satchel, wooden talisman, bead necklace, exposed nature charms, feather accents, herbal pouches",
                    },
                    {
                        "name": "林地祭司",
                        "normal": "alluring forest priestess set, slit leaf-embroidered mantle, braided cords, carved staff, seed pouch, bark wristbands, moss trim, antler pin, woven belt chain, exposed herbal kit, sensual natural trinkets, flower garland",
                    },
                    {
                        "name": "野性守护装",
                        "normal": "seductive wildkeeper attire, animal fur trim, revealing green robes, nature staff, crystal orbs, living vines, wooden jewelry, leaf crown, earth tones, natural gems, alluring primal ornaments, ritual stones",
                    },
                    {
                        "name": "月光德鲁伊装",
                        "normal": "lunar druid attire, moonlit robes, celestial staff, star-blessed ornaments, night blooming flowers, silvery vines, lunar crystals, moon phase jewelry, twilight accessories, nocturnal beast companions, ethereal natural ornaments, astral leaf crown",
                    },
                    {
                        "name": "图腾守护装",
                        "normal": "totem guardian outfit, tribal druid robes, spirit animal totems, ancestral staff, shamanic accessories, beast spirit ornaments, primal power symbols, wilderness tribe jewelry, nature spirit bonds, animal communion tools, sacred ritual items, wilderness wisdom gems",
                    },
                    {
                        "name": "季节祭司装",
                        "normal": "seasonal priest attire, four seasons robes, cycle staff, spring blossoms, summer fruits, autumn leaves, winter frost, seasonal transition accessories, nature cycle jewelry, harvest blessings, renewal ornaments, eternal cycle symbols, season守护 gems",
                    },
                ],
                "expressions": ["mysterious", "calm", "gentle"],
                "poses": ["casting", "meditating", "communing with nature"],
                "bg_natural": ["moonlit grove", "silver forest", "ancient ruins"],
                "bg_building": ["lunar temple"],
                "lighting": ["moonlight", "starlight", "magical light"],
                "atmosphere": ["mystical", "magical", "peaceful", "natural"],
            },
            "游侠": {
                "palette": "silver-green color scheme, green-brown color scheme, dark-green color scheme, forest hunter scheme",
                "attire_sets": [
                    {
                        "name": "林行者装束",
                        "normal": "revealing ranger outfit, cropped forest cloak, leather armor, bow, quiver, hunter tools, thigh strap, bracers, hood, chain utility pouches, trail accessories, hunting knife",
                    },
                    {
                        "name": "荒野斥候",
                        "normal": "alluring scout set, slit green mantle, reinforced leathers, shortbow, arrow case, knife, arm guard, cropped waterproof cloak, rope, map tube, seductive ranger ornaments, compass",
                    },
                    {
                        "name": "精灵猎手",
                        "normal": "seductive elven hunter attire, revealing leaf armor, longbow, enchanted arrows, tracking tools, forest camouflage, arm bracers, hunter's belt, nature accessories, animal trophies, alluring wilderness ornaments, tracking runes",
                    },
                    {
                        "name": "月夜游侠装",
                        "normal": "night ranger outfit, moonlight camouflage, silver bow, star arrows, nocturnal tracking tools, shadow步 accessories, lunar beast companion, night vision gear, twilight hunter ornaments, silent moonlight arrows, darkness navigation tools, celestial tracking runes",
                    },
                    {
                        "name": "兽王游侠装",
                        "normal": "beast master ranger attire, animal companion gear, creature communication totem, taming tools, beast bond accessories, wildlife alliance symbols, alpha pack leader ornaments, nature harmony jewelry, creature召唤 implements, beast training gear, animal friendship tokens, wild bond runes",
                    },
                    {
                        "name": "古树守卫装",
                        "normal": "ancient guardian attire, world tree protector robes, elder wood bow, sacred grove arrows, forest defender gear, tree spirit accessories, millennium wood ornaments, nature sanctum守護 badge, eternal forest jewelry, life tree connection, elder protection runes, ancient wisdom gems",
                    },
                ],
                "expressions": ["cold", "focused", "alert"],
                "poses": ["combat stance", "sneaking", "aiming"],
                "bg_natural": [
                    "moonlit grove",
                    "silver forest",
                    "ancient ruins",
                    "dark forest",
                    "starlit plains",
                ],
                "bg_building": ["village"],
                "lighting": ["moonlight", "sunlight", "dappled light"],
                "atmosphere": ["epic", "natural"],
            },
            "祭司": {
                "palette": "silver-blue color scheme, white-gold color scheme, violet color scheme, ethereal light scheme",
                "attire_sets": [
                    {
                        "name": "神圣祭司装",
                        "normal": "revealing priestess robes, sheer ceremonial vestments, sacred symbols, ritual scepter, prayer beads, divine accessories, mystical ornaments, spiritual jewelry, ceremonial sash, sacred pendant, alluring divine accessories, incense burner",
                    },
                    {
                        "name": "自然祭司服",
                        "normal": "alluring nature priestess set, slit druidic robes, vine adornments, sacred totem, nature talismans, leaf crown, earth tones, natural jewelry, forest accessories, spiritual energy, seductive natural ornaments, ritual herbs",
                    },
                    {
                        "name": "月光祭司装",
                        "normal": "seductive lunar priestess attire, revealing silver robes, crescent scepter, crescent jewelry, starlight crystals, celestial ornaments, ethereal fabrics, divine symbols, ritual tools, lunar accessories, alluring mystical ornaments, moon phase charts",
                    },
                    {
                        "name": "星辰祭司装",
                        "normal": "stellar priestess outfit, cosmic robes, constellation scepter, star map jewelry, meteor dust accessories, galaxy ornaments, celestial ritual tools, astral prophecy scrolls, space divination implements, stellar blessing gems, cosmos connection symbols, universe wisdom artifacts",
                    },
                    {
                        "name": "生命祭司装",
                        "normal": "life priestess attire, vitality robes, healing scepter, life force crystals, renewal accessories, rebirth ornaments, eternal spring jewelry, regeneration tools, nature's blessing implements, life cycle gems, creation symbols, vitality blessing artifacts",
                    },
                    {
                        "name": "灵魂祭司装",
                        "normal": "spirit priestess outfit, ethereal robes, soul scepter, spirit communication tools, afterlife guidance accessories, reincarnation ornaments, soul vessel jewelry, spiritual journey implements, ancestor connection gems, spirit world symbols, soul blessing artifacts, otherworld bridge tools",
                    },
                ],
                "expressions": ["mysterious", "calm", "gentle", "serene"],
                "poses": ["casting", "meditating", "praying", "ritual"],
                "bg_natural": ["moonlit grove", "silver forest", "sacred garden"],
                "bg_building": ["lunar temple", "cathedral", "shrine"],
                "lighting": ["moonlight", "starlight", "divine light"],
                "atmosphere": ["mystical", "magical", "divine", "peaceful"],
            },
            "元素使": {
                "palette": "elemental multi-color scheme, prismatic energy scheme, arcane rainbow scheme",
                "attire_sets": [
                    {
                        "name": "烈焰元素装",
                        "normal": "revealing fire mage robes, flame patterns, crimson-orange fabrics, fire orb, flame crystals, burning runes, ash cloak, ember jewelry, phoenix feather, heat wave effects, lava stone pendant, inferno accessories, blazing aura",
                    },
                    {
                        "name": "寒冰元素装",
                        "normal": "seductive ice mage attire, frost patterns, azure-white fabrics, ice orb, frozen crystals, snowflake ornaments, icy cape, glacier jewelry, frost crown, blizzard effects, diamond pendant, winter accessories, freezing aura",
                    },
                    {
                        "name": "大地元素装",
                        "normal": "alluring earth mage set, stone patterns, brown-green fabrics, earth orb, crystal geodes, mountain runes, rocky accessories, jade jewelry, stone crown, tremor effects, emerald pendant, nature accessories, grounding aura",
                    },
                    {
                        "name": "疾风元素装",
                        "normal": "revealing wind mage robes, swirl patterns, cyan-white fabrics, wind orb, air crystals, feather ornaments, flowing cape, silver jewelry, wing accessories, tornado effects, sapphire pendant, storm accessories, swift aura",
                    },
                    {
                        "name": "雷电元素装",
                        "normal": "seductive lightning mage attire, bolt patterns, purple-gold fabrics, thunder orb, electrum crystals, lightning runes, charged cape, plasma jewelry, storm crown, electric effects, topaz pendant, thunder accessories, shocking aura",
                    },
                    {
                        "name": "自然元素装",
                        "normal": "alluring nature mage set, leaf patterns, forest-green fabrics, nature orb, life crystals, vine ornaments, moss cape, wooden jewelry, flower crown, growth effects, peridot pendant, druidic accessories, vitality aura",
                    },
                ],
                "expressions": ["mysterious", "focused", "powerful"],
                "poses": ["casting", "channeling", "meditating"],
                "bg_natural": ["elemental plane", "ancient ruins", "magical nexus"],
                "bg_building": ["magical academy", "elemental tower"],
                "lighting": ["elemental glow", "magical light", "aurora"],
                "atmosphere": ["mystical", "powerful", "elemental"],
            },
            "精灵侍女": {
                "palette": "silver-white color scheme, elegant pastel scheme, elven grace scheme",
                "attire_sets": [
                    {
                        "name": "精灵仆从装",
                        "normal": "revealing elven servant dress, elegant apron, delicate fabric, silver trim, service accessories, graceful ornaments, leaf patterns, silk ribbons, refined jewelry, serving tray, alluring domestic ornaments, elven embroidery",
                    },
                    {
                        "name": "森林侍女服",
                        "normal": "seductive woodland attendant attire, nature-inspired robes, green and silver colors, service tools, elegant gloves, leaf accessories, natural jewelry, refined apron, graceful ornaments, forest motifs, alluring servant accessories, flower crown",
                    },
                    {
                        "name": "月光侍女装",
                        "normal": "alluring lunar servant outfit, revealing silver dress, moon patterns, ethereal fabrics, service implements, elegant accessories, celestial jewelry, silk gloves, refined ornaments, moonlight motifs, seductive attendant accessories, star pins",
                    },
                    {
                        "name": "宫廷精灵侍女装",
                        "normal": "royal elven servant attire, courtly grace dress, noble service tools, aristocratic etiquette implements, high elf protocol accessories, refined serving ware, royal court badge, sophisticated jewelry, palace servant ornaments, noble family crests, aristocratic elegance symbols, court ceremony tools",
                    },
                    {
                        "name": "魔法精灵侍女装",
                        "normal": "magical elven maid outfit, enchanted service robes, spell-casting apron, magical housekeeping wand, arcane cleaning tools, mystical service accessories, mana-infused jewelry, ethereal servant badge, spell-aided implements, magical convenience ornaments, enchantment gems, arcane service symbols",
                    },
                    {
                        "name": "战斗精灵侍女装",
                        "normal": "combat elven attendant gear, warrior servant dress, concealed elven blades, protective service armor, guard maid accessories, defensive serving tools, combat-ready jewelry, warrior servant badge, tactical housekeeping implements, fighting attendant ornaments, protection runes, battle-maid symbols",
                    },
                ],
                "expressions": ["gentle", "elegant", "serene"],
                "poses": ["standing", "serving pose", "graceful pose"],
                "bg_natural": ["silver forest", "moonlit grove"],
                "bg_building": ["elven manor", "palace garden"],
                "lighting": ["moonlight", "soft light"],
                "atmosphere": ["peaceful", "elegant"],
            },
            # ========== 黑暗精灵特色职业 ==========
            "奴主": {
                "palette": "obsidian-purple color scheme, dark crimson scheme, dominance black-red scheme",
                "attire_sets": [
                    {
                        "name": "奴主华装",
                        "normal": "revealing dominatrix attire, dark leather corset, commanding whip, slave chains, authority symbols, spiked accessories, power jewelry, dark cape, control collar, dominance tools, alluring mistress ornaments, slave brand",
                    },
                    {
                        "name": "黑暗统治装",
                        "normal": "seductive overlord outfit, exposing dark armor, domination scourge, slave leash, power chains, cruel jewelry, authority badge, spiked bracers, dominance accessories, control symbols, provocative ruler ornaments, punishment tools",
                    },
                    {
                        "name": "暗影女王装",
                        "normal": "alluring dark queen attire, revealing shadow robes, obsidian crown, cruel scepter, slave collar collection, dark gemstones, commanding jewelry, power symbols, control accessories, domination tools, seductive tyrant ornaments, throne chains",
                    },
                    {
                        "name": "痛苦女神装",
                        "normal": "pain goddess attire, torment priestess robes, suffering scepter, agony infliction tools, torture implements, sadistic accessories, pain amplification gems, cruelty symbols, victim tears vials, dominance torture devices, merciless ornaments, torment altar tools",
                    },
                    {
                        "name": "灵魂收割装",
                        "normal": "soul harvester outfit, spirit capture robes, soul-drinking chalice, essence extraction tools, life force draining accessories, soul gem collection, spirit binding implements, dark reaper ornaments, mortality theft devices, essence prison jewelry, soul trade symbols, death dealer tools",
                    },
                    {
                        "name": "黑暗大祭司装",
                        "normal": "dark high priestess attire, unholy matriarch robes, corrupted blessing scepter, demon pact scrolls, forbidden ritual tools, dark deity symbols, infernal jewelry, cult leader ornaments, blasphemous accessories, evil sanctification implements, dark faith gems, corruption spread tools",
                    },
                ],
                "expressions": ["cold", "commanding", "cruel"],
                "poses": ["standing dominantly", "commanding pose"],
                "bg_natural": ["dark cavern"],
                "bg_building": ["dark palace", "dungeon"],
                "lighting": ["torch light", "purple glow"],
                "atmosphere": ["dark", "oppressive"],
            },
            "女奴": {
                "palette": "obsidian-purple color scheme, submissive scheme, dark revealing scheme",
                "attire_sets": [
                    {
                        "name": "奴隶装束",
                        "normal": "extremely revealing slave outfit, minimal dark fabric, slave collar, chains, submission symbols, exposed skin, restraints, obedience jewelry, servant accessories, humiliation marks, provocative slave ornaments, brand mark",
                    },
                    {
                        "name": "侍奉女奴装",
                        "normal": "seductive servant slave attire, barely-there clothing, service collar, leash attachment, submission chains, exposing fabrics, slave jewelry, obedience symbols, serving accessories, restraint marks, alluring submissive ornaments, ankle chains",
                    },
                    {
                        "name": "暗影奴装",
                        "normal": "alluring dark slave outfit, revealing bondage attire, heavy collar, connecting chains, submission tattoos, exposing leather, slave brands, restraint jewelry, servitude symbols, marking accessories, seductive captive ornaments, wrist shackles",
                    },
                    {
                        "name": "娱乐奴装",
                        "normal": "pleasure slave attire, entertainment collar, seductive minimal clothing, performance chains, dance accessories, provocative jewelry, service bells, entertainment marks, alluring captive ornaments, pleasure symbols, submission ribbons, entertainment tools",
                    },
                    {
                        "name": "战奴角斗装",
                        "normal": "gladiator slave outfit, arena collar, minimal combat gear, battle chains, fighter accessories, combat slave marks, entertainment warrior attire, crowd pleasing ornaments, battle entertainment jewelry, slave fighter symbols, arena captive tools, spectacle chains",
                    },
                    {
                        "name": "矿奴劳工装",
                        "normal": "labor slave attire, work collar, minimal protection gear, mining chains, labor tools, work slave marks, exploitation symbols, toil accessories, forced labor jewelry, mining captive ornaments, servitude work tools, exhaustion marks",
                    },
                ],
                "expressions": ["submissive", "fearful", "obedient"],
                "poses": ["kneeling", "serving pose", "submissive pose"],
                "bg_natural": [],
                "bg_building": ["dark palace", "dungeon", "slave quarters"],
                "lighting": ["dim light", "torch light"],
                "atmosphere": ["oppressive", "dark"],
            },
            "血法师": {
                "palette": "blood-red color scheme, crimson-black scheme, hemomancy scheme",
                "attire_sets": [
                    {
                        "name": "血术法袍",
                        "normal": "revealing blood mage robes, crimson fabrics, blood chalice, ritual knife, sacrificial bowl, dark grimoire, blood jewelry, hemomancy symbols, curse accessories, dark power gems, alluring sinister ornaments, blood vials",
                    },
                    {
                        "name": "暗血仪装",
                        "normal": "seductive hemomancer attire, exposing dark robes, blood orbs, ritual dagger, cursed tome, sacrifice tools, crimson chains, dark magic jewelry, blood runes, necromantic accessories, provocative forbidden ornaments, bone charms",
                    },
                    {
                        "name": "献祭者装",
                        "normal": "alluring sacrificer outfit, revealing ceremonial robes, corrupted chalice, ritual blade, offering bowl, dark spell components, crimson jewelry, sacrifice symbols, curse accessories, blood magic tools, seductive dark ornaments, skull ornaments",
                    },
                    {
                        "name": "吸血贵族装",
                        "normal": "vampiric noble attire, blood aristocracy robes, life-draining chalice, immortality accessories, eternal youth jewelry, blood feast implements, vampire nobility ornaments, crimson court symbols, undead aristocrat tools, blood pact gems, immortal elegance, fanged ornaments",
                    },
                    {
                        "name": "死灵血巫装",
                        "normal": "necro-hemomancer outfit, death and blood robes, soul-blood fusion chalice, undead summoning tools, corpse blood accessories, necromantic hemomancy symbols, death magic jewelry, blood resurrection implements, zombie blood ornaments, undeath life-force gems, reanimation blood tools, corpse manipulation accessories",
                    },
                    {
                        "name": "血契魔女装",
                        "normal": "blood pact witch attire, demon contract robes, infernal blood chalice, devil bargain tools, hellish blood accessories, demonic pact symbols, infernal jewelry, blood summoning implements, devil deal ornaments, hellfire blood gems, corruption contract tools, demon binding blood accessories",
                    },
                ],
                "expressions": ["cold", "cruel", "focused"],
                "poses": ["casting", "ritual pose", "channeling"],
                "bg_natural": ["blood altar"],
                "bg_building": ["dark temple", "ritual chamber"],
                "lighting": ["blood-red glow", "dark light"],
                "atmosphere": ["sinister", "dark", "ominous"],
            },
            "巫灵姐妹": {
                "palette": "obsidian-purple color scheme, witch-purple scheme, dark mystic scheme",
                "attire_sets": [
                    {
                        "name": "巫灵战装",
                        "normal": "revealing witch armor, exposing dark leather, spirit whip, cursed blade, soul gems, dark magic accessories, combat jewelry, witch symbols, spirit chains, battle ornaments, alluring mystic warrior accessories, hex pouches",
                    },
                    {
                        "name": "黑魔战服",
                        "normal": "seductive dark witch attire, minimal battle armor, enchanted whip, shadow dagger, curse totems, combat magic tools, dark jewelry, witch markings, spirit accessories, battle charms, provocative sorceress ornaments, spell components",
                    },
                    {
                        "name": "姐妹会战袍",
                        "normal": "alluring coven warrior outfit, revealing ritual armor, twin blades, spirit lash, dark magic focus, sisterhood symbols, combat accessories, witch jewelry, curse tools, battle ornaments, seductive cult ornaments, bonding runes",
                    },
                    {
                        "name": "复仇女巫装",
                        "normal": "vengeance witch attire, retribution robes, curse whip, hex blades, revenge magic tools, grudge symbols, vendetta accessories, punishment jewelry, wrath implements, fury ornaments, justice curse tools, payback magic gems",
                    },
                    {
                        "name": "灵媒巫师装",
                        "normal": "spirit medium witch outfit, ghost communication robes, séance whip, ectoplasm blades, spirit channeling tools, otherworld symbols, medium accessories, phantom jewelry, ghost binding implements, spirit world ornaments, afterlife connection tools, spectral magic gems",
                    },
                    {
                        "name": "诅咒编织装",
                        "normal": "curse weaver attire, hex crafting robes, malediction whip, curse-forging blades, jinx creation tools, bane symbols, hex weaving accessories, curse jewelry, affliction implements, bad luck ornaments, doom crafting tools, curse amplification gems",
                    },
                ],
                "expressions": ["cold", "mysterious", "fierce"],
                "poses": ["combat stance", "casting", "whipping pose"],
                "bg_natural": ["dark forest", "cursed grove"],
                "bg_building": ["dark temple", "coven hideout"],
                "lighting": ["purple glow", "moonlight", "witch fire"],
                "atmosphere": ["dark", "mystical", "menacing"],
            },
            "狂战士": {
                "palette": "blood-red color scheme, feral scheme, rage crimson scheme",
                "attire_sets": [
                    {
                        "name": "狂怒战甲",
                        "normal": "revealing berserker armor, exposing battle gear, massive axe, skull trophies, blood-stained weapons, feral accessories, rage symbols, minimal protection, battle scars, war paint, alluring savage ornaments, chain decorations",
                    },
                    {
                        "name": "野蛮战装",
                        "normal": "seductive savage attire, barely-there armor, brutal weapons, bone ornaments, blood accessories, feral jewelry, war trophies, tribal markings, combat scars, rage symbols, provocative warrior ornaments, tooth necklace",
                    },
                    {
                        "name": "血怒装备",
                        "normal": "alluring bloodrage outfit, exposing combat gear, twin axes, skull accessories, battle trophies, frenzy symbols, savage jewelry, war paint, minimal armor, brutal ornaments, seductive berserker accessories, blood runes",
                    },
                    {
                        "name": "暗影狂怒装",
                        "normal": "shadow berserker attire, dark rage armor, void-touched weapons, nightmare trophies, shadow frenzy symbols, dark fury jewelry, abyssal war paint, corruption ornaments, void battle scars, darkness rage accessories, shadow madness runes, abyss warrior tools",
                    },
                    {
                        "name": "兽化狂战装",
                        "normal": "beast transformation gear, primal rage armor, bestial weapons, animal transformation symbols, wild fury accessories, feral shift jewelry, beast form war paint, savage mutation ornaments, animal rage scars, predator fury tools, beast soul runes, transformation berserker implements",
                    },
                    {
                        "name": "痛苦狂徒装",
                        "normal": "pain berserker outfit, agony-fueled armor, torture weapons, suffering trophies, pain transcendence symbols, masochistic fury jewelry, blood war paint, torment endurance ornaments, pain immunity scars, suffering power tools, agony strength runes, torture warrior accessories",
                    },
                ],
                "expressions": ["fierce", "angry", "wild"],
                "poses": ["combat stance", "charging", "battle cry"],
                "bg_natural": ["battlefield", "arena"],
                "bg_building": ["colosseum", "war camp"],
                "lighting": ["blood light", "battle fire"],
                "atmosphere": ["intense", "violent", "chaotic"],
            },
            "暗影刺客": {
                "palette": "shadow-black color scheme, obsidian scheme, assassin dark scheme",
                "attire_sets": [
                    {
                        "name": "暗杀者装",
                        "normal": "revealing assassin outfit, form-fitting dark leather, hidden blades, poison vials, silent weapons, shadow accessories, stealth tools, deadly jewelry, kill marks, infiltration gear, alluring lethal ornaments, throwing knives",
                    },
                    {
                        "name": "影刃战服",
                        "normal": "seductive shadowblade attire, exposing dark armor, dual daggers, assassination tools, stealth equipment, shadow magic accessories, silent boots, deadly ornaments, kill trophies, infiltration tools, provocative assassin ornaments, smoke vials",
                    },
                    {
                        "name": "死神伪装",
                        "normal": "alluring death dealer outfit, revealing dark gear, shadow weapons, poison kit, stealth accessories, assassination jewelry, silent movement tools, deadly charms, kill marks, infiltration accessories, seductive killer ornaments, garrote wire",
                    },
                    {
                        "name": "幽魂刺客装",
                        "normal": "phantom assassin attire, spectral stealth robes, ghost blades, incorporeal poison, spirit assassination tools, ethereal infiltration gear, phantom jewelry, intangible movement accessories, soul kill marks, ghostly stealth ornaments, spirit assassin runes, otherworld killer tools",
                    },
                    {
                        "name": "毒刃大师装",
                        "normal": "poison master outfit, toxin specialist robes, venom blades, deadly poison collection, antidote kit, toxicology tools, poisoner jewelry, venom immunity accessories, toxin marks, chemical assassination ornaments, poison mastery runes, lethal compound tools",
                    },
                    {
                        "name": "暗夜猎手装",
                        "normal": "night hunter attire, darkness stalker robes, nocturnal blades, shadow tracking tools, night vision accessories, darkness camouflage gear, midnight jewelry, twilight hunting ornaments, night kill marks, shadow hunter symbols, darkness mastery runes, nocturnal predator tools",
                    },
                ],
                "expressions": ["cold", "focused", "deadly"],
                "poses": ["sneaking", "assassination pose", "shadow stance"],
                "bg_natural": ["dark forest", "shadow realm"],
                "bg_building": ["dark alley", "rooftop", "dungeon"],
                "lighting": ["shadow", "moonlight"],
                "atmosphere": ["dark", "tense", "deadly"],
            },
            # ========== 狐族特色职业 ==========
            "巫女": {
                "palette": "silver-blue color scheme, white-gold color scheme, shrine red-white scheme",
                "attire_sets": [
                    {
                        "name": "巫女装束",
                        "normal": "revealing shrine maiden outfit, sheer white hakama, red obi, sacred rope, purification wand, shrine bells, traditional accessories, alluring mystical ornaments, white tabi socks, wooden geta sandals, paper talismans, purification streamers, sacred mirror pendant, fox mask accessory, incense burner, ceremonial fan, divine blessing scroll, shrine maiden headdress, spiritual energy aura, prayer beads",
                    },
                    {
                        "name": "神道教服",
                        "normal": "seductive miko attire, slit ceremonial kimono, sacred talismans, purification tools, shrine ornaments, traditional jewelry, provocative spiritual accessories, silk obi belt, traditional hair ornaments, prayer beads necklace, sacred water vessel, purification brush, shrine bell chime, divine protection amulet, ceremonial sake cup, spiritual purification smoke, traditional makeup, shrine maiden gloves, divine blessing seal, ritual implements",
                    },
                    {
                        "name": "九尾神巫装",
                        "normal": "alluring nine-tail shrine attire, revealing white kimono, fox spirit symbols, sacred gohei wand, mystical orbs, sacred fox tail ornaments, spiritual jewelry, shrine accessories, purification tools, fox deity emblems, seductive miko ornaments, ceremonial bells, divine kitsune mask, sacred ribbons, spirit flames, traditional charms, blessing scrolls, shrine maiden crown, ritual sake set, spiritual energy wisps",
                    },
                    {
                        "name": "战巫女装",
                        "normal": "battle shrine maiden outfit, armored miko attire, combat gohei staff, protective talismans, warrior purification tools, battle shrine accessories, combat spiritual jewelry, fighting miko ornaments, war blessing implements, defense prayer scrolls, battle meditation beads, combat shrine maiden gear",
                    },
                    {
                        "name": "狐火巫女装",
                        "normal": "fox fire shrine attire, flame miko robes, fire spirit wand, burning talismans, fox flame accessories, heat purification tools, inferno spiritual jewelry, blazing shrine ornaments, fire blessing scrolls, phoenix feather accessories, flame meditation implements, fox fire mystical gems",
                    },
                    {
                        "name": "月巫女装",
                        "normal": "lunar shrine maiden outfit, moonlight miko robes, crescent gohei, lunar talismans, moon phase accessories, twilight purification tools, celestial spiritual jewelry, night shrine ornaments, moon blessing scrolls, star prayer beads, lunar meditation implements, moonlight mystical gems",
                    },
                ],
                "expressions": ["mysterious", "calm", "serene"],
                "poses": ["casting", "meditating", "praying", "ritual dance"],
                "bg_natural": ["moonlit grove", "silver forest", "shrine grounds"],
                "bg_building": ["lunar temple", "shrine", "torii gate"],
                "lighting": ["moonlight", "starlight", "magical light"],
                "atmosphere": ["mystical", "magical", "peaceful"],
            },
            "姬武士": {
                "palette": "steel-red color scheme, samurai crimson scheme, warrior honor scheme",
                "attire_sets": [
                    {
                        "name": "姬武士装",
                        "normal": "revealing samurai armor, silk kimono, katana, wakizashi, traditional accessories, alluring warrior ornaments, lacquered armor plates, silk obi belt, traditional hair ornaments, warrior headband, battle gloves, armored sleeves, traditional sandals, warrior's honor badge, family crest pendant, sword maintenance kit, combat fan, armor decorations, battle scars, samurai spirit aura",
                    },
                    {
                        "name": "女剑士服",
                        "normal": "seductive swordswoman attire, slit battle kimono, traditional weapons, warrior accessories, provocative martial ornaments, reinforced leather armor, silk battle sash, traditional hair pins, warrior's arm guards, battle-worn gloves, traditional footwear, combat utility belt, warrior's honor medallion, family sword tassel, dueling stance, martial arts mastery, warrior's pride, combat experience aura, training ribbons, victory tokens",
                    },
                    {
                        "name": "武家姬装",
                        "normal": "alluring noble warrior attire, revealing ceremonial armor, dual swords, family heirloom weapons, clan symbols, honor badges, silk undergarments, traditional war paint, warrior jewelry, battle ornaments, seductive samurai accessories, sake cup, war fan, family banner, armor silk cords, combat hakama, traditional leg guards, honor sash, warrior temple charm, sword oil kit",
                    },
                    {
                        "name": "忍者武姬装",
                        "normal": "ninja samurai outfit, stealth warrior attire, hidden katana, ninja tools, shadow combat gear, infiltration samurai accessories, silent movement armor, espionage warrior jewelry, covert battle ornaments, assassination honor badges, stealth mission scrolls, shadow warrior implements",
                    },
                    {
                        "name": "弓道武姬装",
                        "normal": "kyudo warrior outfit, archery samurai attire, ceremonial bow, precision arrows, marksman gear, ranged combat accessories, shooting stance armor, archer warrior jewelry, distance battle ornaments, accuracy honor badges, bowmanship scrolls, archery master implements",
                    },
                    {
                        "name": "浪人武姬装",
                        "normal": "ronin warrior outfit, masterless samurai attire, wandering blade, journey-worn katana, vagabond warrior gear, nomadic combat accessories, travel-stained armor, lone warrior jewelry, wanderer battle ornaments, dishonored badges, exile scrolls, freedom seeker implements",
                    },
                ],
                "expressions": ["confident", "serious", "cold", "honorable"],
                "poses": ["combat stance", "standing", "drawing sword"],
                "bg_natural": ["cherry blossom field"],
                "bg_building": ["castle", "dojo", "samurai estate"],
                "lighting": ["sunlight", "dawn light"],
                "atmosphere": ["epic", "honorable"],
            },
            "领主": {
                "palette": "gold-crimson color scheme, noble scheme, feudal lord scheme",
                "attire_sets": [
                    {
                        "name": "领主礼装",
                        "normal": "revealing lord's attire, noble kimono, family crest ornaments, ceremonial sword, authority symbols, jade accessories, silk sash, lord's fan, signet ring, territory map, alluring ruler ornaments, command baton",
                    },
                    {
                        "name": "大名华服",
                        "normal": "seductive daimyo outfit, exposing noble robes, clan symbols, ruling scepter, territorial seal, power jewelry, formal kimono, authority badge, command accessories, noble ornaments, provocative leader accessories, sake set",
                    },
                    {
                        "name": "统治者装",
                        "normal": "alluring ruler attire, revealing ceremonial robes, power symbols, command sword, territory documents, noble jewelry, clan ornaments, authority accessories, ruling implements, leadership symbols, seductive sovereign ornaments, war council fan",
                    },
                    {
                        "name": "将军领主装",
                        "normal": "military lord outfit, general commander robes, war strategy scepter, battlefield maps, army command accessories, tactical leadership jewelry, military clan symbols, warfare authority ornaments, campaign documents, strategic war fan, victory general badges, army leader implements",
                    },
                    {
                        "name": "商业领主装",
                        "normal": "merchant lord attire, trade magnate robes, commerce scepter, business empire documents, wealth accumulation accessories, prosperity jewelry, trading clan symbols, economic authority ornaments, trade route maps, merchant guild fan, fortune maker badges, business leader implements",
                    },
                    {
                        "name": "隐遁领主装",
                        "normal": "shadow lord outfit, secret ruler robes, covert power scepter, hidden influence documents, espionage accessories, intrigue jewelry, shadow clan symbols, conspiracy authority ornaments, spy network scrolls, secret society fan, underworld control badges, shadow government implements",
                    },
                ],
                "expressions": ["confident", "commanding", "noble"],
                "poses": ["standing", "sitting regally", "commanding pose"],
                "bg_natural": [],
                "bg_building": ["castle", "estate", "throne room"],
                "lighting": ["sunlight", "noble lighting"],
                "atmosphere": ["regal", "powerful"],
            },
            "海贼": {
                "palette": "ocean-blue color scheme, pirate scheme, sea raider scheme",
                "attire_sets": [
                    {
                        "name": "海盗装束",
                        "normal": "revealing pirate outfit, torn clothing, cutlass, crossbow, treasure map, rum bottle, eye patch, bandana, rope accessories, sea jewelry, alluring raider ornaments, compass",
                    },
                    {
                        "name": "劫掠者装",
                        "normal": "seductive sea raider attire, exposing pirate gear, dual weapons, plundered jewelry, sea charts, navigation tools, pirate accessories, skull symbols, ocean ornaments, raider trophies, provocative buccaneer accessories, telescope",
                    },
                    {
                        "name": "海狐装备",
                        "normal": "alluring fox pirate outfit, revealing naval attire, eastern weapons, stolen treasures, sea navigation tools, pirate fox jewelry, maritime accessories, raider symbols, ocean charms, plunder ornaments, seductive corsair accessories, sake flask",
                    },
                    {
                        "name": "海盗女王装",
                        "normal": "pirate queen attire, captain's royal outfit, commanding cutlass, treasure hoard, pirate fleet symbols, maritime crown, ocean ruler jewelry, sea conquest ornaments, plunder queen accessories, naval dominance badges, corsair royalty gems, sea empire implements",
                    },
                    {
                        "name": "海上魔女装",
                        "normal": "sea witch pirate outfit, oceanic sorcery robes, cursed cutlass, storm summoning tools, water magic accessories, tempest jewelry, sea curse symbols, maritime hex ornaments, tidal spell implements, ocean witch badges, nautical magic gems, wave control tools",
                    },
                    {
                        "name": "海怪猎人装",
                        "normal": "sea monster hunter attire, creature slayer gear, beast-killing cutlass, monster trophies, kraken hunter tools, leviathan jewelry, deep sea symbols, creature hunter ornaments, monster bane implements, ocean predator badges, beast slayer gems, aquatic hunter tools",
                    },
                ],
                "expressions": ["confident", "wild", "cunning"],
                "poses": ["standing", "combat stance", "swaggering"],
                "bg_natural": ["ocean", "beach"],
                "bg_building": ["ship deck", "port", "tavern"],
                "lighting": ["sunlight", "sea light"],
                "atmosphere": ["adventurous", "wild"],
            },
            "船长": {
                "palette": "navy-blue color scheme, captain scheme, maritime gold scheme",
                "attire_sets": [
                    {
                        "name": "船长制服",
                        "normal": "revealing captain robes, naval coat, command hat, ceremonial sword, navigation tools, ship wheel accessory, compass, maps, captain's badge, maritime jewelry, alluring nautical ornaments, telescope",
                    },
                    {
                        "name": "海军指挥装",
                        "normal": "seductive naval commander attire, exposing officer robes, command symbols, navigation instruments, ship documents, authority badges, maritime accessories, captain's jewelry, naval ornaments, leadership tools, provocative maritime accessories, weather crystal",
                    },
                    {
                        "name": "商船长装",
                        "normal": "alluring merchant captain outfit, revealing captain's coat, trade documents, quality compass, ship's log, cargo manifests, merchant symbols, navigation tools, trading jewelry, maritime accessories, seductive seafarer ornaments, astrolabe",
                    },
                    {
                        "name": "探险船长装",
                        "normal": "explorer captain attire, discovery vessel robes, uncharted maps, exploration compass, voyage journal, new world documents, pioneer symbols, frontier navigation tools, discovery jewelry, exploration accessories, adventurer captain ornaments, world mapper implements",
                    },
                    {
                        "name": "战舰船长装",
                        "normal": "warship captain outfit, naval warfare robes, battle command compass, tactical ship logs, fleet coordination documents, military naval symbols, combat navigation tools, warfare jewelry, strategic maritime accessories, battle captain ornaments, naval dominance implements",
                    },
                    {
                        "name": "走私船长装",
                        "normal": "smuggler captain attire, contraband vessel robes, hidden route maps, discrete compass, secret cargo logs, illegal trade documents, underground symbols, covert navigation tools, black market jewelry, smuggling accessories, contraband captain ornaments, illicit trade implements",
                    },
                ],
                "expressions": ["confident", "commanding", "experienced"],
                "poses": ["standing", "commanding pose", "navigating"],
                "bg_natural": ["ocean", "port"],
                "bg_building": ["ship deck", "captain's quarters"],
                "lighting": ["sunlight", "sea breeze light"],
                "atmosphere": ["adventurous", "authoritative"],
            },
            "歌妓": {
                "palette": "elegant crimson scheme, courtesan scheme, entertainment gold-red scheme",
                "attire_sets": [
                    {
                        "name": "歌妓华服",
                        "normal": "revealing courtesan kimono, elegant fabrics, musical instruments, performance fan, entertainment accessories, beautiful jewelry, artistic ornaments, performance makeup, silk ribbons, entertainment tools, alluring entertainer ornaments, sake cup",
                    },
                    {
                        "name": "艺伎装束",
                        "normal": "seductive geisha attire, exposing elegant kimono, shamisen, dance fan, traditional makeup, elaborate hairpins, entertainment jewelry, performance accessories, artistic ornaments, cultural symbols, provocative performer accessories, tea ceremony set",
                    },
                    {
                        "name": "花魁礼服",
                        "normal": "alluring oiran outfit, revealing luxurious kimono, multiple hair ornaments, elegant fan, performance tools, expensive jewelry, courtesan accessories, artistic makeup, entertainment implements, beauty symbols, seductive high-class ornaments, pipe accessory",
                    },
                    {
                        "name": "舞姬装",
                        "normal": "dance performer attire, graceful dancing kimono, fan dance props, rhythm instruments, movement ornaments, flowing accessories, dancer jewelry, choreography tools, performance makeup, artistic motion symbols, seductive dance ornaments, silk ribbons",
                    },
                    {
                        "name": "琴师装",
                        "normal": "koto musician outfit, elegant musician kimono, traditional koto instrument, music sheets, performance jewelry, artistic accessories, musician ornaments, melodic tools, concert makeup, harmony symbols, seductive artist ornaments, tuning implements",
                    },
                    {
                        "name": "茶艺师装",
                        "normal": "tea ceremony performer attire, ceremonial tea kimono, tea ceremony set, ritual implements, elegance accessories, cultural jewelry, tea master ornaments, ceremony tools, refined makeup, grace symbols, seductive cultural ornaments, tea wisdom implements",
                    },
                ],
                "expressions": ["elegant", "seductive", "artistic"],
                "poses": ["performing pose", "dancing", "playing music"],
                "bg_natural": [],
                "bg_building": ["entertainment quarter", "teahouse", "playhouse"],
                "lighting": ["soft light", "lantern light"],
                "atmosphere": ["elegant", "sensual", "artistic"],
            },
        },
        # 镜头构图
        "camera": {
            "shot": {
                "全景": "panorama",
                "全景镜头": "wide_shot",
                "中景镜头": "medium_shot",
                "全身像": "full_shot",
                "上半身": "upper_body",
                "牛仔镜头": "cowboy_shot",
                "肖像画": "portrait",
                "侧面肖像画": "profile",
            },
            "angle": {
                "正面视角": "front view",
                "侧面视角": "from_side",
                "从上方": "from_above",
                "从下方": "from_below",
                "动态角度": "dynamic_angle",
                "电影角度": "cinematic_angle",
                "倾斜角度": "dutch angle",
                "透视法": "foreshortening",
            },
            "composition": {
                "空中": "aerial",
                "转身": "turn_one's_back",
                "优雅构图": "elegant composition",
                "对称构图": "symmetric composition",
                "三分法": "rule of thirds",
            },
            "character_action": {
                "看向观众": "looking_at_viewer",
                "眼神接触": "eye-contact",
                "盯着看": "eyeball",
                "凝视": "stare",
                "回眸": "looking_back",
                "人物倾斜": "gradient",
                "人物视角向下看": "looking_down",
                "人物视角抬头看": "looking_up",
                "面向别处": "facing_away",
                "看向侧面": "looking_to_the_side",
                "看着别处": "looking_away",
                "展望未来": "looking_ahead",
                "遥望": "looking_afar",
                "向外看": "looking_outside",
                "歪头": "head_tilt",
                "低头": "head_down",
                "轻轻向侧面瞥": "sideways_glance",
            },
        },
    }


def pick_race_and_role(
    template: Dict[str, Any], race_fixed: str = None, role_fixed: str = None
) -> Tuple[str, str]:
    race = race_fixed or random.choice(list(template["race_roles"].keys()))
    roles = template["race_roles"][race]
    role = role_fixed or random.choice(roles)
    return race, role


def pick_role_profile(template: Dict[str, Any], role: str) -> Dict[str, Any]:
    profiles = template["role_profiles"]
    return profiles.get(role, profiles["战士"])  # fallback


def pick_scene_from_profile(profile: Dict[str, Any]) -> Tuple[str, str]:
    # 背景：自然/建筑二选一
    use_natural = (
        random.random() < 0.5
        and profile["bg_natural"]
        and profile["bg_natural"] != ["none"]
    )
    if use_natural:
        return random.choice(profile["bg_natural"]), "natural"
    if profile["bg_building"] and profile["bg_building"] != ["none"]:
        return random.choice(profile["bg_building"]), "building"
    # 后备
    return "studio background", "none"


def build_prompt(
    template: Dict[str, Any],
    race: str,
    appearance_pick: Dict[str, str],
    identity: str,
    role: str,
    profile_selected: Dict[str, str],
    camera_pick: Dict[str, str],
) -> str:
    race_text = template["races"][race]
    hair_length = appearance_pick["hair_length"]
    hair_style = appearance_pick["hair_style"]
    hair_color = appearance_pick["hair_color"]
    eye_color = appearance_pick["eye_color"]
    body_type = appearance_pick["body_type"]
    hair_acc = appearance_pick.get("hair_acc", "")
    hair_bangs = appearance_pick.get("hair_bangs", "")

    # 处理狐族的动态发色替换
    if race == "狐族" and "{hair_color}" in race_text:
        race_text = race_text.format(hair_color=hair_color)

    sel = dict(profile_selected)

    scene = sel.get("background", "")

    # 构建发型部分，包含刘海
    hair_parts = [hair_length, hair_style]
    if hair_bangs:
        hair_parts.append(hair_bangs)
    if hair_acc:
        hair_parts.append(hair_acc)

    hair_description = ", ".join(hair_parts)

    parts = [
        BASE_PREFIX,
        race_text,
        f"{hair_color} hair",
        hair_description,
        f"{eye_color} eyes",
        body_type,
        # 职业相关（合并后的服装+武器道具块）
        sel.get("attire_block"),
        sel.get("expression"),
        sel.get("pose"),
        scene,
        sel.get("lighting"),
        sel.get("atmosphere"),
        sel.get("palette_text"),
        # 镜头
        camera_pick.get("character_action"),
        camera_pick.get("shot"),
        camera_pick.get("angle"),
        camera_pick.get("composition"),
        # 风格/质量（轻量）
        "artistic, high quality, detailed",
    ]
    return ", ".join([p for p in parts if p])


def generate(
    limit_per_race: int = 5,
    traverse_appearance: bool = True,
    race_fixed: str = None,
    role_fixed: str = None,
) -> List[Dict[str, Any]]:
    t = get_template()

    # 预构造外貌遍历列表（可控规模：示例抽样组合）
    hair_lengths = list(t["appearance"]["hair_length"].values())
    hair_style_categories = list(t["appearance"]["hair_style"].keys())
    eye_colors = list(t["appearance"]["eye_color"].values())
    body_types = list(t["appearance"]["body_type"].values())
    hair_accs = t["appearance"]["hair_accessories"]

    races = list(t["races"].keys())
    selected_races = [race_fixed] if race_fixed else list(t["race_roles"].keys())

    camera = t["camera"]

    results: List[Dict[str, Any]] = []

    for race in selected_races:
        count = 0
        while count < limit_per_race:
            # 先选择种族和职业
            race_pick, role = pick_race_and_role(
                t, race_fixed=race, role_fixed=role_fixed
            )
            profile = pick_role_profile(t, role)

            # 外貌遍历/抽样
            appearance_pick = {
                "hair_length": random.choice(hair_lengths),
                "hair_style": _get_random_hair_style_from_template(
                    t["appearance"]["hair_style"]
                ),
                "hair_color": _get_random_hair_color_from_template(
                    t["appearance"]["hair_color"]
                ),
                "eye_color": random.choice(eye_colors),
                "body_type": random.choice(body_types),
                "hair_acc": random.choice(hair_accs),
            }

            # 职业派生元素 + 颜色库（服装套为 role.attire_sets）
            bg, _ = pick_scene_from_profile(profile)

            # 先从职业的 palette 中选择颜色风格
            palette_options = (
                profile.get("palette", "").split(", ") if profile.get("palette") else []
            )
            palette_text = random.choice(palette_options) if palette_options else None

            # 然后选择套装
            attire_entry = random.choice(
                profile.get(
                    "attire_sets",
                    [{"name": "角色成套", "normal": "refined role attire set"}],
                )
            )
            normal_text = attire_entry.get("normal")
            attire_block = (
                f"{palette_text}, {normal_text}"
                if (palette_text and normal_text)
                else (normal_text or palette_text)
            )

            profile_selected = {
                "attire_block": attire_block,
                "expression": (
                    random.choice(profile["expressions"])
                    if profile.get("expressions")
                    else None
                ),
                "pose": (
                    random.choice(profile["poses"]) if profile.get("poses") else None
                ),
                "background": bg,
                "lighting": (
                    random.choice(profile["lighting"])
                    if profile.get("lighting")
                    else None
                ),
                "atmosphere": (
                    random.choice(profile["atmosphere"])
                    if profile.get("atmosphere")
                    else None
                ),
                "palette_text": palette_text,
            }

            # 随机选择视角
            camera_pick = {
                "shot": random.choice(list(camera["shot"].values())),
                "angle": random.choice(list(camera["angle"].values())),
                "composition": random.choice(list(camera["composition"].values())),
            }

            seed = random.randint(10000, 99999)
            prompt = build_prompt(
                t,
                race_pick,
                appearance_pick,
                "贵族",  # 身份固定为贵族，保持兼容性
                role,
                profile_selected,
                camera_pick,
            )
            results.append(
                {
                    "race": race_pick,
                    "identity": "贵族",  # 保持兼容性
                    "role": role,
                    "prompt": prompt,
                    "seed": seed,
                }
            )

            count += 1

    return results


def write_csv(rows: List[Dict[str, Any]], csv_path: str) -> None:
    fieldnames = ["race", "identity", "role", "prompt", "seed"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)


class ComfyUIPortraitTester:
    def __init__(self, comfyui_url: str = "http://localhost:8188"):
        self.comfyui_url = comfyui_url
        self.output_dir = "test_portraits"
        self.ensure_output_dir()

    def ensure_output_dir(self):
        """确保输出目录存在"""
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
            print(f"创建输出目录: {self.output_dir}")

    def create_custom_prompts(self):
        """创建自定义提示词 - 灵活配置模式"""
        return self.generate_flexible_combinations()

    def get_flexible_config(self):
        """灵活配置：定义任何部分，未定义的部分会自动遍历或随机抽取"""
        return {
            # === 基础特征 ===
            "race": None,  # 固定种族：人类/永恒精灵/黑暗精灵/狐族，None=遍历所有
            # === 外貌特征 ===
            "hair_length": None,  # 固定头发长度：短发/长发/超长发，None=遍历所有
            "hair_style": None,  # 固定发型：None=随机抽取（短发会排除不合适的发型）
            "hair_color": None,  # 固定发色：金色/银色/黑色/棕色/红色/白色/蓝色/绿色/粉色，None=遍历所有（每个主色50%概率单色，50%概率渐变色）
            "eye_color": None,  # 固定眼色：蓝色/绿色/紫色/棕色/红色/金色/银色，None=随机选择
            "body_type": None,  # 固定体型：娇小身材/正常身材/丰满身材，None=遍历所有
            # === 职业 ===
            "role": None,  # 固定职业根据种族限制：法师/牧师/德鲁伊/战士/骑士/游侠/学者/女王/公主/王后/女仆/商人/盗贼/吟游诗人/医师/教师/巫女/姬武士，None=遍历所有
            # === 镜头设置 ===
            "shot": None,  # 固定镜头距离：全景/全景镜头/中景镜头/全身像/上半身/牛仔镜头/肖像画/侧面肖像画，None=随机选择
            "angle": None,  # 固定镜头角度：正面视角/侧面视角/从上方/从下方/动态角度/电影角度/倾斜角度/透视法，None=随机选择
            "composition": None,  # 固定构图：空中/转身/优雅构图/对称构图/三分法，None=随机选择
            "character_action": None,  # 固定角色动作：看向观众/眼神接触/盯着看/凝视/回眸/人物倾斜/人物视角向下看/人物视角抬头看/面向别处/看向侧面/看着别处/展望未来/遥望/向外看/歪头/低头/轻轻向侧面瞥，None=随机选择
            # === 其他选项 ===
            "max_combinations": 5000,  # 最大生成组合数（防止遍历过多）
        }

    def generate_flexible_combinations(self):
        """灵活生成组合：根据配置决定哪些部分固定，哪些部分遍历"""
        import random

        # 使用角色提示词构筑器的模板
        template = get_template()

        # 获取配置
        config = self.get_flexible_config()

        print(f"\n=== 灵活配置生成模式 ===")

        # 准备所有选项
        all_races = list(template["races"].keys())
        all_hair_lengths = list(template["appearance"]["hair_length"].keys())
        all_hair_styles = list(template["appearance"]["hair_style"].keys())
        all_hair_colors = list(template["appearance"]["hair_color"].keys())
        all_eye_colors = list(template["appearance"]["eye_color"].keys())
        all_body_types = list(template["appearance"]["body_type"].keys())
        all_roles = list(template["role_profiles"].keys())

        # 根据配置决定遍历范围
        races = [config["race"]] if config["race"] else all_races
        hair_lengths = (
            [config["hair_length"]] if config["hair_length"] else all_hair_lengths
        )
        hair_styles = (
            [config["hair_style"]] if config["hair_style"] else all_hair_styles
        )
        hair_colors = (
            [config["hair_color"]] if config["hair_color"] else all_hair_colors
        )
        eye_colors = [config["eye_color"]] if config["eye_color"] else [None]
        body_types = [config["body_type"]] if config["body_type"] else all_body_types
        # 应用种族-职业限制
        if config["role"]:
            roles = [config["role"]]
        else:
            # 如果指定了种族，则限制职业；否则使用所有职业
            if config["race"]:
                allowed_roles = []
                for role in all_roles:
                    allowed_races = get_role_allowed_races(role, template["race_roles"])
                    if config["race"] in allowed_races:
                        allowed_roles.append(role)
                roles = allowed_roles
            else:
                roles = all_roles

        # 显示配置信息
        print(
            f"种族: {'固定-' + config['race'] if config['race'] else f'遍历-{len(races)}个'}"
        )
        print(
            f"头发长度: {'固定-' + config['hair_length'] if config['hair_length'] else f'遍历-{len(hair_lengths)}个'}"
        )
        print(
            f"发型: {'固定-' + config['hair_style'] if config['hair_style'] else '随机抽取（短发会排除不合适的）'}"
        )
        print(
            f"发色: {'固定-' + config['hair_color'] if config['hair_color'] else f'遍历-{len(hair_colors)}个'}"
        )
        print(
            f"眼色: {'固定-' + config['eye_color'] if config['eye_color'] else f'遍历-{len(eye_colors)}个'}"
        )
        print(
            f"体型: {'固定-' + config['body_type'] if config['body_type'] else f'遍历-{len(body_types)}个'}"
        )
        print("刘海: 随机抽取")
        if config["role"]:
            print(f"职业: 固定-{config['role']}")
        else:
            if config["race"]:
                print(f"职业: 种族限制-{len(roles)}个 (适合{config['race']})")
            else:
                print(f"职业: 遍历-{len(roles)}个")
        print(f"镜头: {'固定' if config['shot'] else '随机选择'}")

        # 计算总组合数（发型不参与计算，因为是随机抽取）
        total_combinations = (
            len(races)
            * len(hair_lengths)
            * len(hair_colors)
            * len(eye_colors)
            * len(body_types)
            * len(roles)
        )
        if total_combinations > config["max_combinations"]:
            print(
                f"\n警告：总组合数 {total_combinations} 超过限制 {config['max_combinations']}，将随机采样"
            )

        prompts = []
        combination_count = 0

        for race in races:
            for hair_length in hair_lengths:
                for hair_color in hair_colors:
                    for eye_color in eye_colors if config["eye_color"] else [None]:
                        for body_type in body_types:
                            for role in roles:
                                # 检查种族-职业兼容性（当种族遍历时）
                                if not config["race"]:
                                    allowed_races = get_role_allowed_races(
                                        role, template["race_roles"]
                                    )
                                    if race not in allowed_races:
                                        continue

                                if combination_count >= config["max_combinations"]:
                                    break

                                # 构建外貌选择
                                appearance_pick = {
                                    "hair_length": template["appearance"][
                                        "hair_length"
                                    ][hair_length],
                                    "hair_style": _get_random_hair_style(
                                        template["appearance"]["hair_style"],
                                        hair_length,
                                        template["appearance"]["short_hair_exclusions"],
                                    ),
                                    "hair_color": _get_random_hair_color(
                                        template["appearance"]["hair_color"],
                                        hair_color,
                                    ),
                                    "eye_color": (
                                        template["appearance"]["eye_color"][eye_color]
                                        if config["eye_color"]
                                        else random.choice(
                                            list(
                                                template["appearance"][
                                                    "eye_color"
                                                ].values()
                                            )
                                        )
                                    ),
                                    "body_type": template["appearance"]["body_type"][
                                        body_type
                                    ],
                                    "hair_acc": random.choice(
                                        template["appearance"]["hair_accessories"]
                                    ),
                                    "hair_bangs": random.choice(
                                        list(
                                            template["appearance"][
                                                "hair_bangs"
                                            ].values()
                                        )
                                    ),
                                }

                                # 获取职业配置
                                profile = template["role_profiles"][role]

                                # 使用角色提示词构筑器的逻辑
                                bg, _ = pick_scene_from_profile(profile)

                                # 先从职业的 palette 中选择颜色风格
                                palette_options = (
                                    profile.get("palette", "").split(", ")
                                    if profile.get("palette")
                                    else []
                                )
                                palette_text = (
                                    random.choice(palette_options)
                                    if palette_options
                                    else None
                                )

                                # 然后选择套装
                                attire_entry = random.choice(
                                    profile.get(
                                        "attire_sets",
                                        [
                                            {
                                                "name": "角色成套",
                                                "normal": "refined role attire set",
                                            }
                                        ],
                                    )
                                )
                                normal_text = attire_entry.get("normal")
                                attire_block = (
                                    f"{palette_text}, {normal_text}"
                                    if (palette_text and normal_text)
                                    else (normal_text or palette_text)
                                )

                                profile_selected = {
                                    "attire_block": attire_block,
                                    "expression": (
                                        random.choice(profile["expressions"])
                                        if profile.get("expressions")
                                        else None
                                    ),
                                    "pose": (
                                        random.choice(profile["poses"])
                                        if profile.get("poses")
                                        else None
                                    ),
                                    "background": bg,
                                    "lighting": (
                                        random.choice(profile["lighting"])
                                        if profile.get("lighting")
                                        else None
                                    ),
                                    "atmosphere": (
                                        random.choice(profile["atmosphere"])
                                        if profile.get("atmosphere")
                                        else None
                                    ),
                                    "palette_text": palette_text,
                                }

                                # 镜头选择
                                camera_pick = {
                                    "shot": (
                                        template["camera"]["shot"][config["shot"]]
                                        if config["shot"]
                                        else random.choice(
                                            list(template["camera"]["shot"].values())
                                        )
                                    ),
                                    "angle": (
                                        template["camera"]["angle"][config["angle"]]
                                        if config["angle"]
                                        else random.choice(
                                            list(template["camera"]["angle"].values())
                                        )
                                    ),
                                    "composition": (
                                        template["camera"]["composition"][
                                            config["composition"]
                                        ]
                                        if config["composition"]
                                        else random.choice(
                                            list(
                                                template["camera"][
                                                    "composition"
                                                ].values()
                                            )
                                        )
                                    ),
                                    "character_action": (
                                        template["camera"]["character_action"][
                                            config["character_action"]
                                        ]
                                        if config["character_action"]
                                        else random.choice(
                                            list(
                                                template["camera"][
                                                    "character_action"
                                                ].values()
                                            )
                                        )
                                    ),
                                }

                                # 使用角色提示词构筑器的构筑功能
                                seed = random.randint(10000, 99999)
                                prompt = build_prompt(
                                    template,
                                    race,
                                    appearance_pick,
                                    "贵族",
                                    role,
                                    profile_selected,
                                    camera_pick,
                                )

                                # 记录Part链的各个部分（中文）
                                # 需要将发型从英文prompt转回中文key
                                hair_style_cn = None
                                for cn_key, en_value in template["appearance"][
                                    "hair_style"
                                ].items():
                                    if en_value == appearance_pick["hair_style"]:
                                        hair_style_cn = cn_key
                                        break
                                if not hair_style_cn:
                                    hair_style_cn = "直发"  # 默认

                                # 刘海中文名称
                                hair_bangs_cn = None
                                for cn_key, en_value in template["appearance"][
                                    "hair_bangs"
                                ].items():
                                    if en_value == appearance_pick.get(
                                        "hair_bangs", ""
                                    ):
                                        hair_bangs_cn = cn_key
                                        break
                                if not hair_bangs_cn:
                                    hair_bangs_cn = "无刘海"

                                # 眼色中文名称
                                eye_color_cn = None
                                for cn_key, en_value in template["appearance"][
                                    "eye_color"
                                ].items():
                                    if en_value == appearance_pick["eye_color"]:
                                        eye_color_cn = cn_key
                                        break
                                if not eye_color_cn:
                                    eye_color_cn = "蓝色"  # 默认

                                # 身材中文名称
                                body_type_cn = None
                                for cn_key, en_value in template["appearance"][
                                    "body_type"
                                ].items():
                                    if en_value == appearance_pick["body_type"]:
                                        body_type_cn = cn_key
                                        break
                                if not body_type_cn:
                                    body_type_cn = "正常身材"  # 默认

                                # 发饰
                                hair_acc = appearance_pick.get("hair_acc", "")

                                # 镜头参数的中文名称
                                shot_cn = None
                                for cn_key, en_value in template["camera"][
                                    "shot"
                                ].items():
                                    if en_value == camera_pick["shot"]:
                                        shot_cn = cn_key
                                        break
                                if not shot_cn:
                                    shot_cn = "未知镜头"

                                angle_cn = None
                                for cn_key, en_value in template["camera"][
                                    "angle"
                                ].items():
                                    if en_value == camera_pick["angle"]:
                                        angle_cn = cn_key
                                        break
                                if not angle_cn:
                                    angle_cn = "未知角度"

                                composition_cn = None
                                for cn_key, en_value in template["camera"][
                                    "composition"
                                ].items():
                                    if en_value == camera_pick["composition"]:
                                        composition_cn = cn_key
                                        break
                                if not composition_cn:
                                    composition_cn = "未知构图"

                                character_action_cn = None
                                for cn_key, en_value in template["camera"][
                                    "character_action"
                                ].items():
                                    if en_value == camera_pick["character_action"]:
                                        character_action_cn = cn_key
                                        break
                                if not character_action_cn:
                                    character_action_cn = "未知动作"

                                # 保存所有part和prompt
                                prompts.append(
                                    {
                                        "race": race,
                                        "hair_length": hair_length,
                                        "hair_style": hair_style_cn,
                                        "hair_bangs": hair_bangs_cn,
                                        "hair_color": hair_color,
                                        "eye_color": eye_color_cn,
                                        "body_type": body_type_cn,
                                        "hair_acc": hair_acc,
                                        "role": role,
                                        "attire_name": attire_entry.get(
                                            "name", "未知套装"
                                        ),
                                        "palette": palette_text or "",
                                        "expression": profile_selected.get("expression")
                                        or "",
                                        "pose": profile_selected.get("pose") or "",
                                        "background": profile_selected.get("background")
                                        or "",
                                        "lighting": profile_selected.get("lighting")
                                        or "",
                                        "atmosphere": profile_selected.get("atmosphere")
                                        or "",
                                        "shot": shot_cn,
                                        "angle": angle_cn,
                                        "composition": composition_cn,
                                        "character_action": character_action_cn,
                                        "prompt": prompt,
                                        "seed": seed,
                                    }
                                )

                                combination_count += 1

                                if combination_count >= config["max_combinations"]:
                                    break
                            if combination_count >= config["max_combinations"]:
                                break
                        if combination_count >= config["max_combinations"]:
                            break
                    if combination_count >= config["max_combinations"]:
                        break
                if combination_count >= config["max_combinations"]:
                    break
            if combination_count >= config["max_combinations"]:
                break

        print(f"SUCCESS: 已生成 {len(prompts)} 个组合")
        return prompts

    def create_test_prompts(self):
        """创建测试用的人物肖像提示词"""
        # 使用自定义组合
        test_prompts = self.create_custom_prompts()

        # 保存到CSV文件
        csv_file = "test_portrait_prompts.csv"

        # 检查文件是否已存在
        if os.path.exists(csv_file):
            print(f"⚠  CSV文件 {csv_file} 已存在")
            overwrite = input("是否覆盖现有文件？(y/n): ").strip().lower()
            if overwrite not in ["y", "yes", "是"]:
                print("已取消创建CSV文件")
                return csv_file

        with open(csv_file, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            # CSV表头：Part链的各列 + 职业服装细节 + 镜头参数 + 提示词 + 图片名称 + 图片ID + Seed
            writer.writerow(
                [
                    # === Part链 ===
                    "种族",
                    "发长",
                    "发型",
                    "刘海",
                    "发色",
                    "眼色",
                    "身材",
                    "发饰",
                    "职业",
                    # === 职业服装细节 ===
                    "套装名称",
                    "颜色风格",
                    "表情",
                    "姿态",
                    "背景",
                    "光照",
                    "氛围",
                    # === 镜头参数 ===
                    "镜头距离",
                    "镜头角度",
                    "构图",
                    "角色动作",
                    # === 输出信息 ===
                    "提示词",
                    "图片名称",
                    "图片ID",
                    "Seed",
                ]
            )

            # 为每个提示词生成唯一ID
            for idx, prompt_data in enumerate(test_prompts, start=1):
                # 生成5位数字ID（00001-99999）
                image_id = f"{idx:05d}"

                # 构建Part链（核心特征）
                part_chain = "-".join(
                    [
                        prompt_data["race"],
                        prompt_data["hair_length"],
                        prompt_data["hair_style"],
                        prompt_data["hair_bangs"],
                        prompt_data["hair_color"],
                        prompt_data["eye_color"],
                        prompt_data["body_type"],
                        prompt_data["role"],
                    ]
                )

                # 图片名称 = Part链 + ID
                image_name = f"{part_chain}-{image_id}"

                # 写入CSV行
                writer.writerow(
                    [
                        # === Part链 ===
                        prompt_data["race"],
                        prompt_data["hair_length"],
                        prompt_data["hair_style"],
                        prompt_data["hair_bangs"],
                        prompt_data["hair_color"],
                        prompt_data["eye_color"],
                        prompt_data["body_type"],
                        prompt_data["hair_acc"],
                        prompt_data["role"],
                        # === 职业服装细节 ===
                        prompt_data["attire_name"],
                        prompt_data["palette"],
                        prompt_data["expression"],
                        prompt_data["pose"],
                        prompt_data["background"],
                        prompt_data["lighting"],
                        prompt_data["atmosphere"],
                        # === 镜头参数 ===
                        prompt_data["shot"],
                        prompt_data["angle"],
                        prompt_data["composition"],
                        prompt_data["character_action"],
                        # === 输出信息 ===
                        prompt_data["prompt"],
                        image_name,
                        image_id,
                        prompt_data["seed"],
                    ]
                )

        print(f"已创建测试提示词CSV文件: {csv_file}")
        print(f"总共包含 {len(test_prompts)} 个测试提示词")
        return csv_file

    def create_simple_workflow(
        self,
        prompt: str,
        seed: int,
        filename_prefix: str = "test_portrait",
    ) -> Dict[str, Any]:
        """创建适配LoRA自动加载的ComfyUI工作流"""
        workflow = {
            "3": {
                "inputs": {
                    "seed": seed,
                    "steps": 30,  # 使用你推荐的30步
                    "cfg": 8,  # 使用你推荐的CFG 8
                    "sampler_name": "heun",
                    "scheduler": "normal",
                    "denoise": 1,
                    "model": ["12", 0],
                    "positive": ["12", 1],
                    "negative": ["12", 2],
                    "latent_image": ["5", 0],
                },
                "class_type": "KSampler",
                "_meta": {"title": "K采样器"},
            },
            "4": {
                "inputs": {"ckpt_name": "waiNSFWIllustrious_v120.safetensors"},
                "class_type": "CheckpointLoaderSimple",
                "_meta": {"title": "Checkpoint加载器(简易)"},
            },
            "5": {
                "inputs": {
                    "width": 728,  # 使用你的尺寸
                    "height": 1456,  # 使用你的尺寸
                    "batch_size": 1,
                },
                "class_type": "EmptyLatentImage",
                "_meta": {"title": "空Latent"},
            },
            "8": {
                "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
                "class_type": "VAEDecode",
                "_meta": {"title": "VAE解码"},
            },
            "9": {
                "inputs": {
                    "filename_prefix": filename_prefix,
                    "images": ["8", 0],
                    "filename_number_padding": 0,  # 禁用自动编号后缀
                },
                "class_type": "SaveImage",
                "_meta": {"title": "保存图像"},
            },
            "12": {
                "inputs": {
                    "positive": prompt,
                    "negative": "score_6,score_5,score_4,worst quality,low quality,deformed body,unaestheticXL_Alb2,monochrome,greyscale,source_pony,worst quality,low quality,normal quality,lowres,bad anatomy,ugly,imperfect eyes,skewed eyes,unnatural face,unnatural body,error,extra limb,missing limbs,painting by bad-artist,bad hands,text,red straps,buttons,palm leaf,extra fingers,pubic hair,NEGATIVE_HANDS,NEGATIVE_LEGS,second navel,asian,loafers,",
                    "打开可视化PromptUI": "",
                    "model": ["4", 0],
                    "clip": ["4", 1],
                },
                "class_type": "WeiLinComfyUIPromptToLoras",
                "_meta": {"title": "WeiLin 二合一提示词Lora自动加载"},
            },
        }
        return workflow

    def check_comfyui_connection(self) -> bool:
        """检查ComfyUI连接"""
        try:
            response = requests.get(f"{self.comfyui_url}/system_stats", timeout=5)
            return response.status_code == 200
        except:
            return False

    def submit_to_comfyui(self, workflow: Dict[str, Any]) -> str:
        """提交工作流到ComfyUI"""
        try:
            # 先检查连接
            if not self.check_comfyui_connection():
                print(f"✗ 无法连接到ComfyUI服务器: {self.comfyui_url}")
                print("请确保ComfyUI正在运行并且端口正确")
                return ""

            response = requests.post(
                f"{self.comfyui_url}/prompt", json={"prompt": workflow}, timeout=10
            )
            response.raise_for_status()
            result = response.json()
            return result.get("prompt_id", "")
        except requests.exceptions.Timeout:
            print(f"✗ 连接ComfyUI超时")
            return ""
        except requests.exceptions.ConnectionError:
            print(f"✗ 无法连接到ComfyUI: {self.comfyui_url}")
            print("请检查ComfyUI是否正在运行")
            return ""
        except requests.exceptions.RequestException as e:
            print(f"✗ 提交到ComfyUI失败: {e}")
            return ""
        except Exception as e:
            print(f"✗ 未知错误: {e}")
            return ""

    def check_queue_status(self) -> Dict[str, Any]:
        """检查队列状态"""
        try:
            response = requests.get(f"{self.comfyui_url}/queue")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"检查队列状态失败: {e}")
            return {}

    def test_single_generation(self, race: str, style: str, prompt: str, seed: int):
        """测试单个肖像生成"""
        print(f"\n正在测试生成: {race} - {style}")
        print(f"提示词: {prompt[:80]}...")

        # 创建文件名前缀（style已经是完整的image_name，不需要再加race前缀）
        filename_prefix = style.replace(" ", "_")

        # 创建工作流
        workflow = self.create_simple_workflow(prompt, seed, filename_prefix)

        # 提交到ComfyUI
        prompt_id = self.submit_to_comfyui(workflow)
        if prompt_id:
            print(f"✓ 已提交到ComfyUI，任务ID: {prompt_id}")
            return True
        else:
            print(f"✗ 提交失败")
            return False

    def batch_test_generation(
        self, csv_file: str = "test_portrait_prompts.csv", start_id: str = None
    ):
        """批量测试生成

        Args:
            csv_file: CSV文件路径
            start_id: 开始生成的图片ID，如果为None则从头开始
        """
        if not os.path.exists(csv_file):
            print(f"CSV文件不存在: {csv_file}")
            return

        with open(csv_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            prompts = list(reader)

        # 如果指定了start_id，找到对应的索引
        start_index = 0
        if start_id:
            for i, row in enumerate(prompts):
                if row["图片ID"] == start_id:
                    start_index = i
                    break
            else:
                print(f"未找到ID为 {start_id} 的记录")
                return
            print(f"从ID {start_id} 开始继续生成...")
        else:
            print(f"开始测试生成 {len(prompts)} 个肖像...")

        success_count = 0
        for i in range(start_index, len(prompts)):
            row = prompts[i]
            race = row["种族"]
            image_name = row["图片名称"]
            prompt = row["提示词"]
            seed = int(row["Seed"])

            if self.test_single_generation(race, image_name, prompt, seed):
                success_count += 1

            # 避免过于频繁的请求
            time.sleep(1)

        print(f"\n测试完成！成功提交 {success_count}/{len(prompts)} 个任务")
        print("请检查ComfyUI界面查看生成结果")

    def regenerate_specific_id(
        self, csv_file: str = "test_portrait_prompts.csv", target_id: str = None
    ):
        """重新生成特定ID的图片

        Args:
            csv_file: CSV文件路径
            target_id: 要重新生成的图片ID
        """
        if not os.path.exists(csv_file):
            print(f"CSV文件不存在: {csv_file}")
            return

        if not target_id:
            print("请指定要重新生成的图片ID")
            return

        with open(csv_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            prompts = list(reader)

        # 查找目标ID的记录
        target_row = None
        for row in prompts:
            if row["图片ID"] == target_id:
                target_row = row
                break

        if not target_row:
            print(f"未找到ID为 {target_id} 的记录")
            return

        print(f"重新生成ID {target_id} 的图片...")
        print(f"角色信息: {target_row['种族']} - {target_row['图片名称']}")

        race = target_row["种族"]
        image_name = target_row["图片名称"]
        prompt = target_row["提示词"]
        seed = int(target_row["Seed"])

        if self.test_single_generation(race, image_name, prompt, seed):
            print(f"✓ 成功重新生成ID {target_id} 的图片")
        else:
            print(f"✗ 重新生成ID {target_id} 的图片失败")

    def regenerate_multiple_ids(
        self, csv_file: str = "test_portrait_prompts.csv", target_ids: list = None
    ):
        """批量重新生成多个特定ID的图片

        Args:
            csv_file: CSV文件路径
            target_ids: 要重新生成的图片ID列表
        """
        if not os.path.exists(csv_file):
            print(f"CSV文件不存在: {csv_file}")
            return

        if not target_ids:
            print("请指定要重新生成的图片ID列表")
            return

        with open(csv_file, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            prompts = list(reader)

        # 创建ID到记录的映射
        id_to_row = {row["图片ID"]: row for row in prompts}

        print(f"开始批量重新生成 {len(target_ids)} 个图片...")

        success_count = 0
        for target_id in target_ids:
            if target_id not in id_to_row:
                print(f"⚠ 未找到ID为 {target_id} 的记录，跳过")
                continue

            target_row = id_to_row[target_id]
            print(
                f"\n重新生成ID {target_id}: {target_row['种族']} - {target_row['图片名称']}"
            )

            race = target_row["种族"]
            image_name = target_row["图片名称"]
            prompt = target_row["提示词"]
            seed = int(target_row["Seed"])

            if self.test_single_generation(race, image_name, prompt, seed):
                success_count += 1
                print(f"✓ 成功重新生成ID {target_id}")
            else:
                print(f"✗ 重新生成ID {target_id} 失败")

            # 避免过于频繁的请求
            time.sleep(1)

        print(
            f"\n批量重新生成完成！成功重新生成 {success_count}/{len(target_ids)} 个图片"
        )


def main():
    """主函数"""
    print("ComfyUI 人物肖像生成器 - 灵活配置版本")
    print("=" * 50)

    try:
        # 使用默认输出目录
        print("使用默认输出目录: test_portraits")
        tester = ComfyUIPortraitTester()

        # 创建测试提示词CSV文件
        print("\n正在生成测试提示词...")

        # 检查CSV文件是否已存在
        csv_file = "test_portrait_prompts.csv"
        if os.path.exists(csv_file):
            print(f"✓ 发现现有CSV文件: {csv_file}")
            recreate = input("是否重新创建CSV文件？(y/n): ").strip().lower()
            if recreate in ["y", "yes", "是"]:
                csv_file = tester.create_test_prompts()
            else:
                print("使用现有CSV文件")
        else:
            csv_file = tester.create_test_prompts()

        # 使用示例：
        print("\n=== 使用示例 ===")
        print("1. 从头开始批量生成:")
        print("   tester.batch_test_generation()")
        print()
        print("2. 从特定ID继续生成 (比如从1500开始):")
        print("   tester.batch_test_generation(start_id='01500')")
        print()
        print("3. 重新生成特定ID的图片:")
        print("   tester.regenerate_specific_id(target_id='00001')")
        print()
        print("4. 批量重新生成多个ID:")
        print(
            "   tester.regenerate_multiple_ids(target_ids=['00001', '00002', '00003'])"
        )
        print()

        # 询问用户选择操作
        print("请选择操作:")
        print("1. 从头开始批量生成")
        print("2. 从特定ID继续生成")
        print("3. 重新生成特定ID")
        print("4. 批量重新生成多个ID")
        print("5. 仅创建CSV文件，不进行生成")

        choice = input("请输入选择 (1-5): ").strip()

        if choice == "1":
            # 检查ComfyUI连接
            print("检查ComfyUI连接...")
            if not tester.check_comfyui_connection():
                print("✗ 无法连接到ComfyUI服务器")
                print("请确保：")
                print("1. ComfyUI正在运行")
                print("2. 端口设置正确（默认8188）")
                print("3. 没有防火墙阻止连接")
                input("按回车键退出...")
                return
            print("✓ ComfyUI连接正常")
            tester.batch_test_generation()
        elif choice == "2":
            start_id = input("请输入要开始的图片ID (如: 01500): ").strip()
            if start_id:
                # 检查ComfyUI连接
                print("检查ComfyUI连接...")
                if not tester.check_comfyui_connection():
                    print("✗ 无法连接到ComfyUI服务器")
                    print("请确保：")
                    print("1. ComfyUI正在运行")
                    print("2. 端口设置正确（默认8188）")
                    print("3. 没有防火墙阻止连接")
                    input("按回车键退出...")
                    return
                print("✓ ComfyUI连接正常")
                tester.batch_test_generation(start_id=start_id)
            else:
                print("未输入ID，从头开始生成")
                tester.batch_test_generation()
        elif choice == "3":
            target_id = input("请输入要重新生成的图片ID (如: 00001): ").strip()
            if target_id:
                # 检查ComfyUI连接
                print("检查ComfyUI连接...")
                if not tester.check_comfyui_connection():
                    print("✗ 无法连接到ComfyUI服务器")
                    print("请确保：")
                    print("1. ComfyUI正在运行")
                    print("2. 端口设置正确（默认8188）")
                    print("3. 没有防火墙阻止连接")
                    input("按回车键退出...")
                    return
                print("✓ ComfyUI连接正常")
                tester.regenerate_specific_id(target_id=target_id)
            else:
                print("未输入ID，取消操作")
        elif choice == "4":
            ids_input = input(
                "请输入要重新生成的图片ID列表，用逗号分隔 (如: 00001,00002,00003): "
            ).strip()
            if ids_input:
                target_ids = [id.strip() for id in ids_input.split(",")]
                # 检查ComfyUI连接
                print("检查ComfyUI连接...")
                if not tester.check_comfyui_connection():
                    print("✗ 无法连接到ComfyUI服务器")
                    print("请确保：")
                    print("1. ComfyUI正在运行")
                    print("2. 端口设置正确（默认8188）")
                    print("3. 没有防火墙阻止连接")
                    input("按回车键退出...")
                    return
                print("✓ ComfyUI连接正常")
                tester.regenerate_multiple_ids(target_ids=target_ids)
            else:
                print("未输入ID列表，取消操作")
        elif choice == "5":
            print("已取消测试。测试提示词CSV文件已创建，可以稍后手动运行。")
        else:
            print("无效选择，已取消测试。测试提示词CSV文件已创建，可以稍后手动运行。")

    except KeyboardInterrupt:
        print("\n\n用户中断操作")
    except Exception as e:
        print(f"\n✗ 程序执行出错: {e}")
        import traceback

        traceback.print_exc()
        input("按回车键退出...")

    print("\n程序结束")
    input("按回车键退出...")


if __name__ == "__main__":
    main()
