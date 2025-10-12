#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
单位绘制生成器 - 参考角色绘制生成器结构
按照用户要求重新设计：
1. 前缀、种族、外貌部分全部照搬角色绘制器
2. 将国家势力风格作为背景
3. 每个单位1种套装
4. 姿态、表情等以单位类型分共用库
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


class UnitPortraitGenerator:
    def __init__(self, csv_file: str = None):
        self.csv_file = csv_file or self.find_csv_file()
        self.units = []
        self.load_units()

    def find_csv_file(self) -> str:
        """查找CSV文件"""
        possible_paths = [
            "src/哥布林巢穴-简版/战斗/类型/单位数据表.csv",
            "E:/SillyTavern/games/GoblinGame/src/哥布林巢穴-简版/战斗/类型/单位数据表.csv",
        ]

        for path in possible_paths:
            if os.path.exists(path):
                return path

        return possible_paths[0]  # 返回默认路径

    def load_units(self):
        """加载单位数据"""
        try:
            with open(self.csv_file, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                all_units = list(reader)

            # 过滤掉哥布林单位
            self.units = [
                unit for unit in all_units if unit.get("race", "").lower() != "哥布林"
            ]

            print(f"成功读取CSV文件，共 {len(all_units)} 行数据")
            print(f"已加载 {len(self.units)} 个单位数据 (已过滤哥布林单位)")

        except Exception as e:
            print(f"读取CSV文件时出错: {e}")
            import traceback

            traceback.print_exc()

    def get_unit_template(self) -> Dict[str, Any]:
        """获取单位模板配置 - 参考角色绘制生成器结构"""
        return {
            # 基础前缀 - 照搬角色绘制生成器
            "base_prefix": "score_9,score_8_up,score_7_up,source_anime,<lora:Super_Eye_Detailer_By_Stable_Yogi_SDPD0.safetensors:1:0.8>,<lora:add-detail-xl.safetensors:1:1>,<lora:Expressive_H-000001.safetensors:1:0.9>, ",
            # 种族基础描述 - 照搬角色绘制生成器并扩展
            "races": {
                "人类": "1girl, solo, human girl",
                "永恒精灵": "1girl, solo, elf girl, pointy ears, ethereal beauty",
                "黑暗精灵": "1girl, solo, dark elf girl, pointy ears, brown skin",
                "狐族": "1girl, solo, fox girl, kemonomimi, {hair_color} fox ears, {hair_color} fox tail",
                "哥布林": "1girl, solo, goblin girl, green skin, small stature",
                "天使": "1girl, solo, angel girl, white wings, divine beauty, celestial grace",
                "亡灵": "undead warrior, skeletal features, dark aura, intimidating presence",
                "魔族": "1girl, solo, demon girl, horns, dark aura, seductive charm",
            },
            # 外貌遍历池 - 照搬角色绘制生成器
            "appearance": {
                "hair_length": {
                    "短发": "short hair",
                    "中发": "medium hair",
                    "长发": "long hair",
                },
                "hair_style": {
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
                },
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
            # 国家/势力风格 - 作为背景使用
            "countries": {
                "月冠王国": "elegant silver-white theme, lunar motifs, ethereal beauty, moonstone jewelry, celestial symbols",
                "人类国家": "classical medieval theme, noble appearance, royal elegance, heraldic symbols, courtly grace",
                "哥布林巢穴": "primitive tribal theme, wild appearance, natural materials, bone ornaments, tribal markings",
                "天界": "divine white-gold theme, celestial beauty, holy radiance, angelic wings, divine symbols",
                "遗迹": "ancient ruins theme, mysterious aura, weathered appearance, ancient artifacts, mystical runes",
                "九尾神社": "traditional japanese theme, shrine maiden style, spiritual elegance, fox motifs, sacred symbols",
                "红叶商盟": "merchant theme, practical clothing, trade accessories, coin jewelry, merchant symbols",
                "暗影密会": "dark mysterious theme, shadowy appearance, occult symbols, shadow magic, dark arts",
                "地狱": "infernal theme, demonic appearance, dark power, demonic symbols, hellfire aura",
            },
            # 单位特定套装配置 - 每个单位1种套装，10个tags
            "unit_attires": {
                # 永恒精灵单位
                "永恒精灵游侠": "beautiful elf ranger girl, forest cloak, silver longbow, quiver arrows, leather armor, moonstone dagger, nature amulet, ethereal beauty, woodland boots, forest charm",
                "永恒精灵平民": "charming elf commoner girl, simple dress, woven basket, flower crown, delicate jewelry, wooden staff, nature pouch, ethereal grace, herbal satchel, woodland sandals",
                "永恒精灵法师": "mystical elf mage girl, flowing robes, crystal staff, spellbook, moonstone ring, magical orb, arcane symbols, ethereal beauty, enchanted cloak, mystical pendant",
                "永恒精灵德鲁伊": "nature elf druid girl, leaf robes, wooden staff, vine whip, earth amulet, nature pouch, herbal bag, natural beauty, forest boots, druidic symbols",
                # 天使单位
                "天使祭司": "divine angel priestess girl, white robes, golden cross, holy book, angelic wings, blessed staff, sacred symbols, divine beauty, heavenly crown, blessed jewelry",
                "守护天使": "beautiful guardian angel girl, divine armor, holy sword, angelic shield, angelic wings, blessed gauntlets, sacred symbols, celestial beauty, divine helm, blessed armor",
                "战斗天使": "fierce battle angel girl, combat armor, holy spear, angelic wings, divine sword, blessed shield, war symbols, celestial beauty, battle helm, divine weapons",
                "炽天使": "magnificent seraphim girl, golden armor, divine sword, six wings, holy shield, blessed weapons, heavenly symbols, divine majesty, celestial crown, sacred power",
                # 人类单位
                "人类守卫": "beautiful human guard girl, chainmail armor, sword shield, guard helm, leather boots, metal gauntlets, heraldic symbols, noble bearing, guard uniform, protective gear",
                "人类士兵": "charming human soldier girl, military armor, spear sword, soldier helm, combat boots, leather gloves, military symbols, martial beauty, soldier pack, battle gear",
                "人类圣骑士": "noble human paladin girl, plate armor, blessed sword, holy shield, steel helm, armored boots, divine symbols, sacred beauty, blessed armor, holy weapons",
                "人类商人": "elegant human merchant girl, fine clothing, coin purse, trade scales, merchant bag, business ledger, trade symbols, commercial beauty, merchant hat, trade tools",
                "人类骑士": "gallant human knight girl, polished armor, lance sword, knight helm, metal boots, steel gauntlets, heraldic symbols, chivalric beauty, knight cloak, royal weapons",
                "人类农民": "simple human peasant girl, rustic dress, farming hoe, harvest basket, straw hat, work boots, agricultural tools, natural beauty, farming apron, country gear",
                "人类牧师": "devout human priestess girl, holy vestments, blessed staff, holy book, sacred symbols, prayer beads, religious accessories, divine beauty, priestess crown, blessed items",
                "人类民兵": "brave human militia girl, simple armor, spear sword, leather helm, cloth boots, basic weapons, militia symbols, martial beauty, militia uniform, defensive gear",
                "人类弓箭手": "skilled human archer girl, leather armor, longbow arrows, quiver bag, archer gloves, hunting knife, archery symbols, marksman beauty, forest cloak, precision tools",
                "人类法师": "wise human mage girl, scholarly robes, spellbook wand, magical staff, arcane symbols, spell components, mystical accessories, arcane beauty, mage hat, magical tools",
                # 亡灵单位
                "骷髅战士": "undead skeleton warrior, ancient armor, bone sword, rusted shield, skull helm, bone weapons, necromantic symbols, skeletal beauty, death magic, cursed weapons",
                "骷髅仆从": "undead skeleton servant, tattered robes, bone dagger, servant bag, skull mask, bone tools, necromantic symbols, skeletal form, death magic, cursed items",
                "骷髅法师": "undead skeleton mage, dark robes, bone staff, necromantic tome, skull crown, death symbols, skeletal beauty, dark magic, cursed staff, necromantic tools",
                "僵尸": "undead zombie creature, decayed clothing, rusty weapon, rotting flesh, zombie mask, death symbols, necromantic aura, undead beauty, cursed items, decayed gear",
                # 狐族单位
                "狐族巫女": "beautiful fox shrine maiden girl, white kimono, sacred staff, shrine bells, fox ears tail, prayer beads, shrine symbols, mystical beauty, traditional sandals, divine tools",
                "狐族守卫": "charming fox guard girl, traditional armor, katana sword, wooden shield, fox ears tail, guard helm, shrine symbols, martial beauty, traditional boots, protective gear",
                "狐族商人": "elegant fox merchant girl, fine kimono, trade scales, coin purse, fox ears tail, merchant bag, trade symbols, commercial beauty, traditional sandals, business tools",
                "狐族航海家": "adventurous fox sailor girl, nautical clothing, cutlass sword, compass map, fox ears tail, sailor hat, maritime symbols, sea beauty, sailing boots, navigation tools",
                "狐族弓箭手": "skilled fox archer girl, traditional outfit, bamboo bow, arrow quiver, fox ears tail, archer gloves, shrine symbols, marksman beauty, traditional boots, hunting gear",
                "狐族法师": "mystical fox mage girl, traditional robes, magical fan, spell scrolls, fox ears tail, mystical symbols, shrine accessories, arcane beauty, traditional sandals, magical tools",
                "狐族村民": "simple fox villager girl, traditional clothing, farming tools, harvest basket, fox ears tail, straw hat, shrine symbols, natural beauty, traditional sandals, village gear",
                # 黑暗精灵单位
                "黑暗精灵战士": "seductive dark elf warrior girl, dark armor, curved sword, dark shield, brown skin, pointy ears, dark weapons, shadow symbols, fierce beauty, dark magic gear",
                "黑暗精灵奴隶": "submissive dark elf slave girl, revealing clothing, chains collar, slave collar, brown skin, pointy ears, bondage gear, dark symbols, seductive beauty, slave accessories",
                "黑暗精灵祭司": "mysterious dark elf priestess girl, dark robes, shadow staff, dark tome, brown skin, pointy ears, shadow symbols, mystical beauty, dark magic, cursed tools",
                "黑暗精灵弓箭手": "stealthy dark elf archer girl, dark leather armor, dark bow, poison arrows, brown skin, pointy ears, shadow weapons, dark symbols, marksman beauty, stealth gear",
                "黑暗精灵法师": "enchanting dark elf mage girl, dark robes, shadow staff, dark grimoire, brown skin, pointy ears, shadow magic, dark symbols, arcane beauty, cursed tools",
                "黑暗精灵刺客": "deadly dark elf assassin girl, dark stealth gear, dual daggers, poison vials, brown skin, pointy ears, hidden weapons, shadow symbols, lethal beauty, assassin tools",
                # 魔族单位
                "恶魔战士": "seductive demon warrior girl, infernal armor, demonic sword, hellfire shield, horns tail, demonic weapons, hellfire symbols, fierce beauty, infernal gear, cursed weapons",
                "恶魔领主": "magnificent demon lord girl, royal demonic armor, demonic scepter, hellfire crown, horns tail, powerful weapons, hellfire symbols, commanding beauty, infernal majesty, dark dominion",
            },
            # 单位类型配置 - 姿态表情等共用库
            "unit_types": {
                "physical": {
                    "expressions": [
                        "confident beauty",
                        "serious elegance",
                        "fierce charm",
                        "determined grace",
                        "noble bearing",
                        "heroic stance",
                    ],
                    "poses": [
                        "elegant combat stance",
                        "graceful standing",
                        "beautiful battle ready",
                        "heroic pose",
                        "defensive stance",
                    ],
                    "lighting": [
                        "sunlight",
                        "flame light",
                        "battle fire",
                        "divine light",
                    ],
                    "atmosphere": ["epic", "intense", "heroic", "noble", "divine"],
                },
                "magical": {
                    "expressions": [
                        "mysterious beauty",
                        "calm elegance",
                        "focused grace",
                        "enchanting charm",
                        "divine serenity",
                        "magical aura",
                    ],
                    "poses": [
                        "graceful casting",
                        "elegant meditating",
                        "beautiful channeling",
                        "divine blessing",
                        "mystical communion",
                    ],
                    "lighting": [
                        "magical light",
                        "moonlight",
                        "starlight",
                        "divine light",
                    ],
                    "atmosphere": [
                        "mystical",
                        "magical",
                        "ethereal",
                        "divine",
                        "peaceful",
                    ],
                },
            },
            # 镜头配置 - 统一全身像，战斗风格
            "camera": {
                "shot": {
                    "全身像": "full_shot",  # 统一使用全身像
                },
                "angle": {
                    "正面视角": "front view",
                    "侧面视角": "from_side",
                    "动态角度": "dynamic_angle",
                    "倾斜角度": "dutch angle",
                },
                "composition": {
                    "战斗构图": "battle composition",
                    "动态构图": "dynamic composition",
                    "力量构图": "powerful composition",
                },
                "character_action": {
                    "战斗姿态": "battle stance",
                    "准备攻击": "ready to attack",
                    "防御姿态": "defensive stance",
                    "警戒状态": "alert stance",
                    "战斗准备": "combat ready",
                    "武器举起": "weapon raised",
                    "战斗凝视": "battle stare",
                    "战斗怒吼": "battle cry",
                    "战斗冲锋": "battle charge",
                    "战斗守护": "battle guard",
                },
            },
        }

    def generate_unit_prompt(
        self,
        name: str,
        race: str,
        country: str,
        unit_type: str,
        level: str,
        avatar: str,
    ) -> Dict[str, Any]:
        """生成单个单位的提示词 - 参考角色绘制生成器结构"""
        template = self.get_unit_template()

        # 获取种族描述
        race_text = template["races"].get(race, "beautiful girl")

        # 处理狐族的动态发色替换
        if race == "狐族" and "{hair_color}" in race_text:
            # 随机选择发色
            hair_colors = list(template["appearance"]["hair_color"].keys())
            hair_color = random.choice(hair_colors)
            race_text = race_text.format(hair_color=hair_color)

        # 获取国家风格 - 作为背景使用
        country_style = template["countries"].get(country, "classical theme")

        # 获取单位类型配置
        type_config = template["unit_types"].get(
            unit_type, template["unit_types"]["physical"]
        )

        # 随机选择外貌特征（亡灵单位跳过外貌描述）
        if race != "亡灵":
            hair_length = random.choice(
                list(template["appearance"]["hair_length"].keys())
            )
            hair_style = random.choice(
                list(template["appearance"]["hair_style"].keys())
            )
            hair_color = random.choice(
                list(template["appearance"]["hair_color"].keys())
            )
            eye_color = random.choice(list(template["appearance"]["eye_color"].keys()))
            body_type = random.choice(list(template["appearance"]["body_type"].keys()))
            hair_accessory = random.choice(template["appearance"]["hair_accessories"])
            hair_bangs = random.choice(
                list(template["appearance"]["hair_bangs"].keys())
            )

            # 构建外貌描述
            hair_length_text = template["appearance"]["hair_length"][hair_length]
            hair_style_text = template["appearance"]["hair_style"][hair_style]
            hair_color_text = template["appearance"]["hair_color"][hair_color][
                "solid"
            ]  # 使用单色
            eye_color_text = template["appearance"]["eye_color"][eye_color]
            body_type_text = template["appearance"]["body_type"][body_type]
            hair_bangs_text = template["appearance"]["hair_bangs"][hair_bangs]

            # 构建发型部分
            hair_parts = [hair_length_text, hair_style_text]
            if hair_bangs_text:
                hair_parts.append(hair_bangs_text)
            if hair_accessory:
                hair_parts.append(hair_accessory)
            hair_description = ", ".join(hair_parts)
        else:
            # 亡灵单位不使用外貌描述
            hair_color_text = ""
            hair_description = ""
            eye_color_text = ""
            body_type_text = ""

        # 获取单位特定套装，如果没有则使用默认
        attire = template["unit_attires"].get(
            name,
            f"beautiful {race} {unit_type} girl, elegant attire, graceful beauty, charming appearance, stylish clothing, refined accessories, lovely jewelry, feminine charm, attractive features, appealing design",
        )

        # 获取单位类型配置
        expression = random.choice(type_config["expressions"])
        pose = random.choice(type_config["poses"])
        lighting = random.choice(type_config["lighting"])
        atmosphere = random.choice(type_config["atmosphere"])

        # 镜头选择 - 统一使用全身像
        shot = "full_shot"  # 固定使用全身像
        angle = random.choice(list(template["camera"]["angle"].values()))
        composition = random.choice(list(template["camera"]["composition"].values()))
        character_action = random.choice(
            list(template["camera"]["character_action"].values())
        )

        # 构建提示词
        prompt_parts = [
            template["base_prefix"],
            race_text,
        ]

        # 非亡灵单位添加外貌描述
        if race != "亡灵":
            prompt_parts.extend(
                [
                    f"{hair_color_text} hair",
                    hair_description,
                    f"{eye_color_text} eyes",
                    body_type_text,
                ]
            )

        prompt_parts.extend(
            [
                attire,
                expression,
                pose,
                country_style,  # 国家风格作为背景
                lighting,
                atmosphere,
                character_action,
                shot,
                angle,
                composition,
                "artistic, high quality, detailed",
            ]
        )

        prompt = ", ".join([p for p in prompt_parts if p])

        # 生成种子
        seed = random.randint(10000, 99999)

        return {
            "name": name,
            "race": race,
            "country": country,
            "unit_type": unit_type,
            "level": level,
            "avatar": avatar,
            "prompt": prompt,
            "seed": seed,
            "attire_name": f"{unit_type}_attire",
            "attire_set": attire,
            "expression": expression,
            "pose": pose,
            "background": country_style,
            "lighting": lighting,
            "atmosphere": atmosphere,
            "shot": shot,
            "angle": angle,
            "composition": composition,
            "character_action": character_action,
            "hair_length": hair_length if race != "亡灵" else "",
            "hair_style": hair_style if race != "亡灵" else "",
            "hair_color": hair_color if race != "亡灵" else "",
            "eye_color": eye_color if race != "亡灵" else "",
            "body_type": body_type if race != "亡灵" else "",
            "hair_accessory": hair_accessory if race != "亡灵" else "",
            "hair_bangs": hair_bangs if race != "亡灵" else "",
        }

    def generate_all_prompts(self) -> List[Dict[str, Any]]:
        """生成所有单位的提示词"""
        prompts = []
        for unit in self.units:
            try:
                prompt = self.generate_unit_prompt(
                    name=unit.get("name", "Unknown"),
                    race=unit.get("race", "Unknown"),
                    country=unit.get("country", "Unknown"),
                    unit_type=unit.get("unit_type", "physical"),
                    level=unit.get("level", "1"),
                    avatar=unit.get("avatar", ""),
                )
                prompts.append(prompt)
            except Exception as e:
                print(f"生成单位 {unit.get('name', 'Unknown')} 的提示词时出错: {e}")
        return prompts

    def generate_race_prompts(self, race: str) -> List[Dict[str, Any]]:
        """生成指定种族的单位提示词"""
        race_units = [
            unit for unit in self.units if unit.get("race", "").lower() == race.lower()
        ]
        prompts = []
        for unit in race_units:
            try:
                prompt = self.generate_unit_prompt(
                    name=unit.get("name", "Unknown"),
                    race=unit.get("race", "Unknown"),
                    country=unit.get("country", "Unknown"),
                    unit_type=unit.get("unit_type", "physical"),
                    level=unit.get("level", "1"),
                    avatar=unit.get("avatar", ""),
                )
                prompts.append(prompt)
            except Exception as e:
                print(f"生成单位 {unit.get('name', 'Unknown')} 的提示词时出错: {e}")
        return prompts

    def generate_country_prompts(self, country: str) -> List[Dict[str, Any]]:
        """生成指定国家的单位提示词"""
        country_units = [
            unit
            for unit in self.units
            if unit.get("country", "").lower() == country.lower()
        ]
        prompts = []
        for unit in country_units:
            try:
                prompt = self.generate_unit_prompt(
                    name=unit.get("name", "Unknown"),
                    race=unit.get("race", "Unknown"),
                    country=unit.get("country", "Unknown"),
                    unit_type=unit.get("unit_type", "physical"),
                    level=unit.get("level", "1"),
                    avatar=unit.get("avatar", ""),
                )
                prompts.append(prompt)
            except Exception as e:
                print(f"生成单位 {unit.get('name', 'Unknown')} 的提示词时出错: {e}")
        return prompts

    def save_prompts_to_csv(
        self, prompts: List[Dict[str, Any]], filename: str = "unit_portrait_prompts.csv"
    ):
        """保存提示词到CSV文件"""
        fieldnames = [
            "name",
            "race",
            "country",
            "unit_type",
            "level",
            "avatar",
            "attire_name",
            "attire_set",
            "expression",
            "pose",
            "background",
            "lighting",
            "atmosphere",
            "shot",
            "angle",
            "composition",
            "character_action",
            "hair_length",
            "hair_style",
            "hair_color",
            "eye_color",
            "body_type",
            "hair_accessory",
            "hair_bangs",
            "prompt",
            "seed",
        ]

        with open(filename, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(prompts)

    def create_simple_workflow(
        self,
        prompt: str,
        seed: int,
        filename_prefix: str = "unit_portrait",
    ) -> Dict[str, Any]:
        """创建适配LoRA自动加载的ComfyUI工作流"""
        workflow = {
            "3": {
                "inputs": {
                    "seed": seed,
                    "steps": 30,
                    "cfg": 8,
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
                    "width": 600,
                    "height": 1200,
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
                    "filename_number_padding": 0,
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
            response = requests.get("http://localhost:8188/system_stats", timeout=5)
            return response.status_code == 200
        except:
            return False

    def submit_to_comfyui(self, workflow: Dict[str, Any]) -> str:
        """提交工作流到ComfyUI"""
        try:
            if not self.check_comfyui_connection():
                print("✗ 无法连接到ComfyUI服务器")
                return ""

            response = requests.post(
                "http://localhost:8188/prompt", json={"prompt": workflow}, timeout=10
            )
            response.raise_for_status()
            result = response.json()
            return result.get("prompt_id", "")
        except Exception as e:
            print(f"✗ 提交到ComfyUI失败: {e}")
            return ""

    def test_single_generation(self, unit_data: Dict[str, Any]):
        """测试单个单位生成"""
        name = unit_data["name"]
        race = unit_data["race"]
        prompt = unit_data["prompt"]
        seed = unit_data["seed"]

        print(f"\n正在测试生成: {race} - {name}")
        print(f"提示词: {prompt[:80]}...")

        filename_prefix = f"{race}_{name}".replace(" ", "_")
        workflow = self.create_simple_workflow(prompt, seed, filename_prefix)

        prompt_id = self.submit_to_comfyui(workflow)
        if prompt_id:
            print(f"✓ 已提交到ComfyUI，任务ID: {prompt_id}")
            return True
        else:
            print(f"✗ 提交失败")
            return False

    def batch_generate_portraits(self, prompts: List[Dict[str, Any]]):
        """批量生成单位肖像"""
        if not self.check_comfyui_connection():
            print("✗ 无法连接到ComfyUI服务器")
            print("请确保ComfyUI正在运行")
            return

        print(f"开始批量生成 {len(prompts)} 个单位肖像...")
        success_count = 0

        for i, prompt_data in enumerate(prompts, 1):
            print(f"\n进度: {i}/{len(prompts)}")
            if self.test_single_generation(prompt_data):
                success_count += 1
            time.sleep(1)  # 避免过于频繁的请求

        print(f"\n批量生成完成！成功提交 {success_count}/{len(prompts)} 个任务")


def parse_args():
    """解析命令行参数"""
    import argparse

    parser = argparse.ArgumentParser(description="单位绘制生成器")
    parser.add_argument("--csv", help="CSV文件路径")
    parser.add_argument(
        "--output", help="输出文件名", default="unit_portrait_prompts.csv"
    )
    return parser.parse_args()


def main():
    """主函数"""
    print("单位绘制生成器 - 参考角色绘制生成器结构")
    print("=" * 50)

    args = parse_args()

    try:
        # 创建生成器
        generator = UnitPortraitGenerator(csv_file=args.csv)

        if not generator.units:
            print("没有找到单位数据，程序退出")
            return

        print(f"找到CSV文件: {generator.csv_file}")
        print(f"已加载 {len(generator.units)} 个单位数据")

        # 显示可用种族和国家
        races = list(set(unit.get("race", "") for unit in generator.units))
        countries = list(set(unit.get("country", "") for unit in generator.units))

        print(f"可用种族: {', '.join(races)}")
        print(f"可用国家: {', '.join(countries)}")

        while True:
            print("\n请选择操作:")
            print("1. 生成所有单位的提示词")
            print("2. 生成指定种族的单位提示词")
            print("3. 生成指定国家的单位提示词")
            print("4. 批量生成单位肖像")
            print("5. 测试单个单位生成")
            print("0. 退出程序")

            choice = input("请输入选择 (0-5): ").strip()

            if choice == "0":
                break
            elif choice == "1":
                prompts = generator.generate_all_prompts()
                generator.save_prompts_to_csv(prompts, args.output)
                print(f"已保存 {len(prompts)} 个提示词到 {args.output}")
            elif choice == "2":
                race = input("请输入种族名称: ").strip()
                prompts = generator.generate_race_prompts(race)
                filename = f"unit_portrait_prompts_{race}.csv"
                generator.save_prompts_to_csv(prompts, filename)
                print(f"已保存 {len(prompts)} 个提示词到 {filename}")
            elif choice == "3":
                country = input("请输入国家名称: ").strip()
                prompts = generator.generate_country_prompts(country)
                filename = f"unit_portrait_prompts_{country}.csv"
                generator.save_prompts_to_csv(prompts, filename)
                print(f"已保存 {len(prompts)} 个提示词到 {filename}")
            elif choice == "4":
                print("\n批量生成单位肖像选项:")
                print("1. 生成所有单位")
                print("2. 生成指定种族单位")
                print("3. 生成指定国家单位")
                batch_choice = input("请选择批量生成类型 (1-3): ").strip()

                if batch_choice == "1":
                    prompts = generator.generate_all_prompts()
                elif batch_choice == "2":
                    race = input("请输入种族名称: ").strip()
                    prompts = generator.generate_race_prompts(race)
                elif batch_choice == "3":
                    country = input("请输入国家名称: ").strip()
                    prompts = generator.generate_country_prompts(country)
                else:
                    print("无效选择，跳过批量生成")
                    continue

                generator.batch_generate_portraits(prompts)
            elif choice == "5":
                print("\n测试单个单位生成:")
                print("可用单位:")
                for i, unit in enumerate(generator.units[:10], 1):  # 只显示前10个
                    print(
                        f"{i}. {unit.get('name', 'N/A')} - {unit.get('race', 'N/A')} - {unit.get('country', 'N/A')}"
                    )

                print("\n输入方式:")
                print("1. 输入单位编号 (1-10)")
                print("2. 输入单位名称")

                input_method = input("请选择输入方式 (1-2): ").strip()

                test_unit = None

                if input_method == "1":
                    try:
                        unit_index = int(input("请选择单位编号 (1-10): ").strip()) - 1
                        if 0 <= unit_index < len(generator.units):
                            test_unit = generator.units[unit_index]
                        else:
                            print("无效的单位编号")
                            continue
                    except ValueError:
                        print("请输入有效的数字")
                        continue

                elif input_method == "2":
                    unit_name = input("请输入单位名称: ").strip()
                    # 查找匹配的单位
                    matching_units = [
                        unit
                        for unit in generator.units
                        if unit.get("name", "").lower() == unit_name.lower()
                    ]
                    if matching_units:
                        test_unit = matching_units[0]
                        print(f"找到单位: {test_unit.get('name', 'N/A')}")
                    else:
                        print(f"未找到名称为 '{unit_name}' 的单位")
                        continue
                else:
                    print("无效的输入方式")
                    continue

                if test_unit:
                    prompt_data = generator.generate_unit_prompt(
                        name=test_unit.get("name", "Test"),
                        race=test_unit.get("race", "Test"),
                        country=test_unit.get("country", "Test"),
                        unit_type=test_unit.get("unit_type", "physical"),
                        level=test_unit.get("level", "1"),
                        avatar=test_unit.get("avatar", ""),
                    )
                    generator.test_single_generation(prompt_data)
            else:
                print("无效选择，请重新输入")

    except KeyboardInterrupt:
        print("\n\n用户中断操作")
    except Exception as e:
        print(f"\n✗ 程序执行出错: {e}")
        import traceback

        traceback.print_exc()

    print("\n程序结束")
    input("按回车键退出...")


if __name__ == "__main__":
    main()
