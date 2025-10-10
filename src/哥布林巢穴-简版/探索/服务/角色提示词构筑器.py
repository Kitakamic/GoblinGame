#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
角色提示词构筑器

实现思路（与用户体系一致）：
- 固定前缀 → 种族 → 年龄(预留) → 外貌(遍历: 发型/发色(含个性化装饰)/眼睛/胸部/身材) →
  身份(贵族/平民) → 职业(由身份限定) → 服装/盔甲/武器/道具(颜色风格库) → 职业特定表情/姿态 →
  场景氛围(职业×种族判定池) → 镜头构图 → 可选：堕落反义映射（仅替换身份相关部分，外貌保持一致）

输出：CSV（race, identity, role, prompt, seed, corrupted(optional)）
"""

import csv
import os
import random
from typing import Dict, List, Any, Tuple


BASE_PREFIX = "1girl, solo"


def get_role_allowed_races(
    role: str, identity_roles: Dict[str, List[str]]
) -> List[str]:
    """获取指定职业允许的种族列表"""
    for identity, roles in identity_roles.items():
        for role_race_str in roles:
            if "-" in role_race_str:
                role_name, races_str = role_race_str.split("-", 1)
                if role_name == role:
                    return races_str.split("/")
    return ["人类", "精灵", "狐族"]  # 默认所有种族都可以


def extract_role_options(
    shared_library: Dict[str, Dict[str, str]], role: str
) -> Dict[str, List[str]]:
    """从共通库中提取指定职业可用的选项"""
    result = {}

    for category, items in shared_library.items():
        if category == "palettes":
            # 调色盘需要特殊处理，返回逗号分隔的字符串
            palette_options = []
            for key, value in items.items():
                name_and_roles = key.split("-")
                if len(name_and_roles) == 2:
                    roles = name_and_roles[1].split("/")
                    if role in roles:
                        palette_options.append(value)
            result["palette"] = ", ".join(palette_options) if palette_options else ""
        else:
            # 其他选项返回列表
            options = []
            for key, value in items.items():
                name_and_roles = key.split("-")
                if len(name_and_roles) == 2:
                    roles = name_and_roles[1].split("/")
                    if role in roles:
                        options.append(value)
            result[category] = options

    return result


def build_complete_template() -> Dict[str, Any]:
    """构建完整的模板，包括从共通库动态生成的职业配置"""
    # 先获取基础模板
    base_template = get_base_template()

    # 为每个职业添加从共通库提取的选项
    for role_name, role_config in base_template["role_profiles"].items():
        shared_options = extract_role_options(
            base_template["shared_library"], role_name
        )
        # 合并共通库选项到职业配置中
        role_config.update(shared_options)

    return base_template


def get_template() -> Dict[str, Any]:
    """获取完整的模板（推荐使用）"""
    return build_complete_template()


def get_base_template() -> Dict[str, Any]:
    """获取基础模板（不包括动态生成的部分）"""
    return {
        "races": {
            "人类": "human girl",
            "精灵": "elf girl, pointy ears",
            "狐族": "fox girl, kemonomimi, fox ears, fox tail",
        },
        # 外貌遍历池
        "appearance": {
            "hair_style": {
                "长发": "long hair",
                "短发": "short hair",
                "卷发": "curly hair",
                "直发": "straight hair",
                "波浪发": "wavy hair",
                "双马尾": "twin tails",
                "单马尾": "ponytail",
            },
            "hair_color": {
                "金色": "blonde",
                "银色": "silver",
                "黑色": "black",
                "棕色": "brown",
                "红色": "red",
                "白色": "white",
                "蓝色": "blue",
                "绿色": "green",
                "粉色": "pink",
            },
            "eye_color": {
                "蓝色": "blue",
                "绿色": "green",
                "紫色": "purple",
                "棕色": "brown",
                "红色": "red",
                "金色": "golden",
                "银色": "silver",
            },
            "chest": {
                "小胸": "small breasts",
                "中胸": "medium chest",
                "大胸": "large chest",
            },
            "body": {
                "纤细": "slender build",
                "健美": "athletic build",
                "丰满": "curvy build",
                "娇小": "petite build",
                "高挑": "tall build",
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
            ],
        },
        # 身份 → 可选职业（身份仅用于划分，不直接进入提示词）
        "identity_roles": {
            "贵族": [
                "骑士-人类",
                "圣骑士-人类",
                "法师-人类/精灵/狐族",
                "牧师-人类",
                "女皇-人类",
                "女王-人类/精灵",
                "公主-人类/精灵",
                "王后-人类",
            ],
            "平民": [
                "游侠-人类/精灵/狐族",
                "盗贼-人类/狐族",
                "商人-人类/狐族",
                "学者-人类/精灵",
                "女吟游诗人-狐族",
                "女仆-人类/狐族",
                "战士-人类/狐族/精灵",
                "女教师-人类",
                "女医生-人类",
            ],
            "特殊": [
                "德鲁伊-精灵",
            ],
        },
        # 共通库：定义可被多个职业共享的元素
        "shared_library": {
            "expressions": {
                "神秘-法师/德鲁伊/盗贼": "mysterious",
                "平静-法师/牧师/德鲁伊/学者": "calm",
                "自信-战士/骑士/圣骑士/商人": "confident",
                "温柔-牧师/德鲁伊/学者/女仆": "gentle",
                "严肃-战士/骑士/圣骑士": "serious",
                "冷酷-战士/盗贼/游侠": "cold",
                "微笑-商人/学者/女仆": "smiling",
                "优雅-女皇/女王/公主/王后": "elegant",
                "威严-女皇/女王/王后": "majestic",
                "纯真-公主": "innocent",
                "专注-女教师/女医生": "focused",
                "艺术-女吟游诗人": "artistic",
            },
            "poses": {
                "施法-法师/牧师/德鲁伊": "casting",
                "冥想-法师/牧师/德鲁伊/学者": "meditating",
                "站立-战士/骑士/圣骑士/商人/学者/女仆": "standing",
                "战斗姿态-战士/骑士/圣骑士/游侠": "combat stance",
                "潜行-盗贼/游侠": "sneaking",
                "阅读-法师/学者/女教师": "reading",
                "祈祷-牧师/圣骑士": "praying",
                "坐姿-女皇/女王/王后": "sitting regally",
                "优雅行走-女皇/女王/公主/王后": "walking gracefully",
                "服务姿态-女仆": "serving pose",
                "教学姿态-女教师": "teaching pose",
                "治疗姿态-女医生": "healing pose",
                "演奏姿态-女吟游诗人": "performing pose",
            },
            "bg_natural": {
                "月光林地-法师/德鲁伊/游侠": "moonlit grove",
                "银色森林-法师/德鲁伊/游侠": "silver forest",
                "神圣花园-牧师/圣骑士": "sacred garden",
                "古老遗迹-法师/德鲁伊/游侠/学者": "ancient ruins",
                "幽暗森林-盗贼/游侠": "dark forest",
                "星空平原-牧师/圣骑士/游侠": "starlit plains",
            },
            "bg_building": {
                "魔法学院-法师/学者": "magical academy",
                "星辰塔-法师": "stellar tower",
                "大教堂-牧师/圣骑士": "cathedral",
                "皇宫-战士/骑士/圣骑士/商人/女皇/女王/王后": "royal palace",
                "图书馆-法师/学者/女教师": "library",
                "月神殿-牧师/德鲁伊": "lunar temple",
                "城堡-战士/骑士/公主": "castle",
                "村庄-商人/游侠/女仆": "village",
                "医院-女医生": "hospital",
                "学校-女教师": "school",
                "酒馆-女吟游诗人/商人": "tavern",
                "宫殿花园-女皇/女王/公主/王后": "palace garden",
            },
            "lighting": {
                "月光-法师/牧师/德鲁伊/游侠": "moonlight",
                "星光-法师/牧师/德鲁伊": "starlight",
                "魔法光-法师/德鲁伊": "magical light",
                "神圣光-牧师/圣骑士": "divine light",
                "阳光-战士/骑士/圣骑士/商人/游侠": "sunlight",
                "火光-战士/商人": "flame light",
            },
            "atmosphere": {
                "神秘-法师/德鲁伊/盗贼": "mystical",
                "神圣-牧师/圣骑士": "divine",
                "魔法-法师/德鲁伊": "magical",
                "史诗-战士/骑士/圣骑士/游侠": "epic",
                "浪漫-牧师/骑士/商人": "romantic",
                "宁静-牧师/德鲁伊/学者": "peaceful",
                "黑暗-盗贼": "dark",
                "自然-德鲁伊/游侠": "natural",
            },
            "palettes": {
                "银蓝配色-法师/牧师": "silver-blue color scheme",
                "白金配色-法师/牧师/圣骑士/女皇/女王": "white-gold color scheme",
                "紫罗兰配色-法师": "violet color scheme",
                "银绿配色-德鲁伊/游侠": "silver-green color scheme",
                "绿棕配色-德鲁伊/游侠": "green-brown color scheme",
                "钢红配色-战士": "steel-red color scheme",
                "白银配色-骑士/圣骑士/学者": "white-silver color scheme",
                "蓝金配色-骑士/学者": "blue-gold color scheme",
                "黑紫配色-盗贼": "obsidian-purple color scheme",
                "暗绿配色-盗贼/游侠": "dark-green color scheme",
                "金棕配色-商人": "gold-brown color scheme",
                "皇室紫配色-女皇/女王/王后": "royal purple color scheme",
                "粉金配色-公主": "rose-gold color scheme",
                "温暖棕配色-女仆": "warm brown color scheme",
                "学院蓝配色-女教师": "academy blue color scheme",
                "医疗白配色-女医生": "medical white color scheme",
                "彩虹配色-女吟游诗人": "rainbow color scheme",
            },
        },
        # 职业配置（融合成套服装+武器道具等为一条：attire_sets，每条≥10个tags）
        "role_profiles": {
            "法师": {
                "attire_sets": [
                    {
                        "name": "奥术华服",
                        "normal": "luxurious robes, arcane garments, enchanted silk, wizard hat, ornate staff, spellbook, glowing runes, silk gloves, arcane sash, jeweled pendant, mystical accessories",
                        "corrupted": "transparent silk robes, revealing arcane garments, wizard fascinator, ornate staff, chained spellbook, glowing sigils, sheer gloves, exposed sash, jeweled choker, provocative mystical accessories",
                    },
                    {
                        "name": "绣纹法袍",
                        "normal": "elegant mage attire, embroidered robe, arcane sigils, crystal staff, floating grimoire, velvet cape, silk inner layers, rune earrings, belt pouches, talisman necklace, arcane jewelry",
                        "corrupted": "revealing mage attire, sheer embroidered robe, glowing sigils, crystal staff, floating grimoire, cropped velvet cape, lace inner layers, rune earrings, waist chains, talisman choker, seductive arcane jewelry",
                    },
                    {
                        "name": "大法术师套装",
                        "normal": "high sorceress ensemble, satin robe, gilded trims, ornate wand, tome with clasps, brocade cape, beaded cords, magical rings, arcane brooch, spell components, mystical ornaments",
                        "corrupted": "alluring sorceress set, sheer satin robe, gilded trims, ornate wand, chained tome, slit brocade cape, beaded cords, gemstone rings, arcane brooch, exposed components, provocative ornaments",
                    },
                ],
            },
            "牧师": {
                "attire_sets": [
                    {
                        "name": "圣职礼装",
                        "normal": "holy vestments, blessed robes, ceremonial attire, gilded crosier, holy symbol, rosary beads, silk stole, embroidered trim, reliquary pendant, lace gloves, sacred accessories",
                        "corrupted": "revealing holy vestments, slit blessed robes, ceremonial attire, gilded crosier, inverted holy symbol, chained rosary, sheer stole, embroidered trims, reliquary choker, lace gloves, provocative sacred accessories",
                    },
                    {
                        "name": "神圣典仪",
                        "normal": "divine ceremonial set, luminous robe, golden embroidery, ornate staff, prayer book, beaded rosary, ribboned sash, veil, signet ring, halo accessory, sanctified ornaments",
                        "corrupted": "blasphemous ceremonial set, sheer luminous robe, golden embroidery, ornate staff, chained prayer book, beaded rosary, ribboned waist chain, veil fascinator, signet ring, halo motif jewelry, alluring sanctified ornaments",
                    },
                ],
            },
            "德鲁伊": {
                "attire_sets": [
                    {
                        "name": "自然法袍",
                        "normal": "druidic robes, nature garb, ranger cloak, oak staff, vine adornments, glowing leaves, leather satchel, wooden talisman, bead necklace, nature charms, feather accents",
                        "corrupted": "sheer druidic robes, revealing nature garb, cropped cloak, oak staff, vine adornments, glowing leaves, waist satchel, wooden talisman, bead chains, exposed charms, feather accents",
                    },
                    {
                        "name": "林地祭司",
                        "normal": "forest priestess outfit, leaf-embroidered mantle, braided cords, carved staff, seed pouch, bark wristbands, moss trim, antler pin, woven belt, herbal kit, natural trinkets",
                        "corrupted": "alluring forest priestess set, slit mantle, braided cords, carved staff, seed pouch, bark wristbands, moss trim, antler pin, woven belt chain, exposed herbal kit, sensual trinkets",
                    },
                ],
            },
            "战士": {
                "attire_sets": [
                    {
                        "name": "纹章钢甲",
                        "normal": "ornate plate armor, gilded chainmail, armored surcoat, longsword, scabbard, banner tassels, metal gorget, leather belts, riveted gauntlets, crest brooch, battlefield accessories",
                        "corrupted": "torn plate armor, revealing chainmail, cut-out surcoat, longsword, scabbard, banner tassels, metal gorget, waist straps, exposed gauntlets, crest brooch, provocative battlefield accessories",
                    },
                    {
                        "name": "典仪武备",
                        "normal": "ceremonial warrior gear, polished breastplate, engraved pauldrons, greatsword, dagger, cloak clasp, heraldic tabard, belt pouches, thigh guards, cape, knightly ornaments",
                        "corrupted": "alluring warrior gear, polished breastplate, engraved pauldrons, greatsword, dagger, cloak clasp, slit tabard, belt chains, thigh straps, cape, seductive knightly ornaments",
                    },
                ],
            },
            "骑士": {
                "attire_sets": [
                    {
                        "name": "骑士纹章装",
                        "normal": "full plate armor, heraldic surcoat, ornate shield, rapier, cape, plume helm, leather straps, engraved vambraces, silk scarf, crest medallion, chivalric accessories",
                        "corrupted": "torn plate armor, heraldic cut-out surcoat, ornate shield, rapier, cape, plume helm, waist straps, engraved vambraces, silk scarf, crest medallion, alluring chivalric accessories",
                    },
                    {
                        "name": "比武甲饰",
                        "normal": "tournament armor, polished cuirass, lance, buckler, sash, embroidered cape, plume, signet ring, scabbard, chain belt, ceremonial knight ornaments",
                        "corrupted": "revealing tournament armor, polished cuirass, lance, buckler, sash, embroidered cape, plume, signet ring, scabbard, chain belt, seductive knight ornaments",
                    },
                ],
            },
            "盗贼": {
                "attire_sets": [
                    {
                        "name": "暗影皮装",
                        "normal": "leather armor, dark cloak, hood, dagger, shortsword, lockpicks, throwing knives, belt pouches, fingerless gloves, face mask, stealth accessories",
                        "corrupted": "tight leather armor, revealing cloak, hood, dagger, shortsword, lockpicks, throwing knives, belt chains, fingerless gloves, face veil, provocative stealth accessories",
                    },
                    {
                        "name": "潜行者套装",
                        "normal": "shadowy outfit, fitted leathers, hidden blades, smoke vials, grappling hook, soft boots, wrist sheath, utility belt, cloak pin, shadow emblem, rogue ornaments",
                        "corrupted": "seductive shadow outfit, fitted leathers, hidden blades, smoke vials, grappling hook, soft boots, wrist sheath, chain belt, cloak pin, shadow emblem, alluring rogue ornaments",
                    },
                ],
            },
            "游侠": {
                "attire_sets": [
                    {
                        "name": "林行者装束",
                        "normal": "ranger outfit, forest cloak, leather armor, bow, quiver, hunter tools, thigh strap, bracers, hood, utility pouches, trail accessories",
                        "corrupted": "revealing ranger outfit, cropped cloak, leather armor, bow, quiver, hunter tools, thigh strap, bracers, hood, chain pouches, trail accessories",
                    },
                    {
                        "name": "荒野斥候",
                        "normal": "woodland scout set, green mantle, reinforced leathers, shortbow, arrow case, knife, arm guard, waterproof cloak, rope, map tube, ranger ornaments",
                        "corrupted": "alluring scout set, slit mantle, reinforced leathers, shortbow, arrow case, knife, arm guard, cropped cloak, rope, map tube, seductive ranger ornaments",
                    },
                ],
            },
            "圣骑士": {
                "attire_sets": [
                    {
                        "name": "神圣卫甲",
                        "normal": "holy plate, divine armor, ceremonial gear, longsword, blessed shield, sacred sigil, tabard, chain belt, silk lining, cape, sanctified accessories",
                        "corrupted": "revealing holy plate, divine armor, ceremonial gear, longsword, blessed shield, sacred sigil, slit tabard, chain belt, silk lining, cape, alluring sanctified accessories",
                    },
                    {
                        "name": "光辉骑誓",
                        "normal": "radiant paladin set, polished mail, greatsword, reliquary, heraldic cape, white gloves, sash, brooch, circlet, prayer book, holy ornaments",
                        "corrupted": "seductive paladin set, polished mail, greatsword, reliquary, heraldic cape, white gloves, sash, brooch, circlet, chained prayer book, alluring holy ornaments",
                    },
                ],
            },
            "商人": {
                "attire_sets": [
                    {
                        "name": "行商精饰",
                        "normal": "merchant attire, traveling gear, silk garments, coin pouch, ledger, signet ring, scarf, satchel, waist purse, seal stamp, trade accessories",
                        "corrupted": "revealing merchant attire, tight traveling gear, silk garments, coin pouch, ledger, signet ring, scarf, satchel, chain purse, seal stamp, alluring trade accessories",
                    },
                    {
                        "name": "商旅华装",
                        "normal": "caravan finery, tailored vest, silk blouse, ledger book, quill case, coin strings, lace gloves, brooch, necklace, belt bag, refined ornaments",
                        "corrupted": "seductive caravan finery, tailored vest, sheer silk blouse, ledger book, quill case, coin strings, lace gloves, brooch, necklace, belt chain, alluring refined ornaments",
                    },
                ],
            },
            "学者": {
                "attire_sets": [
                    {
                        "name": "学院书装",
                        "normal": "scholar robes, academic gown, library attire, books, quill, scroll case, ribbon bookmarks, spectacles, chain necklace, cuffed sleeves, scholarly accessories",
                        "corrupted": "transparent scholar robes, revealing gown, library attire, books, quill, scroll case, ribbon bookmarks, spectacles, chain necklace, cuffed sleeves, alluring scholarly accessories",
                    },
                    {
                        "name": "研究者套衫",
                        "normal": "researcher set, tailored robe, ink-stained cuffs, notebook, feather quill, document tube, seal wax, lace collar, velvet ribbon, satchel, academic ornaments",
                        "corrupted": "seductive researcher set, tailored robe, ink-stained cuffs, notebook, feather quill, document tube, seal wax, lace collar, velvet ribbon, chain satchel, alluring academic ornaments",
                    },
                ],
            },
            "女皇": {
                "attire_sets": [
                    {
                        "name": "帝国华服",
                        "normal": "imperial regalia, ornate crown, royal scepter, ermine cape, silk gown, golden embroidery, jeweled belt, royal rings, ceremonial gloves, pearl necklace, imperial ornaments",
                        "corrupted": "seductive imperial regalia, ornate crown, royal scepter, revealing ermine cape, sheer silk gown, golden embroidery, jeweled waist chain, royal rings, lace gloves, pearl choker, alluring imperial ornaments",
                    },
                    {
                        "name": "威严龙袍",
                        "normal": "majestic dragon robe, imperial crown, jade scepter, phoenix embroidery, silk train, golden threads, royal brooch, ceremonial bracers, signet ring, court jewelry, sovereign accessories",
                        "corrupted": "alluring dragon robe, imperial crown, jade scepter, phoenix embroidery, slit silk train, golden threads, royal brooch, ceremonial bracers, signet ring, court jewelry, provocative sovereign accessories",
                    },
                ],
            },
            "女王": {
                "attire_sets": [
                    {
                        "name": "王室礼服",
                        "normal": "royal gown, jeweled tiara, royal staff, velvet mantle, court dress, silver embroidery, royal sash, ceremonial gloves, crown jewels, pearl earrings, regal accessories",
                        "corrupted": "revealing royal gown, jeweled tiara, royal staff, cropped velvet mantle, slit court dress, silver embroidery, royal waist chain, lace gloves, crown jewels, pearl earrings, seductive regal accessories",
                    },
                    {
                        "name": "统治华装",
                        "normal": "sovereign attire, golden circlet, ceremonial rod, brocade robe, royal insignia, silk lining, jeweled clasp, formal gloves, royal pendant, court ornaments, majestic accessories",
                        "corrupted": "alluring sovereign attire, golden circlet, ceremonial rod, revealing brocade robe, royal insignia, sheer silk lining, jeweled clasp, formal gloves, royal choker, court ornaments, provocative majestic accessories",
                    },
                ],
            },
            "公主": {
                "attire_sets": [
                    {
                        "name": "公主裙装",
                        "normal": "princess gown, delicate tiara, fairy tale dress, silk ribbons, lace trim, pearl accessories, satin gloves, flower crown, jeweled brooch, court shoes, innocent ornaments",
                        "corrupted": "revealing princess gown, delicate tiara, slit fairy tale dress, silk ribbons, lace trim, pearl accessories, satin gloves, flower crown, jeweled brooch, court shoes, alluring innocent ornaments",
                    },
                    {
                        "name": "花园礼服",
                        "normal": "garden party dress, floral tiara, pastel gown, ribbon sash, embroidered flowers, pearl necklace, lace gloves, hair ribbons, delicate jewelry, garden accessories, youthful ornaments",
                        "corrupted": "seductive garden dress, floral tiara, sheer pastel gown, ribbon waist chain, embroidered flowers, pearl choker, lace gloves, hair ribbons, delicate jewelry, garden accessories, provocative youthful ornaments",
                    },
                ],
            },
            "王后": {
                "attire_sets": [
                    {
                        "name": "后冠华服",
                        "normal": "queen consort gown, ornate crown, royal mantle, ceremonial dress, golden embroidery, royal jewels, silk gloves, court sash, regal necklace, formal accessories, queenly ornaments",
                        "corrupted": "alluring consort gown, ornate crown, revealing royal mantle, slit ceremonial dress, golden embroidery, royal jewels, silk gloves, court waist chain, regal choker, formal accessories, seductive queenly ornaments",
                    },
                    {
                        "name": "宫廷盛装",
                        "normal": "court regalia, jeweled diadem, state robe, formal gown, silver threading, royal brooch, ceremonial bracers, court gloves, pendant necklace, palace jewelry, dignified accessories",
                        "corrupted": "provocative court regalia, jeweled diadem, revealing state robe, slit formal gown, silver threading, royal brooch, ceremonial bracers, court gloves, pendant choker, palace jewelry, alluring dignified accessories",
                    },
                ],
            },
            "女仆": {
                "attire_sets": [
                    {
                        "name": "女仆制服",
                        "normal": "maid uniform, white apron, black dress, lace headband, white stockings, mary jane shoes, feather duster, cleaning supplies, service bell, uniform accessories, domestic ornaments",
                        "corrupted": "revealing maid uniform, sheer white apron, short black dress, lace headband, thigh-high stockings, mary jane shoes, feather duster, cleaning supplies, service bell, uniform accessories, seductive domestic ornaments",
                    },
                    {
                        "name": "管家装束",
                        "normal": "head maid attire, formal apron, long dress, service cap, white gloves, pocket watch, key ring, silver tray, uniform brooch, service accessories, professional ornaments",
                        "corrupted": "alluring head maid attire, cropped formal apron, slit long dress, service cap, white gloves, pocket watch, key ring, silver tray, uniform brooch, service accessories, provocative professional ornaments",
                    },
                ],
            },
            "女教师": {
                "attire_sets": [
                    {
                        "name": "教师套装",
                        "normal": "teacher outfit, formal blazer, long skirt, white blouse, reading glasses, lesson plan, chalk, pointer stick, book bag, academic accessories, educational ornaments",
                        "corrupted": "seductive teacher outfit, cropped blazer, short skirt, sheer white blouse, reading glasses, lesson plan, chalk, pointer stick, book bag, academic accessories, alluring educational ornaments",
                    },
                    {
                        "name": "学院制服",
                        "normal": "academy uniform, scholarly robe, formal dress, graduation cap, textbooks, quill pen, ink bottle, academic medal, school badge, educational jewelry, scholarly accessories",
                        "corrupted": "revealing academy uniform, sheer scholarly robe, slit formal dress, graduation cap, textbooks, quill pen, ink bottle, academic medal, school badge, educational jewelry, provocative scholarly accessories",
                    },
                ],
            },
            "女医生": {
                "attire_sets": [
                    {
                        "name": "医师白袍",
                        "normal": "doctor coat, medical uniform, stethoscope, medical bag, surgical gloves, name badge, clipboard, medical instruments, white shoes, medical accessories, healthcare ornaments",
                        "corrupted": "revealing doctor coat, tight medical uniform, stethoscope, medical bag, surgical gloves, name badge, clipboard, medical instruments, white shoes, medical accessories, seductive healthcare ornaments",
                    },
                    {
                        "name": "治疗师装",
                        "normal": "healer robes, medical sash, herb pouch, healing crystals, bandages, medicine bottles, treatment tools, white gloves, medical pendant, healing accessories, therapeutic ornaments",
                        "corrupted": "alluring healer robes, revealing medical sash, herb pouch, healing crystals, bandages, medicine bottles, treatment tools, white gloves, medical choker, healing accessories, provocative therapeutic ornaments",
                    },
                ],
            },
            "女吟游诗人": {
                "attire_sets": [
                    {
                        "name": "吟游装束",
                        "normal": "bard outfit, colorful cloak, musical instrument, feathered hat, performance costume, song sheets, lute strings, artistic accessories, performance jewelry, entertainer ornaments, creative accessories",
                        "corrupted": "seductive bard outfit, revealing colorful cloak, musical instrument, feathered hat, slit performance costume, song sheets, lute strings, artistic accessories, performance jewelry, alluring entertainer ornaments, provocative creative accessories",
                    },
                    {
                        "name": "艺术家服",
                        "normal": "artist attire, paint-stained apron, creative tools, sketch pad, color palette, brushes, artistic beret, canvas bag, inspiration jewelry, creative accessories, bohemian ornaments",
                        "corrupted": "alluring artist attire, cropped paint-stained apron, creative tools, sketch pad, color palette, brushes, artistic beret, canvas bag, inspiration choker, creative accessories, seductive bohemian ornaments",
                    },
                ],
            },
        },
        # 镜头构图
        "camera": {
            "shot": {
                "全身": "full body",
                "半身": "half body",
                "四分之三": "three-quarter view",
            },
            "angle": {
                "平视": "eye level",
                "俯视": "slight high angle",
                "仰视": "slight low angle",
            },
            "composition": {
                "优雅构图": "elegant composition",
                "对称构图": "symmetric composition",
                "三分法": "rule of thirds",
            },
        },
        # 堕落反义映射：不再改写服装块（已内置于每个职业的 attire_sets 正常/堕落版）
        # 注意：外貌相关（发型/发色/眼睛/身材/胸部）保持不变
        "corruption": {
            "expressions": {
                "mysterious": "lustful mystery",
                "calm": "seductive calm",
                "confident": "erotic confidence",
                "gentle": "seductive gentleness",
                "serious": "lustful intensity",
                "cold": "seductive aloofness",
                "smiling": "seductive smile",
            },
            "poses": {
                "casting": "seductive casting",
                "meditating": "provocative meditating",
                "standing": "graceful alluring stance",
                "praying": "provocative praying",
                "battle ready": "alluring battle pose",
                "offensive": "seductive offensive stance",
                "defensive": "seductive defensive stance",
                "walking": "alluring walking",
                "alert": "seductive alert",
                "reading": "seductive reading",
                "working": "alluring working",
            },
            "lighting": {
                "moonlight": "sensual moonlight",
                "starlight": "sensual starlight",
                "magical light": "sensual magical light",
                "divine light": "forbidden divine glow",
                "sunlight": "soft erotic sunlight",
                "flame light": "hot flame light",
            },
            "atmosphere": {
                "mystical": "seductive mystical",
                "divine": "blasphemous divine",
                "magical": "seductive magical",
                "natural": "sensual natural",
                "battle": "seductive battle",
                "epic": "seductively epic",
                "dark": "tempting darkness",
                "romantic": "erotic romantic",
                "peaceful": "sensual peaceful",
            },
        },
    }


def pick_identity_and_role(
    template: Dict[str, Any], identity_fixed: str = None, role_fixed: str = None
) -> Tuple[str, str]:
    identity = identity_fixed or random.choice(list(template["identity_roles"].keys()))
    roles = template["identity_roles"][identity]
    role_with_races = role_fixed or random.choice(roles)

    # 提取纯净的职业名称（去掉种族限制部分）
    if "-" in role_with_races:
        role = role_with_races.split("-")[0]
    else:
        role = role_with_races

    return identity, role


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


def corrupt_identity_descriptors(
    template: Dict[str, Any], selected: Dict[str, str]
) -> Dict[str, str]:
    """将身份相关词映射为堕落反义，但保留外貌一致性。"""
    corr = template["corruption"]

    def map_field(field: str, value: str) -> str:
        mapping = corr.get(field, {})
        return mapping.get(value, value)

    corrupted = dict(selected)
    # attire_block 使用子串替换；其余按映射替换
    if "attire_block" in corrupted and corrupted["attire_block"]:
        mapping = corr.get("attire_block", {})
        text = corrupted["attire_block"]
        for k, v in mapping.items():
            text = text.replace(k, v)
        corrupted["attire_block"] = text
    for key in ["expression", "pose", "lighting", "atmosphere"]:
        if key in corrupted and corrupted[key]:
            field = (
                "expressions"
                if key == "expression"
                else ("poses" if key == "pose" else key)
            )
            corrupted[key] = map_field(field, corrupted[key])
    # 背景只作为文本，不做强映射（可直接在提示中加露骨修饰）
    return corrupted


def build_prompt(
    template: Dict[str, Any],
    race: str,
    appearance_pick: Dict[str, str],
    identity: str,
    role: str,
    profile_selected: Dict[str, str],
    camera_pick: Dict[str, str],
    corrupted: bool = False,
) -> str:
    race_text = template["races"][race]
    hair_style = appearance_pick["hair_style"]
    hair_color = appearance_pick["hair_color"]
    eye_color = appearance_pick["eye_color"]
    chest = appearance_pick["chest"]
    body = appearance_pick["body"]
    hair_acc = appearance_pick.get("hair_acc", "")

    sel = dict(profile_selected)
    if corrupted:
        # 直接切换到堕落版服装块（若存在）
        if sel.get("attire_block_corrupted"):
            sel["attire_block"] = sel["attire_block_corrupted"]
        sel = corrupt_identity_descriptors(template, sel)

    scene = sel.get("background", "")

    parts = [
        BASE_PREFIX,
        race_text,
        f"{hair_color} hair",
        hair_style + (f", {hair_acc}" if hair_acc else ""),
        f"{eye_color} eyes",
        chest,
        body,
        # 身份/职业相关（合并后的服装+武器道具块）
        sel.get("attire_block"),
        sel.get("expression"),
        sel.get("pose"),
        scene,
        sel.get("lighting"),
        sel.get("atmosphere"),
        sel.get("palette_text"),
        # 镜头
        camera_pick.get("shot"),
        camera_pick.get("angle"),
        camera_pick.get("composition"),
        # 风格/质量（轻量）
        "artistic, high quality, detailed",
    ]
    return ", ".join([p for p in parts if p])


def generate(
    limit_per_identity: int = 5,
    traverse_appearance: bool = True,
    include_corrupted_variant: bool = True,
    identity_fixed: str = None,
    role_fixed: str = None,
) -> List[Dict[str, Any]]:
    t = get_template()

    # 预构造外貌遍历列表（可控规模：示例抽样组合）
    hair_styles = list(t["appearance"]["hair_style"].values())
    hair_colors = list(t["appearance"]["hair_color"].values())
    eye_colors = list(t["appearance"]["eye_color"].values())
    chests = list(t["appearance"]["chest"].values())
    bodies = list(t["appearance"]["body"].values())
    hair_accs = t["appearance"]["hair_accessories"]

    races = list(t["races"].keys())
    identities = (
        [identity_fixed] if identity_fixed else list(t["identity_roles"].keys())
    )

    camera = t["camera"]

    results: List[Dict[str, Any]] = []

    for identity in identities:
        count = 0
        while count < limit_per_identity:
            # 先选择职业
            identity_pick, role = pick_identity_and_role(
                t, identity_fixed=identity, role_fixed=role_fixed
            )

            # 根据职业限制选择种族
            allowed_races = get_role_allowed_races(role, t["identity_roles"])
            available_races = [race for race in races if race in allowed_races]

            if not available_races:
                # 如果没有可用种族，跳过这个职业
                continue

            race = random.choice(available_races)
            profile = pick_role_profile(t, role)

            # 外貌遍历/抽样
            appearance_pick = {
                "hair_style": random.choice(hair_styles),
                "hair_color": random.choice(hair_colors),
                "eye_color": random.choice(eye_colors),
                "chest": random.choice(chests),
                "body": random.choice(bodies),
                "hair_acc": random.choice(hair_accs),
            }

            # 职业派生元素 + 身份细化 + 颜色库（身份仅用于选择职业，不直接进提示；服装套为 role.attire_sets）
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
            corrupted_text = attire_entry.get("corrupted")
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
                "attire_block_corrupted": (
                    f"{palette_text}, {corrupted_text}"
                    if (palette_text and corrupted_text)
                    else (corrupted_text or None)
                ),
            }

            # 随机选择视角，但确保正常版本和堕落版本使用相同的镜头参数
            camera_pick = {
                "shot": random.choice(list(camera["shot"].values())),
                "angle": random.choice(list(camera["angle"].values())),
                "composition": random.choice(list(camera["composition"].values())),
            }

            seed = random.randint(10000, 99999)
            prompt = build_prompt(
                t,
                race,
                appearance_pick,
                identity_pick,
                role,
                profile_selected,
                camera_pick,
                corrupted=False,
            )
            results.append(
                {
                    "race": race,
                    "identity": identity_pick,
                    "role": role,
                    "prompt": prompt,
                    "seed": seed,
                    "corrupted": False,
                }
            )

            if include_corrupted_variant:
                c_prompt = build_prompt(
                    t,
                    race,
                    appearance_pick,
                    identity_pick,
                    role,
                    profile_selected,
                    camera_pick,
                    corrupted=True,
                )
                results.append(
                    {
                        "race": race,
                        "identity": identity_pick,
                        "role": role,
                        "prompt": c_prompt,
                        "seed": seed + 1,
                        "corrupted": True,
                    }
                )

            count += 1

    return results


def write_csv(rows: List[Dict[str, Any]], csv_path: str) -> None:
    fieldnames = ["race", "identity", "role", "prompt", "seed", "corrupted"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)


def main():
    print("角色提示词构筑器 - 生成示例")
    out_csv = "role_prompts_demo.csv"
    rows = generate(limit_per_identity=3, include_corrupted_variant=True)
    write_csv(rows, out_csv)
    print(f"已生成: {out_csv}，共 {len(rows)} 条。")


if __name__ == "__main__":
    main()
