#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ComfyUI 人物肖像生成器 - 灵活配置版本
用于生成少量人物肖像进行测试
"""

import requests
import json
import csv
import os
import time
import sys
from typing import List, Dict, Any

# 设置控制台编码为UTF-8
if sys.platform == "win32":
    import codecs

    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

# 导入角色提示词构筑器
from 角色提示词构筑器 import (
    get_template,
    generate as generate_role_prompts,
    build_prompt,
    get_role_allowed_races,
)


class ComfyUIPortraitTester:
    def __init__(
        self, comfyui_url: str = "http://localhost:8188", custom_output_dir: str = None
    ):
        self.comfyui_url = comfyui_url
        self.output_dir = custom_output_dir or "test_portraits"
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
            "race": "人类",  # 固定种族：人类/精灵/狐族，None=遍历所有
            # === 外貌特征 ===
            "hair_style": "双马尾",  # 固定发型：长发/短发/卷发/直发/波浪发/双马尾/单马尾，None=遍历所有
            "hair_color": "银色",  # 固定发色：金色/银色/黑色/棕色/红色/白色/蓝色/绿色/粉色，None=遍历所有
            "eye_color": "蓝色",  # 固定眼色：蓝色/绿色/紫色/棕色/红色/金色/银色，None=遍历所有
            "body_type": "纤细",  # 固定体型：纤细/健美/丰满/娇小/高挑，None=遍历所有
            "chest_size": "中胸",  # 固定胸部：小胸/中胸/大胸，None=遍历所有
            # === 职业 ===
            "role": None,  # 固定职业根据种族限制：法师/牧师/德鲁伊/战士/骑士/盗贼/游侠/圣骑士/商人/学者/女皇/女王/公主/王后/女仆/女教师/女医生/女吟游诗人，None=遍历所有
            # === 镜头设置 ===
            "shot": None,  # 固定镜头距离：全身/半身/四分之三，None=随机选择
            "angle": None,  # 固定镜头角度：平视/俯视/仰视，None=随机选择
            "composition": None,  # 固定构图：优雅构图/对称构图/三分法，None=随机选择
            # === 其他选项 ===
            "include_corrupted": True,  # 是否包含堕落版本
            "max_combinations": 50,  # 最大生成组合数（防止遍历过多）
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
        all_hair_styles = list(template["appearance"]["hair_style"].keys())
        all_hair_colors = list(template["appearance"]["hair_color"].keys())
        all_eye_colors = list(template["appearance"]["eye_color"].keys())
        all_body_types = list(template["appearance"]["body"].keys())
        all_chest_sizes = list(template["appearance"]["chest"].keys())
        all_roles = list(template["role_profiles"].keys())

        # 根据配置决定遍历范围
        races = [config["race"]] if config["race"] else all_races
        hair_styles = (
            [config["hair_style"]] if config["hair_style"] else all_hair_styles
        )
        hair_colors = (
            [config["hair_color"]] if config["hair_color"] else all_hair_colors
        )
        eye_colors = [config["eye_color"]] if config["eye_color"] else all_eye_colors
        body_types = [config["body_type"]] if config["body_type"] else all_body_types
        chest_sizes = (
            [config["chest_size"]] if config["chest_size"] else all_chest_sizes
        )
        # 应用种族-职业限制
        if config["role"]:
            roles = [config["role"]]
        else:
            # 如果指定了种族，则限制职业；否则使用所有职业
            if config["race"]:
                allowed_roles = []
                for role in all_roles:
                    allowed_races = get_role_allowed_races(
                        role, template["identity_roles"]
                    )
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
            f"发型: {'固定-' + config['hair_style'] if config['hair_style'] else f'遍历-{len(hair_styles)}个'}"
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
        print(
            f"胸部: {'固定-' + config['chest_size'] if config['chest_size'] else f'遍历-{len(chest_sizes)}个'}"
        )
        if config["role"]:
            print(f"职业: 固定-{config['role']}")
        else:
            if config["race"]:
                print(f"职业: 种族限制-{len(roles)}个 (适合{config['race']})")
            else:
                print(f"职业: 遍历-{len(roles)}个")
        print(f"镜头: {'固定' if config['shot'] else '随机选择'}")
        if config["include_corrupted"]:
            print("包含堕落版本")

        # 计算总组合数
        total_combinations = (
            len(races)
            * len(hair_styles)
            * len(hair_colors)
            * len(eye_colors)
            * len(body_types)
            * len(chest_sizes)
            * len(roles)
        )
        if total_combinations > config["max_combinations"]:
            print(
                f"\n警告：总组合数 {total_combinations} 超过限制 {config['max_combinations']}，将随机采样"
            )

        prompts = []
        combination_count = 0

        for race in races:
            for hair_style in hair_styles:
                for hair_color in hair_colors:
                    for eye_color in eye_colors:
                        for body_type in body_types:
                            for chest_size in chest_sizes:
                                for role in roles:
                                    if combination_count >= config["max_combinations"]:
                                        break

                                    # 构建外貌选择
                                    appearance_pick = {
                                        "hair_style": template["appearance"][
                                            "hair_style"
                                        ][hair_style],
                                        "hair_color": template["appearance"][
                                            "hair_color"
                                        ][hair_color],
                                        "eye_color": template["appearance"][
                                            "eye_color"
                                        ][eye_color],
                                        "chest": template["appearance"]["chest"][
                                            chest_size
                                        ],
                                        "body": template["appearance"]["body"][
                                            body_type
                                        ],
                                        "hair_acc": random.choice(
                                            template["appearance"]["hair_accessories"]
                                        ),
                                    }

                                    # 获取职业配置
                                    profile = template["role_profiles"][role]

                                    # 使用角色提示词构筑器的逻辑
                                    from 角色提示词构筑器 import pick_scene_from_profile

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
                                        "attire_block_corrupted": (
                                            f"{palette_text}, {corrupted_text}"
                                            if (palette_text and corrupted_text)
                                            else (corrupted_text or None)
                                        ),
                                    }

                                    # 镜头选择（随机选择，但确保正常版本和堕落版本使用相同的镜头参数）
                                    camera_pick = {
                                        "shot": (
                                            template["camera"]["shot"][config["shot"]]
                                            if config["shot"]
                                            else random.choice(
                                                list(
                                                    template["camera"]["shot"].values()
                                                )
                                            )
                                        ),
                                        "angle": (
                                            template["camera"]["angle"][config["angle"]]
                                            if config["angle"]
                                            else random.choice(
                                                list(
                                                    template["camera"]["angle"].values()
                                                )
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
                                        corrupted=False,
                                    )

                                    # 风格名称
                                    style_name = f"{role}_{race}_{hair_style}_{hair_color}_{chest_size}"

                                    prompts.append([race, style_name, prompt, seed])

                                    # 如果需要堕落版本
                                    if config["include_corrupted"]:
                                        c_prompt = build_prompt(
                                            template,
                                            race,
                                            appearance_pick,
                                            "贵族",
                                            role,
                                            profile_selected,
                                            camera_pick,
                                            corrupted=True,
                                        )
                                        prompts.append(
                                            [
                                                race,
                                                f"{style_name}_corrupted",
                                                c_prompt,
                                                seed + 1,
                                            ]
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
        with open(csv_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["race", "style", "prompt", "seed"])
            writer.writerows(test_prompts)

        print(f"已创建测试提示词CSV文件: {csv_file}")
        print(f"总共包含 {len(test_prompts)} 个测试提示词")
        return csv_file

    def set_comfyui_output_dir(self, output_dir: str):
        """设置ComfyUI的输出目录"""
        try:
            # 确保目录存在
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
                print(f"✓ 创建输出目录: {output_dir}")

            # 方法1: 通过系统设置API
            response = requests.post(
                f"{self.comfyui_url}/system_stats",
                json={"output_directory": output_dir},
            )

            if response.status_code == 200:
                print(f"✓ ComfyUI输出目录已设置为: {output_dir}")
                return True
            else:
                print(f"✗ API设置失败，尝试其他方法...")
                return self.copy_files_from_default(output_dir)

        except requests.exceptions.RequestException as e:
            print(f"✗ 设置ComfyUI输出目录失败: {e}")
            return self.copy_files_from_default(output_dir)

    def copy_files_from_default(self, target_dir: str):
        """从默认输出目录复制文件到目标目录"""
        try:
            import shutil
            import glob

            # ComfyUI默认输出目录
            default_output = "ComfyUI/output"
            if not os.path.exists(default_output):
                default_output = "output"  # 备用路径

            if os.path.exists(default_output):
                print(f"✓ 将文件从 {default_output} 复制到 {target_dir}")

                # 确保目标目录存在
                if not os.path.exists(target_dir):
                    os.makedirs(target_dir)

                # 复制所有png文件
                png_files = glob.glob(os.path.join(default_output, "*.png"))
                for png_file in png_files:
                    filename = os.path.basename(png_file)
                    target_path = os.path.join(target_dir, filename)
                    shutil.copy2(png_file, target_path)
                    print(f"✓ 复制: {filename}")

                return True
            else:
                print(f"✗ 找不到默认输出目录: {default_output}")
                return False

        except Exception as e:
            print(f"✗ 复制文件失败: {e}")
            return False

    def create_simple_workflow(
        self,
        prompt: str,
        seed: int,
        filename_prefix: str = "test_portrait",
        output_dir: str = None,
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
                "inputs": {"filename_prefix": filename_prefix, "images": ["8", 0]},
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

        # 创建文件名前缀
        filename_prefix = f"{race}_{style}".replace(" ", "_")

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

    def batch_test_generation(self, csv_file: str = "test_portrait_prompts.csv"):
        """批量测试生成"""
        if not os.path.exists(csv_file):
            print(f"CSV文件不存在: {csv_file}")
            return

        with open(csv_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            prompts = list(reader)

        print(f"开始测试生成 {len(prompts)} 个肖像...")

        success_count = 0
        for i, row in enumerate(prompts):
            race = row["race"]
            style = row["style"]
            prompt = row["prompt"]
            seed = int(row["seed"])

            if self.test_single_generation(race, style, prompt, seed):
                success_count += 1

            # 避免过于频繁的请求
            time.sleep(1)

        print(f"\n测试完成！成功提交 {success_count}/{len(prompts)} 个任务")
        print("请检查ComfyUI界面查看生成结果")


def main():
    """主函数"""
    print("ComfyUI 人物肖像生成器 - 灵活配置版本")
    print("=" * 50)

    try:
        # 询问输出目录
        custom_output = input("请输入自定义输出目录路径 (直接回车使用默认): ").strip()
        if custom_output:
            print(f"使用自定义输出目录: {custom_output}")
            tester = ComfyUIPortraitTester(custom_output_dir=custom_output)
        else:
            print("使用默认输出目录: test_portraits")
            tester = ComfyUIPortraitTester()

        # 创建测试提示词CSV文件
        print("\n正在生成测试提示词...")
        csv_file = tester.create_test_prompts()

        # 询问是否开始测试
        choice = input("\n是否开始测试生成？(y/n): ")
        if choice.lower() == "y":
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
            tester.batch_test_generation(csv_file)

            # 如果使用了自定义输出目录，尝试复制文件
            if custom_output:
                tester.copy_files_from_default(custom_output)
        else:
            print("已取消测试。测试提示词CSV文件已创建，可以稍后手动运行。")

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
