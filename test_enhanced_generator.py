#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试增强版单位绘制生成器
"""

import sys
import os

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.哥布林巢穴_简版.探索.服务.单位绘制生成器 import UnitPortraitGenerator


def test_enhanced_features():
    """测试增强版特色功能"""
    print("=== 测试增强版单位绘制生成器 ===")

    # 创建生成器实例
    generator = UnitPortraitGenerator()

    # 测试数据
    test_units = [
        {
            "name": "天使祭司",
            "race": "天使",
            "country": "天界",
            "unit_type": "magical",
            "level": "3",
        },
        {
            "name": "永恒精灵游侠",
            "race": "永恒精灵",
            "country": "月冠王国",
            "unit_type": "physical",
            "level": "2",
        },
        {
            "name": "狐族巫女",
            "race": "狐族",
            "country": "九尾神社",
            "unit_type": "magical",
            "level": "3",
        },
        {
            "name": "人类骑士",
            "race": "人类",
            "country": "人类国家",
            "unit_type": "physical",
            "level": "2",
        },
        {
            "name": "亡灵战士",
            "race": "亡灵",
            "country": "遗迹",
            "unit_type": "physical",
            "level": "1",
        },
    ]

    print(f"测试 {len(test_units)} 个单位...")

    for i, unit in enumerate(test_units, 1):
        print(f"\n--- 测试单位 {i}: {unit['name']} ---")

        try:
            result = generator.generate_unit_prompt(
                name=unit["name"],
                race=unit["race"],
                country=unit["country"],
                unit_type=unit["unit_type"],
                level=unit["level"],
                avatar="test_avatar",
            )

            print(f"✓ 生成成功")
            print(f"  种族: {result['race']}")
            print(f"  国家: {result['country']}")
            print(f"  装束名称: {result['attire_name']}")
            print(f"  表情: {result['expression']}")
            print(f"  姿态: {result['pose']}")
            print(f"  背景: {result['background']}")
            print(f"  光照: {result['lighting']}")
            print(f"  氛围: {result['atmosphere']}")
            print(f"  镜头: {result['shot']}")
            print(f"  角度: {result['angle']}")
            print(f"  构图: {result['composition']}")
            print(f"  角色动作: {result['character_action']}")
            print(f"  提示词长度: {len(result['prompt'])} 字符")
            print(f"  提示词预览: {result['prompt'][:100]}...")

        except Exception as e:
            print(f"✗ 生成失败: {e}")
            import traceback

            traceback.print_exc()

    print(f"\n=== 测试完成 ===")


if __name__ == "__main__":
    test_enhanced_features()
