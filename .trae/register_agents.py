#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Trae IDE 智能体注册辅助脚本
自动读取 .trae/agents/ 目录下的智能体配置并生成注册命令
"""

import os
import json

def read_agent_file(filepath):
    """读取智能体配置文件"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 解析 frontmatter
    if content.startswith('---'):
        end_idx = content.find('---', 3)
        if end_idx != -1:
            frontmatter = content[3:end_idx].strip()
            body = content[end_idx+3:].strip()
            
            # 解析 frontmatter
            metadata = {}
            for line in frontmatter.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    metadata[key.strip()] = value.strip()
            
            return {
                'name': metadata.get('name', os.path.basename(filepath).replace('.md', '')),
                'description': metadata.get('description', ''),
                'prompt': body
            }
    
    return {
        'name': os.path.basename(filepath).replace('.md', ''),
        'description': '',
        'prompt': content
    }

def generate_agent_list():
    """生成智能体列表"""
    agents_dir = '.trae/agents'
    agent_files = [f for f in os.listdir(agents_dir) if f.endswith('.md') and not f.startswith('_')]
    
    agents = []
    for filename in agent_files:
        filepath = os.path.join(agents_dir, filename)
        if filename != 'scheduling-rules.md':  # 排除调度规则文件
            agent = read_agent_file(filepath)
            agents.append(agent)
    
    return agents

def generate_registration_script(agents):
    """生成注册脚本"""
    script = f"""#!/bin/bash
# Trae IDE 智能体注册脚本
# 共 {len(agents)} 个智能体需要注册

echo "开始注册智能体..."

"""
    for agent in agents:
        script += f"""
# ========================================
# 注册 {agent['name']}
# 描述: {agent['description']}
# ========================================
echo "正在注册: {agent['name']}"
# 提示词已保存到: .trae/agents/{agent['name']}.md

"""
    
    script += """
echo "注册完成！"
echo ""
echo "请按照以下步骤手动创建智能体:"
echo "1. 打开 AI 面板 (Ctrl+U)"
echo "2. 输入 @ 并点击 '创建智能体'"
echo "3. 名称: 复制上方智能体名称"
echo "4. 提示词: 复制 .trae/agents/ 对应文件内容"
echo "5. 工具: 仅勾选 '阅读'"
"""
    
    return script

def main():
    agents = generate_agent_list()
    
    # 生成注册脚本
    script = generate_registration_script(agents)
    with open('.trae/register_agents.sh', 'w', encoding='utf-8') as f:
        f.write(script)
    
    # 生成智能体索引 JSON
    index = {
        "version": "1.0",
        "agents": agents
    }
    with open('.trae/agents_index.json', 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    print("智能体索引文件已生成: .trae/agents_index.json")
    print("注册脚本已生成: .trae/register_agents.sh")
    print("")
    print("需要注册的智能体列表:")
    for agent in agents:
        print(f"  - {agent['name']}: {agent['description']}")
    print("")
    print("请手动在 Trae IDE 中创建这些智能体")

if __name__ == '__main__':
    main()
