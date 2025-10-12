#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试修复后的单位绘制生成器
"""

import sys
import os

# 添加项目路径
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(current_dir, "src", "哥布林巢穴-简版", "探索", "服务")
sys.path.insert(0, src_path)

from 单位绘制生成器 import UnitPortraitGenerator


def test_fixed_generator():
    """测试修复后的生成器"""
    print("=== 测试修复后的单位绘制生成器 ===")

    try:
        # 创建生成器实例
        generator = UnitPortraitGenerator()

        if not generator.units:
            print("没有找到单位数据")
            return

        print(f"成功加载 {len(generator.units)} 个单位数据")

        # 测试生成一个单位的提示词
        test_unit = generator.units[0]
        print(f"\n测试单位: {test_unit.get('name', 'N/A')}")

        result = generator.generate_unit_prompt(
            name=test_unit.get("name", "Test"),
            race=test_unit.get("race", "Test"),
            country=test_unit.get("country", "Test"),
            unit_type=test_unit.get("unit_type", "physical"),
            level=test_unit.get("level", "1"),
            avatar=test_unit.get("avatar", ""),
        )

        print("✓ 生成成功")
        print(f"  种族: {result['race']}")
        print(f"  国家: {result['country']}")
        print(f"  装束名称: {result['attire_name']}")
        print(f"  提示词长度: {len(result['prompt'])} 字符")
        print(f"  提示词预览: {result['prompt'][:100]}...")

        print("\n✓ 所有测试通过！")

    except Exception as e:
        print(f"✗ 测试失败: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_fixed_generator()
